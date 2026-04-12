"use client";

import { useState, useRef, useEffect, memo } from "react";
import {
  Camera,
  Image as ImageIcon,
  Send,
  Loader2,
  DownloadCloud,
  ChevronDown,
  Cpu,
  Menu,
  Copy,
  Check,
  Pencil,
  Share,
  X,
  MessageCircle,
  Link2,
  FileText,
  MonitorSmartphone,
  ArrowLeft, // 👈 Added ArrowLeft for the return button
} from "lucide-react";
import { CreateWebWorkerMLCEngine } from "@mlc-ai/web-llm";
import ReactMarkdown from "react-markdown";
import { db } from "@/lib/db";
import { useLiveQuery } from "dexie-react-hooks";
import Sidebar from "@/components/Sidebar";
import SettingsModal from "@/components/SettingsModal";
import OnboardingGuide from "@/components/OnboardingGuide";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

const AVAILABLE_MODELS = [
  {
    id: "Llama-3.2-1B-Instruct-q4f16_1-MLC",
    name: "Llama 3.2 (1B)",
    params: "1.2B",
    size: "~800 MB",
    description:
      "Best for everyday tasks, basic chat, and extreme speed.",
  },
  {
    id: "Phi-3-mini-4k-instruct-q4f16_1-MLC",
    name: "Phi-3 Mini",
    params: "3.8B",
    size: "~2.2 GB",
    description: "Excellent for reasoning, math, and logical problem solving.",
  },
  {
    id: "Qwen2-1.5B-Instruct-q4f16_1-MLC",
    name: "Qwen 2 (1.5B)",
    params: "1.5B",
    size: "~1.0 GB",
    description:
      "Highly capable for coding, structured data, and multilingual tasks.",
  },
  {
    id: "Llama-3-8B-Instruct-q4f32_1-MLC",
    name: "Llama 3 (8B)",
    params: "8.0B",
    size: "~5.0 GB",
    description:
      "Heavyweight model. Best for complex reasoning and deep knowledge.",
  },
];

const MessageItem = memo(
  ({
    role,
    content,
    onEdit,
  }: {
    role: string;
    content: string;
    onEdit: (text: string) => void;
  }) => {
    const [isCopied, setIsCopied] = useState(false);

    const handleCopy = () => {
      navigator.clipboard.writeText(content);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    };

    return (
      <div
        className={`group flex w-full ${role === "user" ? "justify-end" : "justify-start"} mb-6`}
      >
        <div
          className={`flex flex-col gap-1.5 w-full ${role === "user" ? "items-end" : "items-start"}`}
        >
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
                      <code
                        className="bg-[#2F2F2F] px-1.5 py-0.5 rounded text-gray-200 font-mono text-sm"
                        {...props}
                      >
                        {children}
                      </code>
                    );
                  },
                  p: ({ children }) => (
                    <div className="mb-3 last:mb-0 leading-relaxed">
                      {children}
                    </div>
                  ),
                  ul: ({ children }) => (
                    <ul className="list-disc ml-6 mb-3 space-y-1">
                      {children}
                    </ul>
                  ),
                  ol: ({ children }) => (
                    <ol className="list-decimal ml-6 mb-3 space-y-1">
                      {children}
                    </ol>
                  ),
                  li: ({ children }) => (
                    <li className="leading-relaxed">{children}</li>
                  ),
                  strong: ({ children }) => (
                    <strong className="font-semibold text-white">
                      {children}
                    </strong>
                  ),
                  a: ({ children, href }) => (
                    <a
                      href={href}
                      className="text-blue-400 hover:underline transition-colors"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {children}
                    </a>
                  ),
                }}
              >
                {content}
              </ReactMarkdown>
            )}
          </div>

          <div
            className={`flex items-center gap-1 ${role === "user" ? "pr-4" : "pl-1"} opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity duration-200`}
          >
            <button
              onClick={handleCopy}
              className="p-1.5 text-gray-400 hover:text-white hover:bg-[#3F3F3F] rounded-md transition-colors"
              title="Copy Text"
            >
              {isCopied ? (
                <Check size={14} className="text-emerald-400" />
              ) : (
                <Copy size={14} />
              )}
            </button>

            {role === "user" && (
              <button
                onClick={() => onEdit(content)}
                className="p-1.5 text-gray-400 hover:text-white hover:bg-[#3F3F3F] rounded-md transition-colors"
                title="Edit Prompt"
              >
                <Pencil size={14} />
              </button>
            )}
          </div>
        </div>
      </div>
    );
  },
);
MessageItem.displayName = "MessageItem";

