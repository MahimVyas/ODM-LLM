"use client";

import { useState, useRef, useEffect, memo } from "react";
import {
  Camera,
  Image as ImageIcon,
  Send,
  Sparkles,
  Loader2,
  DownloadCloud,
} from "lucide-react";
import { CreateWebWorkerMLCEngine } from "@mlc-ai/web-llm";
import { db } from "@/lib/db";
import { useLiveQuery } from "dexie-react-hooks";
import Sidebar from "@/components/Sidebar";
import SettingsModal from "@/components/SettingsModal";
import { useUIStore } from "@/lib/store";

const MessageItem = memo(({ role, content }: { role: string; content: string }) => (
  <div
    className={`flex ${role === "user" ? "justify-end" : "justify-start"}`}
  >
    <div
      className={`px-5 py-3 rounded-2xl max-w-[85%] shadow-sm ${role === "user" ? "bg-blue-600 text-white rounded-br-sm" : "bg-slate-800 text-slate-200 border border-slate-700 rounded-bl-sm"}`}
    >
      {content}
    </div>
  </div>
));
MessageItem.displayName = "MessageItem";

export default function Home() {
  const [currentChatId, setCurrentChatId] = useState<string | null>(null);
  
  // Load messages from Dexie
  const dbMessages = useLiveQuery(
    async () => {
      if (!currentChatId) return [];
      return await db.messages.where("chatId").equals(currentChatId).toArray();
    },
    [currentChatId],
    [] as any[]
  );

  const [input, setInput] = useState("");
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  // AI Engine States
  const engineRef = useRef<any>(null);
  const engineWorkerRef = useRef<Worker | null>(null);
  const visionWorkerRef = useRef<Worker | null>(null);
  const [isEngineLoading, setIsEngineLoading] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [loadingText, setLoadingText] = useState("Preparing download...");

  const [isGenerating, setIsGenerating] = useState(false);
  const [visionStatus, setVisionStatus] = useState(""); // New: tracks image analysis
  const [streamingContent, setStreamingContent] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const messages = dbMessages || [];

  // Initialize Vision Worker on component mount
  useEffect(() => {
    visionWorkerRef.current = new Worker(
      new URL("./vision-worker.ts", import.meta.url),
      {
        type: "module",
      },
    );
    return () => {
      visionWorkerRef.current?.terminate();
      engineWorkerRef.current?.terminate();
    };
  }, []);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // 1. Show the instant preview in the UI
      setSelectedImage(URL.createObjectURL(file));

      // 2. Secretly convert it to Base64 so the AI Worker can read it perfectly
      const reader = new FileReader();
      reader.onloadend = () => {
        // We attach the base64 string directly to the file input ref as a hacky
        // but effective way to store it without triggering a React re-render
        if (fileInputRef.current) {
          fileInputRef.current.dataset.base64 = reader.result as string;
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const initializeEngine = async () => {
    if (engineRef.current || isEngineLoading) return;
    
    setIsEngineLoading(true);
    setLoadingProgress(0);
    const selectedModel = "Llama-3.2-1B-Instruct-q4f16_1-MLC";

    try {
      // Terminate existing worker if any (defensive)
      engineWorkerRef.current?.terminate();
      
      const worker = new Worker(new URL("./worker.ts", import.meta.url), {
        type: "module",
      });
      engineWorkerRef.current = worker;
      
      engineRef.current = await CreateWebWorkerMLCEngine(
        worker,
        selectedModel,
        {
          initProgressCallback: (info) => {
            setLoadingProgress(Math.round(info.progress * 100));
            setLoadingText(info.text);
          },
        },
      );
    } catch (error) {
      console.error("Failed to load engine:", error);
      setLoadingText("Failed to load AI.");
      engineWorkerRef.current?.terminate();
      engineWorkerRef.current = null;
    } finally {
      setIsEngineLoading(false);
    }
  };

  const handleSend = async () => {
    if (!input.trim() && !selectedImage) return;
    if (!engineRef.current) return;

    setIsGenerating(true);
    let chatId = currentChatId;
    
    // Create new chat session if none exists
    if (!chatId) {
      chatId = crypto.randomUUID();
      await db.chats.add({
        id: chatId,
        title: input.slice(0, 30) || "New Chat",
        updatedAt: Date.now(),
      });
      setCurrentChatId(chatId);
    }

    const finalPrompt = input || "What do you see in this image?";
    const userMessage = {
      chatId,
      role: "user" as const,
      content: finalPrompt,
      hasImage: !!selectedImage,
    };

    // Save user message to DB
    await db.messages.add(userMessage);
    setInput("");

    try {
      // --- THE MULTIMODAL PIPELINE ---
      let imageCaption = "";
      if (selectedImage && visionWorkerRef.current) {
        setVisionStatus("Analyzing image...");

        imageCaption = await new Promise<string>((resolve, reject) => {
          const worker = visionWorkerRef.current!;
          worker.onmessage = (e) => {
            if (e.data.status === "complete") resolve(e.data.caption);
            else if (e.data.status === "error") reject("Vision error");
            else setVisionStatus(e.data.message);
          };
          worker.postMessage({
            type: "analyze",
            imageData: fileInputRef.current?.dataset.base64 || selectedImage,
          });
        });

        setVisionStatus("");
      }

      const promptWithContext = imageCaption 
        ? `[System Context: The user has uploaded an image. A local vision model analyzed it and detected: "${imageCaption}". Use this context to answer the user's prompt.] \n\nUser prompt: ${finalPrompt}`
        : finalPrompt;

      setSelectedImage(null);

      // Fetch history for Llama
      const apiMessages = messages.map(msg => ({ role: msg.role, content: msg.content }));
      apiMessages.push({ role: "user", content: promptWithContext });

      const chunks = await engineRef.current.chat.completions.create({
        messages: apiMessages,
        temperature: 0.7,
        stream: true,
      });

      let fullReply = "";
      setStreamingContent("");
      
      for await (const chunk of chunks) {
        const delta = chunk.choices[0]?.delta?.content || "";
        fullReply += delta;
        setStreamingContent(fullReply);
      }

      // Save assistant response to DB
      await db.messages.add({
        chatId,
        role: "assistant",
        content: fullReply,
        hasImage: false,
      });
      
      // Update chat session timestamp
      await db.chats.update(chatId, { updatedAt: Date.now() });

    } catch (error) {
      console.error("Generation error:", error);
      await db.messages.add({
        chatId,
        role: "assistant",
        content: "Error generating response.",
        hasImage: false,
      });
    } finally {
      setIsGenerating(false);
      setVisionStatus("");
      setStreamingContent("");
    }
  };

  return (
    <div className="flex h-screen bg-slate-950 text-slate-100 font-sans selection:bg-blue-500/30 overflow-hidden">
      <Sidebar 
        currentChatId={currentChatId} 
        onSelectChat={setCurrentChatId} 
      />
      <SettingsModal />

      <div className="flex-1 flex flex-col relative min-w-0">
        {/* --- Header --- */}
        <header className="absolute top-0 w-full z-10 backdrop-blur-md bg-slate-950/70 border-b border-slate-800/50">
          <div className="max-w-3xl mx-auto px-4 py-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-blue-600/20 text-blue-400 rounded-xl">
                <Sparkles size={20} />
              </div>
              <div>
                <h1 className="text-lg font-semibold tracking-tight">
                  Vision Edge
                </h1>
                <p className="text-xs text-slate-400 font-medium">
                  {engineRef.current
                    ? "AI Active - Secure & Local"
                    : "AI Offline"}
                </p>
              </div>
            </div>
            {!engineRef.current && !isEngineLoading && (
              <button
                onClick={initializeEngine}
                className="text-xs bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-full shadow-lg shadow-blue-900/20 transition flex items-center gap-2 font-medium"
              >
                <DownloadCloud size={16} /> Load AI Engine
              </button>
            )}
          </div>
        </header>

        {/* --- Download Progress Card --- */}
        {isEngineLoading && (
          <div className="absolute top-28 left-1/2 -translate-x-1/2 w-[90%] max-w-md bg-slate-900/90 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-6 shadow-2xl z-20">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-base font-semibold text-slate-100 flex items-center gap-2">
                  <Loader2 size={16} className="animate-spin text-blue-500" />{" "}
                  Downloading AI Brain
                </h3>
                <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
                  Initial ~1.2GB setup.
                </p>
              </div>
              <span className="text-blue-400 font-mono text-lg font-bold">
                {loadingProgress}%
              </span>
            </div>
            <div className="h-2.5 w-full bg-slate-800/80 rounded-full overflow-hidden mt-4 border border-slate-800">
              <div
                className="h-full bg-blue-500 transition-all duration-300"
                style={{ width: `${loadingProgress}%` }}
              />
            </div>
            <p className="text-xs font-mono text-slate-400 mt-3 truncate bg-slate-950/50 p-2 rounded-lg border border-slate-800">
              {loadingText}
            </p>
          </div>
        )}

        {/* --- Chat History Area --- */}
        <main className="flex-1 overflow-y-auto px-4 pt-24 pb-32 max-w-3xl w-full mx-auto space-y-6 scroll-smooth">
          {messages.length === 0 && !streamingContent ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-500 space-y-4 opacity-50 mt-12">
              <Camera size={48} strokeWidth={1} />
              <p className="text-sm text-center">
                {engineRef.current
                  ? "AI loaded. Upload an image."
                  : "Initialize AI engine to begin."}
              </p>
            </div>
          ) : (
            <>
              {messages.map((msg, idx) => (
                <MessageItem key={idx} role={msg.role} content={msg.content} />
              ))}
              
              {/* Streaming Message */}
              {(streamingContent || visionStatus) && (
                <div className="flex justify-start">
                  <div className="px-5 py-3 rounded-2xl max-w-[85%] shadow-sm bg-slate-800 text-slate-200 border border-slate-700 rounded-bl-sm">
                    {visionStatus && (
                      <span className="text-xs text-blue-400 flex items-center gap-2 mb-1 font-mono">
                        <Loader2 size={12} className="animate-spin" />{" "}
                        {visionStatus}
                      </span>
                    )}
                    {streamingContent || (
                      <span className="flex gap-1 items-center opacity-50 h-6">
                        {!visionStatus && (
                          <>
                            <span className="h-2 w-2 bg-slate-300 rounded-full animate-bounce"></span>
                            <span className="h-2 w-2 bg-slate-300 rounded-full animate-bounce delay-75"></span>
                            <span className="h-2 w-2 bg-slate-300 rounded-full animate-bounce delay-150"></span>
                          </>
                        )}
                      </span>
                    )}
                  </div>
                </div>
              )}
            </>
          )}
        </main>

        {/* --- Footer Input Area --- */}
        <footer className="absolute bottom-0 w-full z-10 pb-6 pt-4 px-4 bg-linear-to-t from-slate-950 via-slate-950 to-transparent">
          <div className="max-w-3xl mx-auto relative">
            {selectedImage && (
              <div className="absolute -top-24 left-0 p-2 backdrop-blur-md bg-slate-800/80 rounded-2xl border border-slate-700 shadow-xl">
                <img
                  src={selectedImage}
                  alt="Preview"
                  className="h-16 w-16 object-cover rounded-lg"
                />
                <button
                  onClick={() => setSelectedImage(null)}
                  className="absolute -top-2 -right-2 bg-slate-700 hover:bg-red-500 text-white rounded-full p-1 text-xs"
                >
                  ✕
                </button>
              </div>
            )}
            <div
              className={`flex items-center gap-2 p-2 backdrop-blur-md border rounded-full shadow-2xl transition-colors ${engineRef.current ? "bg-slate-900/80 border-slate-800 focus-within:border-slate-600" : "bg-slate-900/50 border-slate-800/50 opacity-60"}`}
            >
              <input
                type="file"
                accept="image/*"
                ref={fileInputRef}
                onChange={handleImageUpload}
                className="hidden"
                disabled={!engineRef.current}
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={!engineRef.current}
                className="p-3 text-slate-400 hover:text-slate-100 hover:bg-slate-800 rounded-full transition-all disabled:hover:bg-transparent"
              >
                <ImageIcon size={22} />
              </button>
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) =>
                  e.key === "Enter" && !isGenerating && handleSend()
                }
                placeholder={
                  engineRef.current
                    ? "Ask about the image..."
                    : "Load the AI engine first..."
                }
                disabled={isGenerating || !engineRef.current}
                className="flex-1 bg-transparent text-slate-100 placeholder-slate-500 px-2 focus:outline-none disabled:opacity-50"
              />
              <button
                onClick={handleSend}
                disabled={
                  (!input.trim() && !selectedImage) ||
                  isGenerating ||
                  !engineRef.current
                }
                className="p-3 bg-blue-600 text-white rounded-full hover:bg-blue-500 disabled:opacity-50"
              >
                <Send size={18} />
              </button>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}
