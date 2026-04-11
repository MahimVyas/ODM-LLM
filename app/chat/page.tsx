"use client";

import { useState, useRef, useEffect, memo } from "react";
import {
  Camera,
  Image as ImageIcon,
  Send,
  Sparkles,
  Loader2,
  DownloadCloud,
  ChevronDown,
  Cpu,
} from "lucide-react";
import { CreateWebWorkerMLCEngine } from "@mlc-ai/web-llm";
import ReactMarkdown from "react-markdown";
import { db } from "@/lib/db";
import { useLiveQuery } from "dexie-react-hooks";
import Sidebar from "@/components/Sidebar";
import SettingsModal from "@/components/SettingsModal";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

const AVAILABLE_MODELS = [
  {
    id: "Llama-3.2-1B-Instruct-q4f16_1-MLC",
    name: "Llama 3.2 (1B)",
    params: "1.2B",
    size: "~800 MB",
    description: "Extremely fast. Best for mobile and basic tasks."
  },
  {
    id: "Phi-3-mini-4k-instruct-q4f16_1-MLC",
    name: "Phi-3 Mini",
    params: "3.8B",
    size: "~2.2 GB",
    description: "Microsoft's compact powerhouse. Exceptional reasoning."
  },
  {
    id: "Qwen2-1.5B-Instruct-q4f16_1-MLC",
    name: "Qwen 2 (1.5B)",
    params: "1.5B",
    size: "~1.0 GB",
    description: "Highly capable and fast, great for multilingual prompts."
  },
  {
    id: "Llama-3-8B-Instruct-q4f32_1-MLC",
    name: "Llama 3 (8B)",
    params: "8.0B",
    size: "~5.0 GB",
    description: "Heavyweight model. Requires an M-series Mac or 8GB+ RAM PC."
  }
];

const MessageItem = memo(({ role, content }: { role: string; content: string }) => (
  <div
    className={`flex ${role === "user" ? "justify-end" : "justify-start"}`}
  >
    <div
      className={`px-5 py-3 rounded-2xl max-w-[85%] shadow-sm overflow-x-auto ${
        role === "user"
          ? "bg-gray-100 text-gray-950 rounded-br-sm whitespace-pre-wrap"
          : "bg-gray-900 text-gray-100 border border-gray-800 rounded-bl-sm"
      }`}
    >
      {role === "user" ? (
        content
      ) : (
        <ReactMarkdown
          components={{
            code({ node, inline, className, children, ...props }: any) {
              return !inline ? (
                <pre className="bg-gray-950 p-4 rounded-xl overflow-x-auto my-3 border border-gray-800 font-mono text-sm leading-relaxed shadow-inner">
                  <code className="text-gray-300" {...props}>
                    {children}
                  </code>
                </pre>
              ) : (
                <code className="bg-gray-800 px-1.5 py-0.5 rounded text-gray-200 font-mono text-sm" {...props}>
                  {children}
                </code>
              );
            },
            // Use div instead of p to avoid invalid nesting of pre tags (Hydration fix)
            p: ({ children }) => <div className="mb-2 last:mb-0 leading-relaxed">{children}</div>,
            ul: ({ children }) => <ul className="list-disc ml-4 mb-2 space-y-1">{children}</ul>,
            ol: ({ children }) => <ol className="list-decimal ml-4 mb-2 space-y-1">{children}</ol>,
            li: ({ children }) => <li className="leading-relaxed">{children}</li>,
            strong: ({ children }) => <strong className="font-bold text-white">{children}</strong>,
            a: ({ children, href }) => (
              <a href={href} className="text-blue-400 hover:underline transition-colors" target="_blank" rel="noopener noreferrer">
                {children}
              </a>
            ),
          }}
        >
          {content}
        </ReactMarkdown>
      )}
    </div>
  </div>
));
MessageItem.displayName = "MessageItem";

