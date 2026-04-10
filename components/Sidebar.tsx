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
  Menu,
  LogOut,
  LogIn
} from "lucide-react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export default memo(function Sidebar({ 
  currentChatId, 
  onSelectChat 
}: { 
  currentChatId: string | null;
  onSelectChat: (id: string | null) => void;
}) {
  const { data: session } = useSession();
  const isSidebarOpen = useUIStore((state) => state.isSidebarOpen);
  const toggleSidebar = useUIStore((state) => state.toggleSidebar);
  const toggleSettings = useUIStore((state) => state.toggleSettings);

  const chats = useLiveQuery(
    () => db.chats.orderBy("updatedAt").reverse().toArray(),
    []
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
    <>
      {/* Mobile Toggle */}
      <button
        onClick={toggleSidebar}
        className="fixed top-4 left-4 z-50 p-2 bg-slate-900 border border-slate-800 rounded-lg lg:hidden"
      >
        <Menu size={20} />
      </button>

      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 w-64 bg-slate-950 border-r border-slate-800 transition-transform duration-300 transform lg:relative lg:translate-x-0",
          !isSidebarOpen && "-translate-x-full lg:hidden"
        )}
      >
        <div className="flex flex-col h-full p-4">
          {/* New Chat Button */}
          <button
            onClick={() => onSelectChat(null)}
            className="flex items-center gap-2 w-full p-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-medium transition-colors mb-6"
          >
            <Plus size={18} />
            New Chat
          </button>

          {/* Chat List */}
          <div className="flex-1 overflow-y-auto space-y-1">
            <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wider px-3 mb-2">
              Recent Conversations
            </h2>
            {chats?.map((chat) => (
              <div
                key={chat.id}
                onClick={() => onSelectChat(chat.id)}
                className={cn(
                  "group flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-colors",
                  currentChatId === chat.id
                    ? "bg-slate-800 text-white"
                    : "text-slate-400 hover:bg-slate-900 hover:text-slate-200"
                )}
              >
                <MessageSquare size={16} />
                <span className="flex-1 truncate text-sm">{chat.title}</span>
                <button
                  onClick={(e) => deleteChat(chat.id, e)}
                  className="opacity-0 group-hover:opacity-100 p-1 hover:text-red-400 transition-opacity"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>

          {/* Bottom Profile/Settings */}
          <div className="pt-4 mt-4 border-t border-slate-800 space-y-1">
            <button 
              onClick={toggleSettings}
              className="flex items-center gap-3 w-full p-3 rounded-xl text-slate-400 hover:bg-slate-900 hover:text-slate-200 transition-colors"
            >
              <Settings size={18} />
              <span className="text-sm font-medium">Settings</span>
            </button>
            
            {session ? (
              <div className="flex items-center gap-3 w-full p-3 rounded-xl text-slate-400">
                {session.user?.image ? (
                  <img src={session.user.image} className="w-8 h-8 rounded-full border border-slate-700" alt="Avatar" />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-slate-400 border border-slate-700">
                    <User size={18} />
                  </div>
                )}
                <span className="flex-1 text-sm font-medium truncate">{session.user?.name}</span>
                <button 
                  onClick={() => signOut()}
                  className="p-1 hover:text-white transition-colors"
                  title="Sign Out"
                >
                  <LogOut size={16} />
                </button>
              </div>
            ) : (
              <button 
                onClick={() => signIn('google')}
                className="flex items-center gap-3 w-full p-3 rounded-xl text-slate-400 hover:bg-slate-900 hover:text-slate-200 transition-colors"
              >
                <LogIn size={18} />
                <span className="text-sm font-medium">Sign In</span>
              </button>
            )}
          </div>
        </div>
      </aside>
    </>
  );
});
