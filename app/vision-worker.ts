// app/vision-worker.ts
import { pipeline, env } from "@huggingface/transformers";

env.allowLocalModels = false;
let imageClassifier: any = null;

self.onmessage = async (event) => {
  const { type, imageData } = event.data;

  if (type === "analyze") {
    try {
      if (!imageClassifier) {
        self.postMessage({
          status: "loading",
          message: "Loading Vision Model...",
        });

        // 🚀 THE FIX: We use 'image-classification' instead of 'image-to-text'
        // This pure vision model has no text-decoder, completely avoiding the ONNX crash.
        // 🚀 SWAPPED TO MOBILENET: 14MB instead of 340MB. Eliminates freezing entirely.
        // 🚀 THE REAL FIX: Using the officially supported ResNet-50 model.
        // It compresses down to ~23MB and runs instantly on the edge.
        imageClassifier = await pipeline(
          "image-classification",
          "Xenova/resnet-50",
          {
            dtype: "q8",
            device: "wasm",
            progress_callback: (info: any) => {
              if (info.status === "progress") {
                self.postMessage({
                  status: "loading",
                  message: `Downloading Vision: ${Math.round(info.progress)}%`,
                });
              } else if (info.status === "ready") {
                self.postMessage({
                  status: "loading",
                  message: "Compiling Vision Engine...",
                });
              }
            },
          },
        );
      }

      self.postMessage({
        status: "analyzing",
        message: "Identifying object...",
      });

      // Get the classification results
      const results = await imageClassifier(imageData);

      // We grab the label with the highest confidence score
      const topLabel = results[0].label;

      // Send the label back to the UI
      self.postMessage({ status: "complete", caption: topLabel });
    } catch (error) {
      console.error("🔥 THE REAL VISION ERROR:", error);
      self.postMessage({
        status: "error",
        message: "Failed to analyze image.",
      });
    }
  }
};