export default function Home() {
  const { status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/");
    }
  }, [status, router]);

  const [currentChatId, setCurrentChatId] = useState<string | null>(null);
  
  // Model Selector State
  const [activeModelId, setActiveModelId] = useState<string>(AVAILABLE_MODELS[0].id);
  const [isModelDropdownOpen, setIsModelDropdownOpen] = useState<boolean>(false);
  const activeModel = AVAILABLE_MODELS.find(m => m.id === activeModelId);
  
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
  const [visionStatus, setVisionStatus] = useState(""); 
  const [streamingContent, setStreamingContent] = useState("");
  const [showInitConfirm, setShowInitConfirm] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const messages = dbMessages || [];

  if (status === "loading" || status === "unauthenticated") {
    return (
      <div className="flex h-screen bg-gray-950 items-center justify-center">
        <Loader2 className="animate-spin text-gray-400" size={32} />
      </div>
    );
  }

  // Initialize Vision Worker ONLY when needed (not on mount)
  const ensureVisionWorker = () => {
    if (!visionWorkerRef.current) {
      visionWorkerRef.current = new Worker(
        new URL("../vision-worker.ts", import.meta.url),
        {
          type: "module",
        },
      );
    }
    return visionWorkerRef.current;
  };

  useEffect(() => {
    return () => {
      visionWorkerRef.current?.terminate();
      engineWorkerRef.current?.terminate();
    };
  }, []);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      ensureVisionWorker(); 
      setSelectedImage(URL.createObjectURL(file));

      const reader = new FileReader();
      reader.onloadend = () => {
        if (fileInputRef.current) {
          fileInputRef.current.dataset.base64 = reader.result as string;
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const initializeEngine = async () => {
    if (engineRef.current || isEngineLoading) return;
    setShowInitConfirm(true);
  };

  const confirmInitialize = async () => {
    setShowInitConfirm(false);
    setIsEngineLoading(true);
    setLoadingProgress(0);
    const selectedModel = activeModelId;

    try {
      engineWorkerRef.current?.terminate();
      
      const worker = new Worker(new URL("../worker.ts", import.meta.url), {
        type: "module",
      });
      engineWorkerRef.current = worker;
      
      engineRef.current = await CreateWebWorkerMLCEngine(
        worker,
        selectedModel,
        {
          initProgressCallback: (info: any) => {
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
    ensureVisionWorker(); 
    let chatId = currentChatId;
    
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

    await db.messages.add(userMessage);
    setInput("");

    try {
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

      const apiMessages = messages.map((msg: any) => ({ role: msg.role, content: msg.content }));
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

      await db.messages.add({
        chatId,
        role: "assistant",
        content: fullReply,
        hasImage: false,
      });
      
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
    <div className="flex h-screen bg-gray-950 text-gray-100 font-sans selection:bg-gray-800 overflow-hidden">
      <Sidebar 
        currentChatId={currentChatId} 
        onSelectChat={setCurrentChatId} 
      />
      <SettingsModal />

      <div className="flex-1 flex flex-col relative min-w-0">
        {/* --- Header --- */}
        <header className="absolute top-0 w-full z-20 backdrop-blur-md bg-gray-950/70 border-b border-gray-800">
          <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
            
            <div className="flex items-center gap-2">
              <div className="p-2 bg-gray-900 text-gray-100 rounded-xl border border-gray-800">
                <Sparkles size={20} />
              </div>
              <div>
                <h1 className="text-lg font-semibold tracking-tight">
                  ODMC
                </h1>
                <p className="text-xs text-gray-400 font-medium">
                  {engineRef.current ? "AI Active - Secure & Local" : "AI Offline"}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 relative">
              {!engineRef.current && !isEngineLoading && (
                <div className="relative">
                  <button
                    onClick={() => setIsModelDropdownOpen(!isModelDropdownOpen)}
                    className="flex items-center gap-2 px-3 py-2 bg-gray-900 border border-gray-800 rounded-lg text-sm font-medium hover:bg-gray-800 transition text-gray-100 shadow-sm"
                  >
                    <Cpu size={16} className="text-gray-400" />
                    <span className="hidden sm:inline">
                      {activeModel?.name}
                    </span>
                    <ChevronDown size={14} className="text-gray-500" />
                  </button>

                  {isModelDropdownOpen && (
                    <div className="absolute right-0 mt-2 w-72 bg-gray-900 border border-gray-800 rounded-xl shadow-2xl overflow-hidden z-50">
                      <div className="p-3 border-b border-gray-800 bg-gray-950/50">
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Available Local Models</p>
                      </div>
                      <div className="max-h-80 overflow-y-auto">
                        {AVAILABLE_MODELS.map((model) => (
                          <button
                            key={model.id}
                            onClick={() => {
                              setActiveModelId(model.id);
                              setIsModelDropdownOpen(false);
                            }}
                            className={`w-full text-left p-3 hover:bg-gray-800 border-b border-gray-800 last:border-0 transition-colors ${activeModelId === model.id ? 'bg-gray-800/50' : ''}`}
                          >
                            <div className="flex justify-between items-center mb-1">
                              <span className={`font-semibold text-sm ${activeModelId === model.id ? 'text-white' : 'text-gray-200'}`}>
                                {model.name}
                              </span>
                              <div className="flex gap-2 text-[10px] font-mono text-gray-400">
                                <span className="bg-gray-950 px-1.5 py-0.5 rounded border border-gray-800">{model.params}</span>
                                <span className="bg-gray-950 px-1.5 py-0.5 rounded border border-gray-800">{model.size}</span>
                              </div>
                            </div>
                            <p className="text-xs text-gray-400 leading-relaxed">
                              {model.description}
                            </p>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {!engineRef.current && !isEngineLoading && (
                <button
                  onClick={initializeEngine}
                  className="text-sm bg-gray-100 hover:bg-white text-gray-950 px-5 py-2 rounded-lg shadow-sm transition flex items-center gap-2 font-semibold"
                >
                  <DownloadCloud size={16} /> Load Engine
                </button>
              )}
            </div>
          </div>
        </header>

        {isEngineLoading && (
          <div className="absolute top-28 left-1/2 -translate-x-1/2 w-[90%] max-w-md bg-gray-900 border border-gray-800 rounded-2xl p-6 shadow-2xl z-20 animate-in fade-in zoom-in duration-300">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-base font-semibold text-gray-100 flex items-center gap-2">
                  <Loader2 size={16} className="animate-spin text-gray-400" />{" "}
                  Downloading AI Brain
                </h3>
                <p className="text-xs text-gray-400 mt-1.5 leading-relaxed">
                  {activeModel?.name} & Vision Engine
                </p>
              </div>
              <span className="text-gray-100 font-mono text-lg font-bold">
                {loadingProgress}%
              </span>
            </div>
            <div className="h-2.5 w-full bg-gray-800 rounded-full overflow-hidden mt-4 border border-gray-700">
              <div
                className="h-full bg-gray-100 transition-all duration-300"
                style={{ width: `${loadingProgress}%` }}
              />
            </div>
            <p className="text-xs font-mono text-gray-400 mt-3 truncate bg-gray-950 p-2 rounded-lg border border-gray-800">
              {loadingText}
            </p>
          </div>
        )}

        {showInitConfirm && (
          <div className="absolute inset-0 z-100 flex items-center justify-center p-4 bg-gray-950/80 backdrop-blur-sm animate-in fade-in duration-300">
            <div className="w-full max-w-md bg-gray-900 border border-gray-800 rounded-3xl shadow-2xl p-8 animate-in slide-in-from-bottom-4 duration-300">
              <div className="flex items-center gap-4 mb-6">
                <div className="p-3 bg-gray-800 text-gray-100 rounded-2xl border border-gray-700">
                  <DownloadCloud size={28} />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white">Initialize local AI?</h2>
                  <p className="text-sm text-gray-400">Models will be downloaded to your device.</p>
                </div>
              </div>

              <div className="space-y-4 mb-8">
                <div className="flex justify-between items-center p-4 bg-gray-950 border border-gray-800 rounded-2xl">
                  <div className="flex flex-col">
                    <span className="text-sm font-semibold text-gray-200">
                      {activeModel?.name}
                    </span>
                    <span className="text-xs text-gray-500">
                      {activeModel?.params} Parameters
                    </span>
                  </div>
                  <span className="text-xs font-mono text-gray-400">
                    {activeModel?.size}
                  </span>
                </div>
                <div className="flex justify-between items-center p-4 bg-gray-950 border border-gray-800 rounded-2xl">
                  <div className="flex flex-col">
                    <span className="text-sm font-semibold text-gray-200">Vision Engine</span>
                    <span className="text-xs text-gray-500">Image Analysis</span>
                  </div>
                  <span className="text-xs font-mono text-gray-400">~60MB</span>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setShowInitConfirm(false)}
                  className="flex-1 px-6 py-3 bg-gray-800 hover:bg-gray-700 text-white rounded-xl font-semibold transition-colors border border-gray-700"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmInitialize}
                  className="flex-1 px-6 py-3 bg-gray-100 hover:bg-white text-gray-950 rounded-xl font-semibold transition-colors flex items-center justify-center gap-2 shadow-sm"
                >
                  Confirm Download
                </button>
              </div>
            </div>
          </div>
        )}

        <main className="flex-1 overflow-y-auto px-4 pt-24 pb-32 max-w-3xl w-full mx-auto space-y-6 scroll-smooth">
          {messages.length === 0 && !streamingContent ? (
            <div className="h-full flex flex-col items-center justify-center text-gray-600 space-y-4 mt-12">
              <Camera size={48} strokeWidth={1} />
              <p className="text-sm text-center font-medium">
                {engineRef.current
                  ? "AI loaded. Upload an image."
                  : "Initialize AI engine to begin."}
              </p>
            </div>
          ) : (
            <>
              {messages.map((msg: any, idx: number) => (
                <MessageItem key={idx} role={msg.role} content={msg.content} />
              ))}
              
              {(streamingContent || visionStatus) && (
                <div className="flex justify-start">
                  <div className="px-5 py-3 rounded-2xl max-w-[85%] shadow-sm bg-gray-900 text-gray-100 border border-gray-800 rounded-bl-sm whitespace-pre-wrap">
                    {visionStatus && (
                      <span className="text-xs text-gray-400 flex items-center gap-2 mb-1 font-mono">
                        <Loader2 size={12} className="animate-spin" />{" "}
                        {visionStatus}
                      </span>
                    )}
                    {streamingContent || (
                      <span className="flex gap-1 items-center opacity-50 h-6">
                        {!visionStatus && (
                          <>
                            <span className="h-2 w-2 bg-gray-700 rounded-full animate-bounce"></span>
                            <span className="h-2 w-2 bg-gray-700 rounded-full animate-bounce delay-75"></span>
                            <span className="h-2 w-2 bg-gray-700 rounded-full animate-bounce delay-150"></span>
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

        <footer className="absolute bottom-0 w-full z-10 pb-6 pt-4 px-4 bg-linear-to-t from-gray-950 via-gray-950 to-transparent">
          <div className="max-w-3xl mx-auto relative">
            {selectedImage && (
              <div className="absolute -top-24 left-0 p-2 backdrop-blur-md bg-gray-900/80 rounded-2xl border border-gray-800 shadow-xl">
                <img
                  src={selectedImage}
                  alt="Preview"
                  className="h-16 w-16 object-cover rounded-lg"
                />
                <button
                  onClick={() => setSelectedImage(null)}
                  className="absolute -top-2 -right-2 bg-gray-800 hover:bg-red-500 text-white rounded-full p-1 text-xs"
                >
                  ✕
                </button>
              </div>
            )}
            <div
              className={`flex items-center gap-2 p-2 backdrop-blur-md border rounded-full shadow-lg transition-colors ${engineRef.current ? "bg-gray-900/80 border-gray-800 focus-within:border-gray-600" : "bg-gray-900/50 border-gray-800/50 opacity-60"}`}
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
                className="p-3 text-gray-400 hover:text-gray-100 hover:bg-gray-800 rounded-full transition-all disabled:hover:bg-transparent"
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
                className="flex-1 bg-transparent text-gray-100 placeholder-gray-500 px-2 focus:outline-none disabled:opacity-50"
              />
              <button
                onClick={handleSend}
                disabled={
                  (!input.trim() && !selectedImage) ||
                  isGenerating ||
                  !engineRef.current
                }
                className="p-3 bg-gray-100 text-gray-950 rounded-full hover:bg-white disabled:opacity-50 transition-colors shadow-sm"
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
