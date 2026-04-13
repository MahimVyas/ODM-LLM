"use client";

import { db } from "@/lib/db";
import { useUIStore } from "@/lib/store";
import { useLiveQuery } from "dexie-react-hooks";
import { useSession, signIn, signOut } from "next-auth/react";
import { memo, useState, useEffect } from "react";
import {
  MessageSquare,
  Plus,
  Settings,
  User,
  Trash2,
  LogOut,
  LogIn,
  MessageSquareHeart, // 👈 Imported for the Feedback Button
  X,
  Send
} from "lucide-react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const Sidebar = memo(function Sidebar({
  currentChatId,
  onSelectChat,
}: {
  currentChatId: string | null;
  onSelectChat: (id: string | null) => void;
}) {
  const { data: session } = useSession();
  const toggleSettings = useUIStore((state: any) => state.toggleSettings);

  // 🚀 Feedback Modal States
  const [isFeedbackOpen, setIsFeedbackOpen] = useState(false);
  const [feedbackName, setFeedbackName] = useState("");
  const [feedbackEmail, setFeedbackEmail] = useState("");
  const [feedbackText, setFeedbackText] = useState("");

  // Auto-fill name and email if logged in
  useEffect(() => {
    if (session?.user) {
      setFeedbackName(session.user.name || "");
      setFeedbackEmail(session.user.email || "");
    }
  }, [session]);

  const chats = useLiveQuery(
    () => db.chats.orderBy("updatedAt").reverse().toArray(),
    [],
  );

  const deleteChat = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm("Delete this chat?")) {
      await db.chats.delete(id);
      await db.messages.where("chatId").equals(id).delete();
      if (currentChatId === id) {
        onSelectChat(null);
      }
    }
  };

  // Calculate word count
  const wordCount = feedbackText.trim().split(/\s+/).filter((word) => word.length > 0).length;

  const handleFeedbackSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (wordCount > 500) {
      alert("Please keep your feedback under 500 words.");
      return;
    }
    
    // Construct the email parameters
    const subject = encodeURIComponent(`ODM App Feedback from ${feedbackName}`);
    const body = encodeURIComponent(`Name: ${feedbackName}\nEmail: ${feedbackEmail}\n\nFeedback:\n${feedbackText}`);
    
    // Trigger the mailto link
    window.location.href = `mailto:mahimvyas205@gmail.com?subject=${subject}&body=${body}`;
    
    // Close and reset
    setIsFeedbackOpen(false);
    setFeedbackText("");
  };

  return (
    <>
      <aside className="flex flex-col h-full w-[260px] bg-[#171717] border-r border-white/5 shadow-2xl md:shadow-none">
        <div className="flex flex-col h-full p-3 sm:p-4">
          
          {/* New Chat Button */}
          <button
            onClick={() => onSelectChat(null)}
            className="flex items-center justify-between w-full p-3 rounded-xl bg-gray-100 hover:bg-white text-[#171717] font-semibold transition-colors mb-6 shadow-sm"
          >
            <span className="flex items-center gap-2">
              <Plus size={18} />
              New Chat
            </span>
          </button>

          {/* Chat List */}
          <div className="flex-1 overflow-y-auto space-y-1 pr-1 custom-scrollbar">
            <h2 className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider px-3 mb-3">
              Recent
            </h2>
            {chats?.map((chat) => (
              <div
                key={chat.id}
                onClick={() => onSelectChat(chat.id)}
                className={cn(
                  "group flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-colors",
                  currentChatId === chat.id
                    ? "bg-[#2F2F2F] text-gray-100 shadow-sm"
                    : "text-gray-400 hover:bg-[#212121] hover:text-gray-200",
                )}
              >
                <MessageSquare size={16} />
                <span className="flex-1 truncate text-sm font-medium">
                  {chat.title}
                </span>
                <button
                  onClick={(e) => deleteChat(chat.id, e)}
                  className="opacity-0 md:group-hover:opacity-100 opacity-100 p-1 hover:text-red-400 transition-opacity"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>

          {/* Bottom Profile/Settings */}
          <div className="pt-4 mt-4 border-t border-white/5 flex flex-col gap-1">
            
            {/* 1. User Profile Display */}
            {session && (
              <div className="flex items-center gap-3 w-full p-2 mb-2 rounded-xl text-gray-400">
                {session.user?.image ? (
                  <img
                    src={session.user.image}
                    className="w-8 h-8 rounded-full border border-white/10"
                    alt="Avatar"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-[#2F2F2F] flex items-center justify-center text-gray-400 border border-white/10">
                    <User size={18} />
                  </div>
                )}
                <span className="flex-1 text-sm font-medium truncate text-gray-200">
                  {session.user?.name}
                </span>
              </div>
            )}

            {/* 🚀 NEW: Feedback Button */}
            <button
              onClick={() => setIsFeedbackOpen(true)}
              className="flex items-center gap-3 w-full p-3 rounded-xl text-gray-400 hover:bg-[#212121] hover:text-emerald-400 transition-colors"
            >
              <MessageSquareHeart size={18} />
              <span className="text-sm font-medium">Send Feedback</span>
            </button>

            {/* Settings Button */}
            <button
              onClick={toggleSettings}
              className="flex items-center gap-3 w-full p-3 rounded-xl text-gray-400 hover:bg-[#212121] hover:text-gray-200 transition-colors"
            >
              <Settings size={18} />
              <span className="text-sm font-medium">Settings</span>
            </button>

            {/* Auth Button */}
            {session ? (
              <button
                onClick={() => signOut({ callbackUrl: "/" })}
                className="flex items-center gap-3 w-full p-3 rounded-xl text-gray-400 hover:bg-[#212121] hover:text-red-400 transition-colors"
              >
                <LogOut size={18} />
                <span className="text-sm font-medium">Log Out</span>
              </button>
            ) : (
              <button
                onClick={() => signIn("google", { callbackUrl: "/chat" })}
                className="flex items-center gap-3 w-full p-3 rounded-xl text-gray-400 hover:bg-[#212121] hover:text-gray-200 transition-colors"
              >
                <LogIn size={18} />
                <span className="text-sm font-medium">Sign In</span>
              </button>
            )}

          </div>
        </div>
      </aside>

      {/* 🚀 NEW: Feedback Modal */}
      {isFeedbackOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-[#212121] border border-white/10 rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            
            <div className="flex items-center justify-between p-5 border-b border-white/5 bg-[#1A1A1A]">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-[#2F2F2F] text-emerald-400 rounded-xl border border-white/10">
                  <MessageSquareHeart size={20} />
                </div>
                <h2 className="text-xl font-semibold text-white tracking-tight">Share Feedback</h2>
              </div>
              <button 
                onClick={() => setIsFeedbackOpen(false)}
                className="p-2 text-gray-400 hover:text-white hover:bg-[#3F3F3F] rounded-full transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleFeedbackSubmit} className="p-6 space-y-5 bg-[#212121]">
              <div className="space-y-4">
                <div>
                  <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 block">Name</label>
                  <input
                    type="text"
                    required
                    value={feedbackName}
                    onChange={(e) => setFeedbackName(e.target.value)}
                    className="w-full bg-[#2F2F2F] border border-white/10 rounded-xl px-4 py-3 text-sm text-gray-100 focus:outline-none focus:border-emerald-500/50 transition-colors"
                    placeholder="Your Name"
                  />
                </div>
                
                <div>
                  <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 block">Email</label>
                  <input
                    type="email"
                    required
                    value={feedbackEmail}
                    onChange={(e) => setFeedbackEmail(e.target.value)}
                    className="w-full bg-[#2F2F2F] border border-white/10 rounded-xl px-4 py-3 text-sm text-gray-100 focus:outline-none focus:border-emerald-500/50 transition-colors"
                    placeholder="your@email.com"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider block">Feedback</label>
                    <span className={`text-[10px] font-mono ${wordCount > 500 ? "text-red-400" : "text-gray-500"}`}>
                      {wordCount} / 500 words
                    </span>
                  </div>
                  <textarea
                    required
                    rows={4}
                    value={feedbackText}
                    onChange={(e) => setFeedbackText(e.target.value)}
                    className="w-full bg-[#2F2F2F] border border-white/10 rounded-xl px-4 py-3 text-sm text-gray-100 focus:outline-none focus:border-emerald-500/50 transition-colors resize-none"
                    placeholder="Tell us what you think..."
                  />
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={wordCount === 0 || wordCount > 500}
                  className="w-full flex items-center justify-center gap-2 py-3 bg-emerald-500 hover:bg-emerald-400 text-gray-900 rounded-xl font-bold transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Send size={16} /> Send via Email Client
                </button>
                <p className="text-center text-[10px] text-gray-500 mt-3">
                  This will open your default email app to send securely.
                </p>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
});

export default Sidebar;