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
  Menu, // 👈 Added Menu icon for mobile
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

// 🚀 RE-STYLED TO MATCH CHATGPT: Sleek grays, wide text blocks, distinct user bubbles
const MessageItem = memo(({ role, content }: { role: string; content: string }) => (
  <div className={`flex w-full ${role === "user" ? "justify-end" : "justify-start"} mb-6`}>
    <div
      className={`px-5 py-3.5 max-w-[90%] md:max-w-[80%] overflow-x-auto ${
        role === "user"
          ? "bg-[#2F2F2F] text-gray-100 rounded-3xl whitespace-pre-wrap"
          : "bg-transparent text-gray-100"
      }`}
    >
      {role === "user" ? (
        content
      ) : (
        <ReactMarkdown
          components={{
            code({ node, inline, className, children, ...props }: any) {
              return !inline ? (
                <pre className="bg-[#0D0D0D] p-4 rounded-xl overflow-x-auto my-3 border border-white/5 font-mono text-sm leading-relaxed shadow-inner">
                  <code className="text-gray-300" {...props}>
                    {children}
                  </code>
                </pre>
              ) : (
                <code className="bg-[#2F2F2F] px-1.5 py-0.5 rounded text-gray-200 font-mono text-sm" {...props}>
                  {children}
                </code>
              );
            },
            p: ({ children }) => <div className="mb-3 last:mb-0 leading-relaxed">{children}</div>,
            ul: ({ children }) => <ul className="list-disc ml-6 mb-3 space-y-1">{children}</ul>,
            ol: ({ children }) => <ol className="list-decimal ml-6 mb-3 space-y-1">{children}</ol>,
            li: ({ children }) => <li className="leading-relaxed">{children}</li>,
            strong: ({ children }) => <strong className="font-semibold text-white">{children}</strong>,
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

  // 🚀 NEW STATE: Controls the mobile sidebar
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/");
    }
  }, [status, router]);

  const [currentChatId, setCurrentChatId] = useState<string | null>(null);
  
  const [activeModelId, setActiveModelId] = useState<string>(AVAILABLE_MODELS[0].id);
  const [isModelDropdownOpen, setIsModelDropdownOpen] = useState<boolean>(false);
  const activeModel = AVAILABLE_MODELS.find(m => m.id === activeModelId);
  
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

  if (status === "loading" || status === "unauthenticated") {
    return (
      <div className="flex h-screen bg-[#212121] items-center justify-center">
        <Loader2 className="animate-spin text-gray-400" size={32} />
      </div>
    );
  }

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
    <div className="flex h-screen bg-[#212121] text-gray-100 font-sans selection:bg-gray-700 overflow-hidden relative">
      
      {/* 📱 MOBILE SIDEBAR OVERLAY */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/60 z-40 md:hidden backdrop-blur-sm transition-opacity"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* 🧭 RESPONSIVE SIDEBAR */}
      <div className={`fixed inset-y-0 left-0 z-50 transform ${isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"} md:relative md:translate-x-0 transition-transform duration-300 ease-in-out md:flex`}>
        <Sidebar 
          currentChatId={currentChatId} 
          onSelectChat={(id) => {
            setCurrentChatId(id);
            setIsMobileMenuOpen(false); // Close mobile menu when chat selected
          }} 
        />
      </div>

      <SettingsModal />

      <div className="flex-1 flex flex-col relative min-w-0">
        
        {/* --- HEADER --- */}
        <header className="sticky top-0 w-full z-20 bg-[#212121] border-b border-white/5">
          <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
            
            <div className="flex items-center gap-3">
              {/* 🍔 HAMBURGER BUTTON (Mobile Only) */}
              <button 
                onClick={() => setIsMobileMenuOpen(true)}
                className="md:hidden p-2 -ml-2 text-gray-400 hover:text-gray-100 rounded-lg hover:bg-[#2F2F2F] transition"
              >
                <Menu size={22} />
              </button>

              <div className="hidden sm:flex p-2 bg-[#2F2F2F] text-gray-100 rounded-xl border border-white/10">
                <Sparkles size={18} />
              </div>
              <div>
                {/* 📝 CHANGED TITLE TO "ODM" */}
                <h1 className="text-lg font-semibold tracking-tight text-gray-100">
                  ODM
                </h1>
                <p className="text-xs text-gray-400 font-medium hidden sm:block">
                  {engineRef.current ? "AI Active - Secure & Local" : "AI Offline"}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 sm:gap-3 relative">
              {!engineRef.current && !isEngineLoading && (
                <div className="relative">
                  <button
                    onClick={() => setIsModelDropdownOpen(!isModelDropdownOpen)}
                    className="flex items-center gap-2 px-3 py-2 bg-[#2F2F2F] border border-white/10 rounded-lg text-sm font-medium hover:bg-[#3F3F3F] transition text-gray-100 shadow-sm"
                  >
                    <Cpu size={16} className="text-gray-400" />
                    <span className="hidden sm:inline">
                      {activeModel?.name}
                    </span>
                    <ChevronDown size={14} className="text-gray-500" />
                  </button>

                  {isModelDropdownOpen && (
                    <div className="absolute right-0 mt-2 w-64 sm:w-72 bg-[#2F2F2F] border border-white/10 rounded-xl shadow-2xl overflow-hidden z-50">
                      <div className="p-3 border-b border-white/5 bg-[#212121]/50">
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Available Models</p>
                      </div>
                      <div className="max-h-80 overflow-y-auto">
                        {AVAILABLE_MODELS.map((model) => (
                          <button
                            key={model.id}
                            onClick={() => {
                              setActiveModelId(model.id);
                              setIsModelDropdownOpen(false);
                            }}
                            className={`w-full text-left p-3 hover:bg-[#3F3F3F] border-b border-white/5 last:border-0 transition-colors ${activeModelId === model.id ? 'bg-[#3F3F3F]' : ''}`}
                          >
                            <div className="flex justify-between items-center mb-1">
                              <span className={`font-semibold text-sm ${activeModelId === model.id ? 'text-white' : 'text-gray-300'}`}>
                                {model.name}
                              </span>
                            </div>
                            <p className="text-xs text-gray-400 leading-relaxed hidden sm:block">
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
                  className="text-sm bg-gray-100 hover:bg-white text-[#212121] px-4 sm:px-5 py-2 rounded-lg shadow-sm transition flex items-center gap-2 font-semibold"
                >
                  <DownloadCloud size={16} /> <span className="hidden sm:inline">Load Engine</span>
                </button>
              )}
            </div>
          </div>
        </header>

        {isEngineLoading && (
          <div className="absolute top-28 left-1/2 -translate-x-1/2 w-[90%] max-w-md bg-[#2F2F2F] border border-white/10 rounded-2xl p-6 shadow-2xl z-20 animate-in fade-in zoom-in duration-300">
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
            <div className="h-2.5 w-full bg-[#1A1A1A] rounded-full overflow-hidden mt-4 border border-white/5">
              <div
                className="h-full bg-gray-100 transition-all duration-300"
                style={{ width: `${loadingProgress}%` }}
              />
            </div>
            <p className="text-xs font-mono text-gray-400 mt-3 truncate bg-[#212121] p-2 rounded-lg border border-white/5">
              {loadingText}
            </p>
          </div>
        )}

        {showInitConfirm && (
          <div className="absolute inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-300">
            <div className="w-full max-w-md bg-[#2F2F2F] border border-white/10 rounded-3xl shadow-2xl p-6 sm:p-8 animate-in slide-in-from-bottom-4 duration-300">
              <div className="flex items-center gap-4 mb-6">
                <div className="p-3 bg-[#212121] text-gray-100 rounded-2xl border border-white/5">
                  <DownloadCloud size={28} />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white">Initialize local AI?</h2>
                  <p className="text-sm text-gray-400">Models will be downloaded to your device.</p>
                </div>
              </div>

              <div className="space-y-4 mb-8">
                <div className="flex justify-between items-center p-4 bg-[#212121] border border-white/5 rounded-2xl">
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
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setShowInitConfirm(false)}
                  className="flex-1 px-4 sm:px-6 py-3 bg-[#212121] hover:bg-[#1A1A1A] text-white rounded-xl font-semibold transition-colors border border-white/5"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmInitialize}
                  className="flex-1 px-4 sm:px-6 py-3 bg-gray-100 hover:bg-white text-[#212121] rounded-xl font-semibold transition-colors flex items-center justify-center gap-2 shadow-sm"
                >
                  Confirm
                </button>
              </div>
            </div>
          </div>
        )}

        {/* --- MAIN CHAT AREA --- */}
        <main className="flex-1 overflow-y-auto px-4 sm:px-6 pt-12 pb-32 max-w-3xl w-full mx-auto scroll-smooth">
          {messages.length === 0 && !streamingContent ? (
            <div className="h-full flex flex-col items-center justify-center text-gray-500 space-y-4 mt-12">
              <Sparkles size={48} strokeWidth={1} />
              <h2 className="text-xl font-semibold text-gray-300">How can I help you today?</h2>
              <p className="text-sm text-center font-medium">
                {engineRef.current
                  ? "AI loaded. Upload an image or send a prompt."
                  : "Initialize AI engine to begin."}
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {messages.map((msg: any, idx: number) => (
                <MessageItem key={idx} role={msg.role} content={msg.content} />
              ))}
              
              {(streamingContent || visionStatus) && (
                <div className="flex justify-start mb-6 w-full">
                  <div className="px-5 py-3.5 max-w-[90%] md:max-w-[80%] bg-transparent text-gray-100 whitespace-pre-wrap">
                    {visionStatus && (
                      <span className="text-xs text-gray-400 flex items-center gap-2 mb-2 font-mono">
                        <Loader2 size={12} className="animate-spin" />{" "}
                        {visionStatus}
                      </span>
                    )}
                    {streamingContent || (
                      <span className="flex gap-1 items-center opacity-50 h-6">
                        {!visionStatus && (
                          <>
                            <span className="h-2 w-2 bg-gray-500 rounded-full animate-bounce"></span>
                            <span className="h-2 w-2 bg-gray-500 rounded-full animate-bounce delay-75"></span>
                            <span className="h-2 w-2 bg-gray-500 rounded-full animate-bounce delay-150"></span>
                          </>
                        )}
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </main>

        {/* --- BOTTOM INPUT BAR --- */}
        <footer className="absolute bottom-0 w-full z-10 pb-6 pt-4 px-4 sm:px-6 bg-gradient-to-t from-[#212121] via-[#212121] to-transparent">
          <div className="max-w-3xl mx-auto relative">
            {selectedImage && (
              <div className="absolute -top-20 left-4 p-2 backdrop-blur-md bg-[#2F2F2F] rounded-2xl border border-white/10 shadow-xl">
                <img
                  src={selectedImage}
                  alt="Preview"
                  className="h-14 w-14 object-cover rounded-lg"
                />
                <button
                  onClick={() => setSelectedImage(null)}
                  className="absolute -top-2 -right-2 bg-[#212121] hover:bg-red-500 text-white rounded-full p-1 text-xs border border-white/10"
                >
                  ✕
                </button>
              </div>
            )}
            
            <div
              className={`flex items-end gap-2 p-2 bg-[#2F2F2F] border rounded-3xl shadow-lg transition-colors ${engineRef.current ? "border-white/10 focus-within:border-gray-500" : "border-white/5 opacity-60"}`}
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
                className="p-3 mb-0.5 ml-1 text-gray-400 hover:text-gray-100 hover:bg-[#3F3F3F] rounded-full transition-all disabled:hover:bg-transparent"
              >
                <ImageIcon size={22} />
              </button>
              
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    if (!isGenerating) handleSend();
                  }
                }}
                placeholder={
                  engineRef.current
                    ? "Message ODM..."
                    : "Load the AI engine first..."
                }
                disabled={isGenerating || !engineRef.current}
                rows={1}
                className="flex-1 max-h-32 min-h-[44px] bg-transparent text-gray-100 placeholder-gray-500 px-2 py-3 focus:outline-none resize-none disabled:opacity-50"
              />
              
              <button
                onClick={handleSend}
                disabled={
                  (!input.trim() && !selectedImage) ||
                  isGenerating ||
                  !engineRef.current
                }
                className="p-3 mb-0.5 mr-1 bg-gray-100 text-[#212121] rounded-full hover:bg-white disabled:opacity-50 transition-colors shadow-sm"
              >
                <Send size={18} className="ml-0.5" />
              </button>
            </div>
            <div className="text-center mt-3">
              <span className="text-[10px] text-gray-500">ODM runs entirely on your device. Responses may occasionally be inaccurate.</span>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}