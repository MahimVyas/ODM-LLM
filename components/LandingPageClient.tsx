"use client";

import { signIn } from "next-auth/react";
import { Zap, Shield, Cpu, Eye, ArrowRight, Code, Linkedin, Github, Terminal, Layers } from "lucide-react";
import Link from "next/link";

export default function LandingPageClient() {
  const handleAuth = () => {
    signIn("google", { callbackUrl: "/chat" });
  };

  const techStack = [
    "Next.js 16", "React", "TypeScript", "Tailwind CSS", 
    "WebGPU", "WebAssembly", "WebLLM", "Transformers.js", 
    "IndexedDB", "Dexie.js", "NextAuth"
  ];

  return (
    <div className="min-h-screen bg-[#212121] text-gray-50 font-sans selection:bg-gray-700 overflow-x-hidden">
      
      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 backdrop-blur-md bg-[#212121]/80 border-b border-white/5">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 font-bold text-xl tracking-tighter">
            <Cpu className="text-gray-400" size={24} />
            <span>ODM<span className="text-gray-500">.</span></span>
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
              className="text-sm bg-gray-100 hover:bg-white text-[#212121] px-4 py-2 rounded-full font-semibold transition shadow-sm"
            >
              Sign up
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="pt-32 pb-20 px-6 max-w-6xl mx-auto flex flex-col items-center text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#2F2F2F] border border-white/10 text-xs font-medium text-gray-300 mb-8">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-gray-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-gray-500"></span>
          </span>
          WebAssembly & WebGPU Powered
        </div>
        
        <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-6 leading-tight max-w-4xl">
          On-Device Multimodal <br className="hidden md:block" />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-gray-100 to-gray-500">
            Intelligence.
          </span>
        </h1>
        
        <p className="text-gray-400 text-lg md:text-xl max-w-2xl mb-10 leading-relaxed">
          Run advanced Vision Transformers and Large Language Models entirely in your browser. Zero cloud dependency. Zero latency. Absolute privacy.
        </p>

        <div className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto">
          <button 
            onClick={handleAuth}
            className="w-full sm:w-auto flex items-center justify-center gap-2 bg-gray-100 hover:bg-white text-[#212121] px-8 py-4 rounded-full font-semibold transition-all hover:scale-105 shadow-lg shadow-white/5"
          >
            Launch Engine <ArrowRight size={18} />
          </button>
          <a href="https://github.com/MahimVyas/ODM-LLM" target="_blank" rel="noreferrer" className="w-full sm:w-auto flex items-center justify-center gap-2 bg-[#2F2F2F] hover:bg-[#3F3F3F] border border-white/10 text-white px-8 py-4 rounded-full font-semibold transition-all">
            <Code size={18} /> View Source
          </a>
        </div>
      </main>

      {/* Features Grid */}
      <section className="py-24 bg-[#1A1A1A] border-t border-white/5">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-[#212121] p-8 rounded-3xl border border-white/5 hover:border-white/20 transition-colors">
              <div className="w-12 h-12 bg-[#2F2F2F] text-gray-100 border border-white/10 rounded-xl flex items-center justify-center mb-6">
                <Shield size={24} />
              </div>
              <h3 className="text-xl font-bold mb-3">Absolute Privacy</h3>
              <p className="text-gray-400 text-sm leading-relaxed">
                Your data never leaves your device. Models are downloaded and cached locally, ensuring enterprise-grade security for sensitive information.
              </p>
            </div>

            <div className="bg-[#212121] p-8 rounded-3xl border border-white/5 hover:border-white/20 transition-colors">
              <div className="w-12 h-12 bg-[#2F2F2F] text-gray-100 border border-white/10 rounded-xl flex items-center justify-center mb-6">
                <Zap size={24} />
              </div>
              <h3 className="text-xl font-bold mb-3">Zero Latency</h3>
              <p className="text-gray-400 text-sm leading-relaxed">
                By bypassing server round-trips, inference happens in real-time utilizing your device's native Neural Engine and WebGPU.
              </p>
            </div>

            <div className="bg-[#212121] p-8 rounded-3xl border border-white/5 hover:border-white/20 transition-colors">
              <div className="w-12 h-12 bg-[#2F2F2F] text-gray-100 border border-white/10 rounded-xl flex items-center justify-center mb-6">
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

      {/* 🚀 Tech Stack Section */}
      <section className="py-24 bg-[#212121] border-t border-white/5">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <div className="inline-flex items-center justify-center w-12 h-12 bg-[#2F2F2F] text-gray-100 border border-white/10 rounded-xl mb-6">
            <Layers size={24} />
          </div>
          <h2 className="text-3xl font-bold mb-6 tracking-tight">Built for the Modern Web</h2>
          <p className="text-gray-400 text-lg mb-12 max-w-2xl mx-auto">
            Engineered using cutting-edge browser APIs and modern web frameworks to deliver native-like AI performance.
          </p>
          
          <div className="flex flex-wrap justify-center gap-3">
            {techStack.map((tech, index) => (
              <span 
                key={index} 
                className="px-4 py-2 bg-[#2F2F2F] border border-white/5 text-gray-300 rounded-full text-sm font-medium hover:bg-[#3F3F3F] transition-colors cursor-default"
              >
                {tech}
              </span>
            ))}
          </div>
        </div>
      </section>
      
      {/* 🚀 Footer Section */}
      <footer className="bg-[#1A1A1A] border-t border-white/5 py-12">
        <div className="max-w-6xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-6">
          
          {/* Copyright & License */}
          <div className="text-center md:text-left">
            <p className="text-gray-200 font-semibold tracking-wide">
              Developed by <span className="text-white">MAHIM VYAS</span>
            </p>
            <p className="text-gray-500 text-sm mt-1">
              &copy; {new Date().getFullYear()} ODM. Released under the MIT License.
            </p>
          </div>

          {/* Social Links */}
          <div className="flex items-center gap-4">
            <a 
              href="https://www.linkedin.com/in/mahimvyas" 
              target="_blank" 
              rel="noopener noreferrer"
              className="p-2.5 bg-[#2F2F2F] border border-white/5 rounded-xl text-gray-400 hover:text-white hover:bg-[#3F3F3F] transition-all hover:scale-105"
              title="LinkedIn"
            >
              <Linkedin size={20} />
            </a>
            <a 
              href="https://github.com/MahimVyas" 
              target="_blank" 
              rel="noopener noreferrer"
              className="p-2.5 bg-[#2F2F2F] border border-white/5 rounded-xl text-gray-400 hover:text-white hover:bg-[#3F3F3F] transition-all hover:scale-105"
              title="GitHub"
            >
              <Github size={20} />
            </a>
            <a 
              href="https://leetcode.com/u/mahimvyas/" 
              target="_blank" 
              rel="noopener noreferrer"
              className="p-2.5 bg-[#2F2F2F] border border-white/5 rounded-xl text-gray-400 hover:text-white hover:bg-[#3F3F3F] transition-all hover:scale-105"
              title="LeetCode"
            >
              <Terminal size={20} />
            </a>
          </div>

        </div>
      </footer>

    </div>
  );
}