# ODM (On-Device Multimodal Engine)

[![Release](https://img.shields.io/badge/Release-v1.0.0-emerald.svg)](https://github.com/yourusername/odm-llm/releases)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)

ODM is a zero-latency, privacy-first Edge AI application that runs advanced Large Language Models and Vision Transformers entirely within the browser. By leveraging WebAssembly and native WebGPU/CPU limits, ODM eliminates cloud server dependency, ensuring user data never leaves the device.

## What's New in v1.0.0 (Initial Release)
* **Smart Model Management:** Dynamically select, download, and swap between highly optimized WebGPU models (Llama 3.2 1B, Phi-3 Mini, Qwen 2 1.5B, Llama 3 8B) directly from the UI.
* **Storage Control:** View cached models and instantly clear local browser cache or chat history from the Settings menu to free up hard drive space.
* **Mobile Guard:** Apple and Google currently restrict WebGPU RAM on mobile devices. ODM v1.0.0 introduces a seamless "Desktop Required" lock screen to prevent silent out-of-memory (OOM) crashes on phones.
* **Chat Export & Share:** Instantly share full conversation threads via WhatsApp, copy them as formatted text, or generate encoded local links.
* **In-App Feedback:** A built-in, slide-out feedback drawer that formats and sends user suggestions directly to the developer via the native mail client.
* **Auto-Initialization:** ODM automatically scans the browser cache on startup and instantly boots the AI engine if a model is already downloaded.

## Key Features

* **Zero-Latency Edge Inference:** Runs state-of-the-art LLMs natively in the browser using `@mlc-ai/web-llm`.
* **Local Multimodal Vision:** Processes image classification offline via a dedicated Web Worker running compressed vision models for instant local context.
* **Absolute Privacy:** Inference is computed entirely on your local hardware. Prompts and images are never transmitted to external APIs.
* **Persistent Local Storage:** Chat history is saved directly to the device using `Dexie.js` (IndexedDB wrapper), preventing RAM bloat while allowing infinite, scrollable history.
* **Enterprise-Grade Authentication:** Protected routes powered by `NextAuth.js` with server-side session validation and Google OAuth integration.
* **Premium Dark-Mode UI:** A seamless, sleek interface built with Tailwind CSS, featuring smooth slide-out drawers, responsive modals, and active hardware status indicators.

## Tech Stack

* **Framework:** Next.js 15 (App Router)
* **LLM Engine:** WebLLM (`@mlc-ai/web-llm`)
* **Vision Engine:** Transformers.js (`@huggingface/transformers`)
* **Database:** IndexedDB (via `Dexie.js`)
* **Authentication:** NextAuth.js (Google Provider)
* **Styling:** Tailwind CSS + PostCSS
* **Icons:** Lucide React

## Getting Started

### Prerequisites
* Node.js (v18 or higher)
* A Google Cloud Console account (for OAuth credentials)
* A WebGPU-compatible desktop browser (Chrome, Edge, or Safari with WebGPU flags enabled)
