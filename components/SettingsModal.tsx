"use client";

import { useUIStore } from "@/lib/store";
import { 
  X, 
  Database, 
  Info,
  Trash2,
  HardDrive
} from "lucide-react";
import { db } from "@/lib/db";
import { useState } from "react";

export default function SettingsModal() {
  const isSettingsOpen = useUIStore((state: any) => state.isSettingsOpen);
  const toggleSettings = useUIStore((state: any) => state.toggleSettings);
  const [isDeleting, setIsDeleting] = useState(false);

  if (!isSettingsOpen) return null;

  const handleClearCache = async () => {
    if (!confirm("Are you sure you want to delete all downloaded AI models? You will need to re-download them later to use the engine.")) return;
    
    setIsDeleting(true);
    try {
      if ('caches' in window) {
        const cacheKeys = await caches.keys();
        for (const key of cacheKeys) {
          if (key.includes('webllm') || key.includes('transformers-cache')) {
            await caches.delete(key);
          }
        }
      }
      alert("AI Models deleted successfully from your browser cache.");
    } catch (e) {
      console.error("Failed to clear cache:", e);
      alert("Failed to delete models.");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleClearHistory = async () => {
    if (!confirm("Are you sure you want to permanently delete all chat history? This action cannot be undone.")) return;
    
    try {
      await db.messages.clear();
      await db.chats.clear();
      alert("Chat history cleared completely.");
      window.location.reload(); // Refresh to clear the active UI state
    } catch (e) {
      console.error("Failed to clear history:", e);
      alert("Failed to delete chat history.");
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="w-full max-w-xl bg-[#212121] border border-white/10 rounded-3xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/5 bg-[#1A1A1A]">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-[#2F2F2F] text-gray-100 rounded-xl border border-white/10">
              <Database size={20} />
            </div>
            <h2 className="text-xl font-semibold text-white tracking-tight">Settings</h2>
          </div>
          <button 
            onClick={toggleSettings}
            className="p-2 text-gray-400 hover:text-white hover:bg-[#3F3F3F] rounded-full transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 bg-[#212121]">
          
          <div>
            <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-2 mb-4">
              <HardDrive size={14} /> Storage & Data Management
            </h3>

            <div className="space-y-3">
              {/* Delete AI Models */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 bg-[#2F2F2F] border border-white/5 rounded-2xl gap-4">
                <div>
                  <span className="font-medium text-gray-200 block mb-1">Delete AI Models</span>
                  <span className="text-xs text-gray-400 leading-relaxed max-w-sm block">
                    Clear downloaded neural network weights from your browser cache to free up system storage.
                  </span>
                </div>
                <button 
                  onClick={handleClearCache}
                  disabled={isDeleting}
                  className="shrink-0 px-4 py-2 bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20 rounded-xl text-sm font-semibold transition flex items-center gap-2 disabled:opacity-50"
                >
                  <Trash2 size={16} /> 
                  {isDeleting ? "Deleting..." : "Clear Cache"}
                </button>
              </div>

              {/* Clear Chat History */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 bg-[#2F2F2F] border border-white/5 rounded-2xl gap-4">
                <div>
                  <span className="font-medium text-gray-200 block mb-1">Clear Chat History</span>
                  <span className="text-xs text-gray-400 leading-relaxed max-w-sm block">
                    Permanently wipe all conversation threads and images from your local IndexedDB storage.
                  </span>
                </div>
                <button 
                  onClick={handleClearHistory}
                  className="shrink-0 px-4 py-2 bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20 rounded-xl text-sm font-semibold transition flex items-center gap-2"
                >
                  <Trash2 size={16} /> Delete All
                </button>
              </div>
            </div>
          </div>

          {/* Privacy Note */}
          <div className="p-4 bg-[#1A1A1A] border border-white/5 rounded-xl flex gap-3 shadow-inner">
            <Info className="text-emerald-500/70 shrink-0 mt-0.5" size={16} />
            <p className="text-[11px] text-gray-400 leading-relaxed">
              Your privacy is absolute. All models and chat histories are stored strictly within this device's browser memory environments. No analytics or prompt data ever leaves your computer.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 bg-[#1A1A1A] border-t border-white/5 flex justify-end">
          <button
            onClick={toggleSettings}
            className="px-6 py-2.5 bg-gray-100 hover:bg-white text-[#212121] rounded-xl font-semibold transition-colors shadow-sm"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}