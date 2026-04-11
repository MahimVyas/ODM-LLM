# ODM (On-Device Multimodal Engine)

ODM is a zero-latency, privacy-first Edge AI application that runs advanced Large Language Models and Vision Transformers entirely within the browser. By leveraging WebAssembly and native WebGPU/CPU limits, ODM eliminates cloud server dependency, ensuring user data never leaves their device.

## Key Features

* **Zero-Latency Edge Inference:** Runs state-of-the-art LLMs (Llama 3.2, Phi-3, Qwen) natively in the browser using `@mlc-ai/web-llm`.
* **Local Multimodal Vision:** Processes image classification offline via a dedicated Web Worker running `Xenova/resnet-50` compressed to 8-bit quantization (~23MB) for instant local context.
* **Absolute Privacy:** Inference is computed on the user's hardware. Prompts and images are never transmitted to external APIs.
* **Persistent Local Storage:** Chat history is saved directly to the device's hard drive using `Dexie.js` (IndexedDB wrapper), preventing RAM bloat while allowing infinite scrollable history.
* **Enterprise-Grade Authentication:** Protected routes powered by `NextAuth.js` with server-side session validation and Google OAuth integration.
* **Responsive Dark-Mode UI:** A seamless, ChatGPT-style interface built with Tailwind CSS and Lucide React.

## Tech Stack

* **Framework:** Next.js 16 (App Router)
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

### 1. Clone the Repository
\`\`\`bash
git clone https://github.com/yourusername/odm-llm.git
cd odm-llm/edge-vision-app
\`\`\`

### 2. Install Dependencies
\`\`\`bash
npm install
\`\`\`

### 3. Environment Variables
Create a `.env.local` file in the root directory and add the following keys:
\`\`\`env
# Generate using Google Cloud Console -> APIs & Services -> Credentials
GOOGLE_CLIENT_ID=your_google_client_id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your_google_client_secret

# Run `openssl rand -base64 32` in your terminal to generate this
NEXTAUTH_SECRET=your_secure_random_string
NEXTAUTH_URL=http://localhost:3000
\`\`\`

### 4. Run the Development Server
**Note:** To prevent Webpack memory leaks when compiling heavy WASM binaries for the Vision worker, explicitly run the server with the `--webpack` flag:
\`\`\`bash
npm run dev --webpack
\`\`\`
Open [http://localhost:3000](http://localhost:3000) to view the landing page.

## System Architecture

ODM handles intensive AI computations without freezing the React UI thread by utilizing a multi-worker architecture:

1. **Main Thread:** Handles React state, UI rendering, IndexedDB reads/writes, and Markdown parsing.
2. **LLM Web Worker (`worker.ts`):** Initializes the WebGPU engine and streams text chunks back to the main thread.
3. **Vision Web Worker (`vision-worker.ts`):** Independently downloads and compiles the ResNet-50 model, executing image analysis in isolation and sending the highest-confidence label back to the LLM context window.

## Known Issues & Troubleshooting

* **Next.js Turbopack Crashes:** Next.js 16 uses Turbopack by default, which currently struggles to bundle the `onnxruntime-node` fallbacks within `transformers.js`. Always run the dev server with `npm run dev --webpack`.
* **Model Download Freezes:** If the browser tab is closed during the initial ~1.2GB model download, the CacheStorage may corrupt. If the AI fails to load, open Chrome DevTools -> Application -> IndexedDB -> `transformers-cache` -> Delete, and refresh the page.

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.