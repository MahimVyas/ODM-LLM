"use client";

import { db } from "@/lib/db";
import { useUIStore } from "@/lib/store";
import { useLiveQuery } from "dexie-react-hooks";
import { useSession, signIn, signOut } from "next-auth/react";
import { memo } from "react";
import {
  MessageSquare,
  Plus,
  Settings,
  User,
  Trash2,
  LogOut,
  LogIn,
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

  return (
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

        {/* 🚀 Bottom Profile/Settings (Single Column Layout) */}
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

          {/* 2. Settings Button */}
          <button
            onClick={toggleSettings}
            className="flex items-center gap-3 w-full p-3 rounded-xl text-gray-400 hover:bg-[#212121] hover:text-gray-200 transition-colors"
          >
            <Settings size={18} />
            <span className="text-sm font-medium">Settings</span>
          </button>

          {/* 3. Auth Button (Log In / Log Out) */}
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
  );
});

export default Sidebar;