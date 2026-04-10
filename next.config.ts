import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // 1. Disable this. It is known to crash when analyzing heavy WebGL/WASM AI libraries.
  reactCompiler: false,

  // 2. The crucial fix: Tell Webpack to ignore the massive Node binaries
  webpack: (config) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      "sharp$": false,
      "onnxruntime-node$": false,
    };
    return config;
  },
};

export default nextConfig;