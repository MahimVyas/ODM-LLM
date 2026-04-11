"use client";

import { useState, useEffect } from "react";
import { useUIStore } from "@/lib/store";
import { 
  X, 
  Database, 
  Cpu, 
  CheckCircle2, 
  Download,
  Trash2,
  Info
} from "lucide-react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export default function SettingsModal() {
  const isSettingsOpen = useUIStore((state: any) => state.isSettingsOpen);
  const toggleSettings = useUIStore((state: any) => state.toggleSettings);
  const [installedModels, setInstalledModels] = useState({
    llama3: false,
    vision: false
  });
  const [isScanning, setIsScanning] = useState(false);

  async function checkInstalledModels() {
    setIsScanning(true);
    try {
      if (typeof window !== 'undefined' && 'caches' in window) {
        const cacheKeys = await caches.keys();
        setInstalledModels({
          llama3: cacheKeys.some(key => key.includes('webllm')),
          vision: cacheKeys.some(key => key.includes('transformers-cache'))
        });
      }
    } catch (e) {
      console.error("Failed to scan cache:", e);
    } finally {
      setIsScanning(false);
    }
  }

  useEffect(() => {
    if (isSettingsOpen) {
      checkInstalledModels();
    }
  }, [isSettingsOpen]);

  if (!isSettingsOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-gray-950/80 backdrop-blur-sm">
      <div className="w-full max-w-lg bg-gray-900 border border-gray-800 rounded-3xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-800">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gray-800 text-gray-100 rounded-xl border border-gray-700">
              <Database size={20} />
            </div>
            <h2 className="text-xl font-semibold text-white">Settings</h2>
          </div>
          <button 
            onClick={toggleSettings}
            className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-full transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-8">
          {/* Model Manager */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider flex items-center gap-2">
                <Cpu size={14} /> Model Manager
              </h3>
              <button 
                onClick={checkInstalledModels}
                className="text-xs text-gray-400 hover:text-white transition-colors font-medium"
              >
                Refresh
              </button>
            </div>

            <div className="space-y-3">
              {/* Llama 3 Card */}
              <div className="flex items-center justify-between p-4 bg-gray-950 border border-gray-800 rounded-2xl">
                <div className="flex flex-col">
                  <span className="font-medium text-gray-200">Llama 3.2 (1B)</span>
                  <span className="text-xs text-gray-500">Language Model • ~1.2GB</span>
                </div>
                {installedModels.llama3 ? (
                  <div className="flex items-center gap-2 text-emerald-400 text-sm font-medium">
                    <CheckCircle2 size={16} />
                    Installed
                  </div>
                ) : (
                  <div className="text-gray-500 text-sm flex items-center gap-2">
                    <Download size={16} />
                    Not Cached
                  </div>
                )}
              </div>

              {/* Vision Model Card */}
              <div className="flex items-center justify-between p-4 bg-gray-950 border border-gray-800 rounded-2xl">
                <div className="flex flex-col">
                  <span className="font-medium text-gray-200">Vision Model</span>
                  <span className="text-xs text-gray-500">Image Analysis • ~60MB</span>
                </div>
                {installedModels.vision ? (
                  <div className="flex items-center gap-2 text-emerald-400 text-sm font-medium">
                    <CheckCircle2 size={16} />
                    Installed
                  </div>
                ) : (
                  <div className="text-gray-500 text-sm flex items-center gap-2">
                    <Download size={16} />
                    Not Cached
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Privacy Note */}
          <div className="p-4 bg-gray-950 border border-gray-800 rounded-2xl flex gap-3">
            <Info className="text-gray-400 shrink-0" size={18} />
            <p className="text-xs text-gray-500 leading-relaxed">
              All models and chat history are stored locally in your browser's IndexedDB and CacheStorage. No data ever leaves your device.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 bg-gray-950 border-t border-gray-800 flex justify-end">
          <button
            onClick={toggleSettings}
            className="px-6 py-2 bg-gray-100 hover:bg-white text-gray-950 rounded-xl font-semibold transition-colors shadow-sm"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
