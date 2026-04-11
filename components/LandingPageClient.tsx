"use client";

import { signIn } from "next-auth/react";
import { Zap, Shield, Cpu, Eye, ArrowRight, Code } from "lucide-react";
import Link from "next/link";

export default function LandingPageClient() {
  const handleAuth = () => {
    signIn("google", { callbackUrl: "/chat" });
  };

  return (
    <div className="min-h-screen bg-gray-950 text-gray-50 font-sans selection:bg-gray-800 overflow-x-hidden">
      
      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 backdrop-blur-md bg-gray-950/70 border-b border-gray-800/50">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 font-bold text-xl tracking-tighter">
            <Cpu className="text-gray-400" size={24} />
            <span>ODMC<span className="text-gray-500">.</span></span>
          </div>
          <div className="flex items-center gap-4">
            <button 
              onClick={handleAuth}
              className="text-sm font-medium text-gray-400 hover:text-white transition"
            >
              Log in
            </button>
            <button 
              onClick={handleAuth}
              className="text-sm bg-gray-100 hover:bg-white text-gray-950 px-4 py-2 rounded-full font-semibold transition shadow-sm"
            >
              Sign up
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="pt-32 pb-20 px-6 max-w-6xl mx-auto flex flex-col items-center text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gray-900 border border-gray-800 text-xs font-medium text-gray-300 mb-8">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-gray-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-gray-500"></span>
          </span>
          WebAssembly & WebGPU Powered
        </div>
        
        <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-6 leading-tight max-w-4xl">
          On-Device Multimodal <br className="hidden md:block" />
          <span className="text-transparent bg-clip-text bg-linear-to-r from-gray-200 to-gray-500">
            Intelligence.
          </span>
        </h1>
        
        <p className="text-gray-400 text-lg md:text-xl max-w-2xl mb-10 leading-relaxed">
          Run advanced Vision Transformers and Large Language Models entirely in your browser. Zero cloud dependency. Zero latency. Absolute privacy.
        </p>

        <div className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto">
          <button 
            onClick={handleAuth}
            className="w-full sm:w-auto flex items-center justify-center gap-2 bg-gray-100 hover:bg-white text-gray-950 px-8 py-4 rounded-full font-semibold transition-all hover:scale-105 shadow-lg shadow-white/5"
          >
            Launch Engine <ArrowRight size={18} />
          </button>
          <a href="https://github.com/MahimVyas/ODM-LLM" target="_blank" rel="noreferrer" className="w-full sm:w-auto flex items-center justify-center gap-2 bg-gray-900 hover:bg-gray-800 border border-gray-800 text-white px-8 py-4 rounded-full font-semibold transition-all">
            <Code size={18} /> View Source
          </a>
        </div>
      </main>

      {/* Features Grid */}
      <section className="py-24 bg-gray-900/30 border-t border-gray-800/50">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-gray-950 p-8 rounded-3xl border border-gray-800 hover:border-gray-600 transition-colors">
              <div className="w-12 h-12 bg-gray-900 text-gray-100 border border-gray-800 rounded-xl flex items-center justify-center mb-6">
                <Shield size={24} />
              </div>
              <h3 className="text-xl font-bold mb-3">Absolute Privacy</h3>
              <p className="text-gray-400 text-sm leading-relaxed">
                Your data never leaves your device. Models are downloaded and cached locally, ensuring enterprise-grade security for sensitive information.
              </p>
            </div>

            <div className="bg-gray-950 p-8 rounded-3xl border border-gray-800 hover:border-gray-600 transition-colors">
              <div className="w-12 h-12 bg-gray-900 text-gray-100 border border-gray-800 rounded-xl flex items-center justify-center mb-6">
                <Zap size={24} />
              </div>
              <h3 className="text-xl font-bold mb-3">Zero Latency</h3>
              <p className="text-gray-400 text-sm leading-relaxed">
                By bypassing server round-trips, inference happens in real-time utilizing your device's native Neural Engine and WebGPU.
              </p>
            </div>

            <div className="bg-gray-950 p-8 rounded-3xl border border-gray-800 hover:border-gray-600 transition-colors">
              <div className="w-12 h-12 bg-gray-900 text-gray-100 border border-gray-800 rounded-xl flex items-center justify-center mb-6">
                <Eye size={24} />
              </div>
              <h3 className="text-xl font-bold mb-3">Multimodal Vision</h3>
              <p className="text-gray-400 text-sm leading-relaxed">
                Upload images for instant local classification and analysis, seamlessly feeding context into the local LLM reasoning engine.
              </p>
            </div>
          </div>
        </div>
      </section>
      
    </div>
  );
}