export default function Home() {
  const { status } = useSession();
  const router = useRouter();

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isOnline, setIsOnline] = useState(true);

  // Share Modal States
  const [showShareModal, setShowShareModal] = useState(false);
  const [shareLinkCopied, setShareLinkCopied] = useState(false);
  const [shareTextCopied, setShareTextCopied] = useState(false);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/");
    }
  }, [status, router]);

  useEffect(() => {
    setIsOnline(navigator.onLine);
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  const [currentChatId, setCurrentChatId] = useState<string | null>(null);
  const [activeModelId, setActiveModelId] = useState<string>(
    AVAILABLE_MODELS[0].id,
  );
  const [isModelDropdownOpen, setIsModelDropdownOpen] =
    useState<boolean>(false);
  const activeModel = AVAILABLE_MODELS.find((m) => m.id === activeModelId);

  const dbMessages = useLiveQuery(
    async () => {
      if (!currentChatId) return [];
      return await db.messages.where("chatId").equals(currentChatId).toArray();
    },
    [currentChatId],
    [] as any[],
  );

  const [input, setInput] = useState("");
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  const engineRef = useRef<any>(null);
  const engineWorkerRef = useRef<Worker | null>(null);
  const visionWorkerRef = useRef<Worker | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const [isEngineLoading, setIsEngineLoading] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [loadingText, setLoadingText] = useState("Preparing download...");

  const [isGenerating, setIsGenerating] = useState(false);
  const [visionStatus, setVisionStatus] = useState("");
  const [streamingContent, setStreamingContent] = useState("");
  const [showInitConfirm, setShowInitConfirm] = useState(false);

  const messages = dbMessages || [];

  const ensureVisionWorker = () => {
    if (!visionWorkerRef.current) {
      visionWorkerRef.current = new Worker(
        new URL("../vision-worker.ts", import.meta.url),
        { type: "module" },
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

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "end",
    });
  }, [messages, streamingContent, visionStatus]);

  if (status === "loading" || status === "unauthenticated") {
    return (
      <div className="flex h-screen bg-[#212121] items-center justify-center">
        <Loader2 className="animate-spin text-gray-400" size={32} />
      </div>
    );
  }

  // Apple GPU Diagnostics Function
  const runAppleDiagnostics = async () => {
    try {
      const nav = navigator as any;
      if (!nav.gpu) {
        alert(
          "❌ WebGPU is completely disabled or not supported on this browser.",
        );
        return;
      }
      const adapter = await nav.gpu.requestAdapter();
      if (!adapter) {
        alert(
          "❌ WebGPU is turned on, but Apple refused to provide a GPU adapter for this site.",
        );
        return;
      }

      const hasF16 = adapter.features.has("shader-f16");
      alert(
        `✅ WebGPU is working!\nGPU: ${adapter.name || "Apple GPU"}\nF16 Support: ${hasF16 ? "Yes" : "No (Models may crash)"}`,
      );
    } catch (e: any) {
      alert(`Diagnostic Error: ${e.message}`);
    }
  };

  const getFormattedChat = () => {
    return messages
      .map((m: any) => `${m.role === "user" ? "You" : "ODM"}:\n${m.content}`)
      .join("\n\n---\n\n");
  };

  const handleWhatsAppShare = () => {
    const text = getFormattedChat();
    window.open(
      `https://api.whatsapp.com/send?text=${encodeURIComponent("Check out this conversation with ODM AI:\n\n" + text)}`,
      "_blank",
    );
    setShowShareModal(false);
  };

  const handleCopyText = () => {
    navigator.clipboard.writeText(`ODM Chat Export\n\n${getFormattedChat()}`);
    setShareTextCopied(true);
    setTimeout(() => {
      setShareTextCopied(false);
      setShowShareModal(false);
    }, 1500);
  };

  const handleCopyLink = () => {
    try {
      const encodedChat = btoa(encodeURIComponent(JSON.stringify(messages)));
      const shareUrl = `${window.location.origin}/share?data=${encodedChat}`;

      if (shareUrl.length > 2000) {
        alert(
          "This chat is too long to generate a local link. Please use 'Copy Text' instead.",
        );
        return;
      }
      navigator.clipboard.writeText(shareUrl);
      setShareLinkCopied(true);
      setTimeout(() => {
        setShareLinkCopied(false);
        setShowShareModal(false);
      }, 1500);
    } catch (e) {
      alert("Failed to generate link.");
    }
  };

  const handleEditPrompt = (text: string) => {
    setInput(text);
    textareaRef.current?.focus();
  };

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
    } catch (error: any) {
      console.error("Failed to load engine:", error);
      alert(
        `Initialization Failed: ${error.message || "Your device may not support WebGPU or ran out of memory."}`,
      );
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

      const apiMessages = messages.map((msg: any) => ({
        role: msg.role,
        content: msg.content,
      }));
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
      
      {/* 🚀 MOBILE UNSUPPORTED OVERLAY (Visible only on phones, covers everything safely) */}
      <div className="absolute inset-0 z-[9999] flex md:hidden bg-[#212121] flex-col items-center justify-center p-8 text-center select-none">
        <div className="text-4xl font-bold tracking-tighter text-gray-200 mb-8 cursor-default">
          ODM<span className="text-gray-600">.</span>
        </div>
        <div className="bg-[#2F2F2F] p-5 rounded-3xl border border-white/10 mb-6 shadow-2xl">
          <MonitorSmartphone size={36} className="text-gray-400" />
        </div>
        <h2 className="text-2xl font-bold tracking-tight text-white mb-3">
          Desktop Required
        </h2>
        <p className="text-sm text-gray-400 leading-relaxed max-w-[280px] mb-8">
          The current iteration of ODM relies on raw hardware power to run local
          AI models entirely in the browser. Mobile devices lack the required
          memory and WebGPU support.
        </p>
        
        {/* 🚀 BACK TO HOME BUTTON */}
        <button
          onClick={() => router.push("/")}
          className="flex items-center gap-2 px-6 py-3 bg-gray-100 hover:bg-white text-[#212121] rounded-full font-semibold transition-all shadow-sm"
        >
          <ArrowLeft size={18} /> Return to Home
        </button>

        <div className="mt-10 px-5 py-2.5 bg-amber-500/10 border border-amber-500/20 rounded-xl flex items-center gap-2.5 shadow-inner">
          <div className="h-2 w-2 rounded-full bg-amber-500 animate-pulse"></div>
          <span className="text-xs font-bold text-amber-500 uppercase tracking-widest">
            Please switch to a PC or Mac
          </span>
        </div>
      </div>

      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-40 md:hidden backdrop-blur-sm transition-opacity"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      <div
        className={`fixed inset-y-0 left-0 z-50 transform ${isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"} md:relative md:translate-x-0 transition-transform duration-300 ease-in-out md:flex`}
      >
        <Sidebar
          currentChatId={currentChatId}
          onSelectChat={(id) => {
            setCurrentChatId(id);
            setIsMobileMenuOpen(false);
          }}
        />
      </div>

      <SettingsModal />
      <OnboardingGuide />

      {/* SHARE MODAL UI */}
      {showShareModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-sm bg-[#212121] border border-white/10 rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between p-5 border-b border-white/5 bg-[#1A1A1A]">
              <h2 className="text-lg font-semibold text-white tracking-tight">
                Share Chat
              </h2>
              <button
                onClick={() => setShowShareModal(false)}
                className="p-1.5 text-gray-400 hover:text-white hover:bg-[#3F3F3F] rounded-full transition-colors"
              >
                <X size={18} />
              </button>
            </div>
            <div className="p-4 space-y-2 bg-[#212121]">
              <button
                onClick={handleCopyLink}
                className="flex items-center justify-between w-full p-4 rounded-2xl bg-[#2F2F2F] hover:bg-[#3F3F3F] border border-white/5 transition-colors group"
              >
                <div className="flex items-center gap-3 text-gray-200">
                  <div className="p-2 bg-[#212121] rounded-lg border border-white/5 group-hover:border-white/10">
                    {shareLinkCopied ? (
                      <Check size={18} className="text-emerald-400" />
                    ) : (
                      <Link2 size={18} />
                    )}
                  </div>
                  <span className="font-medium text-sm">Copy Link</span>
                </div>
              </button>

              <button
                onClick={handleCopyText}
                className="flex items-center justify-between w-full p-4 rounded-2xl bg-[#2F2F2F] hover:bg-[#3F3F3F] border border-white/5 transition-colors group"
              >
                <div className="flex items-center gap-3 text-gray-200">
                  <div className="p-2 bg-[#212121] rounded-lg border border-white/5 group-hover:border-white/10">
                    {shareTextCopied ? (
                      <Check size={18} className="text-emerald-400" />
                    ) : (
                      <FileText size={18} />
                    )}
                  </div>
                  <span className="font-medium text-sm">Copy Text</span>
                </div>
              </button>

              <button
                onClick={handleWhatsAppShare}
                className="flex items-center justify-between w-full p-4 rounded-2xl bg-[#2F2F2F] hover:bg-[#3F3F3F] border border-white/5 transition-colors group"
              >
                <div className="flex items-center gap-3 text-gray-200">
                  <div className="p-2 bg-green-500/10 text-green-400 rounded-lg border border-green-500/20 group-hover:border-green-500/30">
                    <MessageCircle size={18} />
                  </div>
                  <span className="font-medium text-sm">WhatsApp</span>
                </div>
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="flex-1 flex flex-col relative min-w-0 h-full w-full">
        {/* --- HEADER --- */}
        <header className="shrink-0 sticky top-0 w-full z-20 bg-[#212121] border-b border-white/5 relative">
          <div className="max-w-4xl mx-auto px-2 sm:px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2 sm:gap-3">
              <button
                onClick={() => setIsMobileMenuOpen(true)}
                className="md:hidden p-2 -ml-1 text-gray-400 hover:text-gray-100 rounded-lg hover:bg-[#2F2F2F] transition"
              >
                <Menu size={22} />
              </button>

              <div>
                <h1 className="text-xl sm:text-2xl font-bold tracking-tighter text-gray-100 leading-none mb-0.5 cursor-default">
                  ODM<span className="text-gray-500">.</span>
                </h1>
                <p className="text-[10px] sm:text-xs text-gray-400 font-medium hidden sm:block">
                  {engineRef.current
                    ? "AI Active - Secure & Local"
                    : "AI Offline"}
                </p>
              </div>
            </div>

            {/* CENTERED ACTIVE MODEL BADGE */}
            {engineRef.current && (
              <div className="absolute left-1/2 -translate-x-1/2 flex flex-col items-center pointer-events-none animate-in fade-in zoom-in duration-300">
                <span className="text-[8px] sm:text-[9px] text-emerald-500/80 font-bold uppercase tracking-widest mb-1">
                  Active Engine
                </span>
                <div className="flex items-center gap-1.5 bg-[#2F2F2F] px-3 py-1 rounded-full border border-white/5 shadow-sm">
                  <Cpu size={12} className="text-emerald-400" />
                  <span className="text-[10px] sm:text-xs text-gray-200 font-medium whitespace-nowrap">
                    {activeModel?.name}
                  </span>
                </div>
              </div>
            )}

            <div className="flex items-center gap-1.5 sm:gap-3 relative">
              {/* SHARE BUTTON */}
              {messages.length > 0 && (
                <button
                  onClick={() => setShowShareModal(true)}
                  className="flex items-center gap-2 px-2 sm:px-3 py-1.5 sm:py-2 bg-transparent border border-white/10 rounded-lg text-sm font-medium hover:bg-[#2F2F2F] transition text-gray-100 shadow-sm"
                >
                  <Share size={16} className="text-gray-400" />
                  <span className="hidden sm:inline">Share</span>
                </button>
              )}

              {/* MODEL SELECTOR DROPDOWN */}
              {!engineRef.current && !isEngineLoading && (
                <div className="relative">
                  <button
                    onClick={() =>
                      setIsModelDropdownOpen(!isModelDropdownOpen)
                    }
                    className="flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-1.5 sm:py-2 bg-[#2F2F2F] border border-white/10 rounded-lg text-sm font-medium hover:bg-[#3F3F3F] transition text-gray-100 shadow-sm"
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
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                          Available Models
                        </p>
                      </div>
                      <div className="max-h-80 overflow-y-auto">
                        {AVAILABLE_MODELS.map((model) => (
                          <button
                            key={model.id}
                            onClick={() => {
                              setActiveModelId(model.id);
                              setIsModelDropdownOpen(false);
                            }}
                            className={`w-full text-left p-3 hover:bg-[#3F3F3F] border-b border-white/5 last:border-0 transition-colors ${activeModelId === model.id ? "bg-[#3F3F3F]" : ""}`}
                          >
                            <div className="flex justify-between items-center mb-1">
                              <span
                                className={`font-semibold text-sm ${activeModelId === model.id ? "text-white" : "text-gray-300"}`}
                              >
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

              {/* GPU DIAGNOSTIC BUTTON */}
              {!engineRef.current && !isEngineLoading && (
                <button
                  onClick={runAppleDiagnostics}
                  className="text-[10px] sm:text-xs font-semibold bg-red-500/10 border border-red-500/20 text-red-400 px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg hover:bg-red-500/20 transition"
                >
                  Test GPU
                </button>
              )}

              {/* LOAD ENGINE BUTTON */}
              {!engineRef.current && !isEngineLoading && (
                <button
                  onClick={initializeEngine}
                  className="text-sm bg-gray-100 hover:bg-white text-[#212121] px-2.5 sm:px-5 py-1.5 sm:py-2 rounded-lg shadow-sm transition flex items-center gap-2 font-semibold"
                >
                  <DownloadCloud size={16} />{" "}
                  <span className="hidden sm:inline">Load Engine</span>
                </button>
              )}

              {/* MODE VISUALIZER */}
              <div className="flex items-center gap-1.5 sm:gap-2 px-2 py-1.5 bg-[#1A1A1A] border border-white/5 rounded-lg ml-0.5 sm:ml-2 min-w-[65px] sm:min-w-[85px] transition-all duration-500 shadow-inner">
                <div className="relative flex h-2 w-2 shrink-0 mt-0.5">
                  <span
                    className={`absolute inline-flex h-full w-full rounded-full opacity-75 ${isOnline ? "bg-emerald-400 animate-ping" : "bg-amber-400 animate-pulse"}`}
                  ></span>
                  <span
                    className={`relative inline-flex rounded-full h-2 w-2 ${isOnline ? "bg-emerald-500" : "bg-amber-500"}`}
                  ></span>
                </div>
                <div className="flex flex-col justify-center">
                  <span
                    className={`text-[8px] sm:text-[10px] font-bold uppercase tracking-wider leading-none mb-0.5 transition-colors duration-300 ${isOnline ? "text-emerald-400" : "text-amber-400"}`}
                  >
                    {isOnline ? "Online" : "Offline"}
                  </span>
                  <span className="text-[6px] sm:text-[8px] text-gray-500 leading-none transition-all duration-300 truncate hidden sm:block">
                    {isOnline ? "Sync Ready" : "Local Mode"}
                  </span>
                </div>
              </div>
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
                  <h2 className="text-xl font-bold text-white">
                    Initialize local AI?
                  </h2>
                  <p className="text-sm text-gray-400">
                    Models will be downloaded to your device.
                  </p>
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
        <main className="flex-1 overflow-y-auto px-4 sm:px-6 pt-6 pb-4 max-w-3xl w-full mx-auto scroll-smooth [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
          {messages.length === 0 && !streamingContent ? (
            <div className="h-full flex flex-col items-center justify-center text-gray-500 space-y-4">
              <div className="text-5xl font-bold tracking-tighter text-gray-200 mb-2 select-none cursor-default">
                ODM<span className="text-gray-600">.</span>
              </div>
              <h2 className="text-xl font-semibold text-gray-300">
                How can I help you today?
              </h2>
              <p className="text-sm text-center font-medium">
                {engineRef.current
                  ? "AI loaded. Upload an image or send a prompt."
                  : "Initialize AI engine to begin."}
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {messages.map((msg: any, idx: number) => (
                <MessageItem
                  key={idx}
                  role={msg.role}
                  content={msg.content}
                  onEdit={handleEditPrompt}
                />
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

              <div ref={messagesEndRef} className="h-4 w-full shrink-0" />
            </div>
          )}
        </main>

        {/* --- BOTTOM INPUT BAR --- */}
        <footer className="shrink-0 w-full z-10 pb-4 sm:pb-6 pt-2 px-4 sm:px-6 bg-[#212121]">
          <div className="max-w-3xl mx-auto relative">
            {selectedImage && (
              <div className="absolute bottom-full mb-4 left-4 p-2 backdrop-blur-md bg-[#2F2F2F] rounded-2xl border border-white/10 shadow-xl">
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
                ref={textareaRef}
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
              <span className="text-[10px] text-gray-500">
                ODM runs entirely on your device. Responses may occasionally be
                inaccurate.
              </span>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}