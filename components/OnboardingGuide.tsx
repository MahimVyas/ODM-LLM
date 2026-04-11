"use client";

import { useState, useEffect } from "react";
import { Cpu, Image as ImageIcon, Shield, MessageSquare, X, Zap, CheckCircle2 } from "lucide-react";

export default function OnboardingGuide() {
  const [isMounted, setIsMounted] = useState(false);
  const [showTour, setShowTour] = useState(false);
  const [showToast, setShowToast] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    const hasVisited = localStorage.getItem("odm_has_visited");

    if (!hasVisited) {
      // First time user: Show the tour modal
      setShowTour(true);
    } else {
      // Returning user: Show the 5-second bottom-left toast
      setShowToast(true);
      const timer = setTimeout(() => {
        setShowToast(false);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, []);

  const completeTour = () => {
    localStorage.setItem("odm_has_visited", "true");
    setShowTour(false);
  };

  // Prevent hydration mismatch by not rendering until client-side loads
  if (!isMounted) return null;

  return (
    <>
      {/* 🚀 FIRST TIME USER: The Welcome Modal */}
      {showTour && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="w-full max-w-2xl bg-[#212121] border border-white/10 rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
            
            {/* Header */}
            <div className="p-6 sm:p-8 border-b border-white/5 bg-[#1A1A1A]">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-[#2F2F2F] text-gray-100 rounded-xl border border-white/10">
                  <Zap size={24} />
                </div>
                <h2 className="text-2xl font-bold text-white tracking-tight">Welcome to ODM</h2>
              </div>
              <p className="text-gray-400 text-sm">Your on-device, zero-latency multimodal intelligence platform.</p>
            </div>

            {/* Feature Grid */}
            <div className="p-6 sm:p-8 grid sm:grid-cols-2 gap-6 bg-[#212121]">
              
              <div className="flex gap-4">
                <div className="mt-1 text-gray-400"><Cpu size={24} /></div>
                <div>
                  <h3 className="font-semibold text-gray-200 mb-1">1. Choose Your Brain</h3>
                  <p className="text-xs text-gray-400 leading-relaxed">Click the CPU icon in the top right to select a local model (like Llama or Phi) based on your device's memory.</p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="mt-1 text-gray-400"><ImageIcon size={24} /></div>
                <div>
                  <h3 className="font-semibold text-gray-200 mb-1">2. Multimodal Vision</h3>
                  <p className="text-xs text-gray-400 leading-relaxed">Click the image icon next to the chat bar to upload photos. The local vision engine will analyze them instantly.</p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="mt-1 text-gray-400"><Shield size={24} /></div>
                <div>
                  <h3 className="font-semibold text-gray-200 mb-1">3. Absolute Privacy</h3>
                  <p className="text-xs text-gray-400 leading-relaxed">Everything happens entirely in your browser. No prompts or images are ever sent to external cloud servers.</p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="mt-1 text-gray-400"><MessageSquare size={24} /></div>
                <div>
                  <h3 className="font-semibold text-gray-200 mb-1">4. Persistent Storage</h3>
                  <p className="text-xs text-gray-400 leading-relaxed">Your chat history is securely saved to your device's hard drive. Access past conversations in the left sidebar.</p>
                </div>
              </div>

            </div>

            {/* Footer */}
            <div className="p-6 border-t border-white/5 bg-[#1A1A1A] flex justify-end">
              <button
                onClick={completeTour}
                className="w-full sm:w-auto px-8 py-3 bg-gray-100 hover:bg-white text-[#212121] rounded-xl font-semibold transition-colors shadow-sm"
              >
                Get Started
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 🚀 RETURNING USER: The 5-Second Toast Notification */}
      {showToast && (
        <div className="fixed bottom-6 left-6 z-[90] animate-in slide-in-from-bottom-8 fade-in duration-500">
          <div className="flex items-center gap-3 px-4 py-3 bg-[#2F2F2F] border border-white/10 rounded-2xl shadow-2xl">
            <CheckCircle2 size={18} className="text-gray-400" />
            <div>
              <p className="text-sm font-medium text-gray-200">ODM is ready.</p>
              <p className="text-[10px] text-gray-400 uppercase tracking-wider">100% Offline Mode</p>
            </div>
            <button 
              onClick={() => setShowToast(false)} 
              className="ml-4 p-1 text-gray-500 hover:text-gray-300 transition-colors"
            >
              <X size={14} />
            </button>
          </div>
        </div>
      )}
    </>
  );
}