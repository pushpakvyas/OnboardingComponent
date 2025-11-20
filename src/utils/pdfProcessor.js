// src/utils/pdfProcessor.js
import { A4_WIDTH, A4_HEIGHT } from "../constants/layoutConstants";

let pdfjsLib = null;
let pdfjsLoadingPromise = null;

// In-memory store for ArrayBuffers keyed by document id
export const pdfBufferStore = new Map();

const loadPdfJs = () => {
  if (pdfjsLib) {
    return Promise.resolve(pdfjsLib);
  }

  if (pdfjsLoadingPromise) {
    return pdfjsLoadingPromise;
  }

  pdfjsLoadingPromise = new Promise((resolve, reject) => {
    if (window["pdfjs-dist/build/pdf"]) {
      pdfjsLib = window["pdfjs-dist/build/pdf"];
      pdfjsLib.GlobalWorkerOptions.workerSrc =
        "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";
      resolve(pdfjsLib);
      return;
    }

    const script = document.createElement("script");
    script.src =
      "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js";
    script.async = true;
    script.onload = () => {
      pdfjsLib = window["pdfjs-dist/build/pdf"];
      if (pdfjsLib) {
        pdfjsLib.GlobalWorkerOptions.workerSrc =
          "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";
        resolve(pdfjsLib);
      } else {
        reject(new Error("PDF.js failed to load"));
      }
    };
    script.onerror = () => {
      reject(new Error("Failed to load PDF.js script"));
    };
    document.head.appendChild(script);
  });

  return pdfjsLoadingPromise;
};

// --- Safe conversions ---
// chunked approach avoids corrupting binary when using String.fromCharCode.apply

export const arrayBufferToBase64 = (buffer) => {
  const bytes = new Uint8Array(buffer);
  const chunkSize = 0x8000; // 32KB
  let binary = "";

  for (let i = 0; i < bytes.length; i += chunkSize) {
    const chunk = bytes.subarray(i, i + chunkSize);
    binary += String.fromCharCode.apply(null, chunk);
  }
  return btoa(binary);
};

export const base64ToArrayBuffer = (base64) => {
  const binary = atob(base64);
  const len = binary.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
};

// Process PDF and return ArrayBuffer + metadata (no automatic persistence here)
export const processPDF = async (file) => {
  try {
    const pdfjsLib = await loadPdfJs();
    const arrayBuffer = await file.arrayBuffer();

    if (!arrayBuffer || arrayBuffer.byteLength === 0) {
      throw new Error("Empty PDF file");
    }

    // Keep original ArrayBuffer
    const pdfArrayBuffer = arrayBuffer.slice(0);

    // Optionally create base64 fallback for persistence if you ever need it
    const base64String = arrayBufferToBase64(arrayBuffer);

    // Load PDF to get page info
    const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
    const pdf = await loadingTask.promise;

    const pageCount = pdf.numPages;
    const pages = [];

    // Extract page dimensions
    for (let i = 1; i <= pageCount; i++) {
      const page = await pdf.getPage(i);
      const viewport = page.getViewport({ scale: 1.0 });

      pages.push({
        number: i,
        width: A4_WIDTH,
        height: A4_HEIGHT,
        originalWidth: viewport.width,
        originalHeight: viewport.height,
      });
    }

    return {
      arrayBuffer: pdfArrayBuffer,
      arrayBufferBase64: base64String,
      pages,
      pageCount,
    };
  } catch (error) {
    console.error("Error processing PDF:", error);
    throw error;
  }
};

// Render specific page from ArrayBuffer OR base64 to canvas
export const renderPageToCanvas = async (pdfData, pageNumber, targetCanvas) => {
  try {
    if (!pdfData) {
      throw new Error("No PDF data provided");
    }

    if (!targetCanvas) {
      throw new Error("No canvas provided");
    }

    const pdfjsLib = await loadPdfJs();

    // Accept either ArrayBuffer or base64 string
    let arrayBuffer;
    if (typeof pdfData === "string") {
      // base64 string
      arrayBuffer = base64ToArrayBuffer(pdfData);
    } else if (pdfData instanceof ArrayBuffer) {
      arrayBuffer = pdfData;
    } else if (pdfData && pdfData.buffer instanceof ArrayBuffer) {
      // in case a Uint8Array is passed
      arrayBuffer = pdfData.buffer;
    } else {
      throw new Error("Invalid PDF data type. Expect ArrayBuffer or base64 string.");
    }

    // Load PDF
    const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
    const pdf = await loadingTask.promise;

    // Get page
    const page = await pdf.getPage(pageNumber);

    // Calculate scale
    const originalViewport = page.getViewport({ scale: 1.0 });
    const scaleX = A4_WIDTH / originalViewport.width;
    const scaleY = A4_HEIGHT / originalViewport.height;
    const scale = Math.min(scaleX, scaleY);

    const viewport = page.getViewport({ scale });

    // Create offscreen canvas
    const offscreenCanvas = document.createElement("canvas");
    offscreenCanvas.width = A4_WIDTH;
    offscreenCanvas.height = A4_HEIGHT;

    const context = offscreenCanvas.getContext("2d", { alpha: false });

    // White background
    context.fillStyle = "#ffffff";
    context.fillRect(0, 0, offscreenCanvas.width, offscreenCanvas.height);

    // Center the page
    const xOffset = (A4_WIDTH - viewport.width) / 2;
    const yOffset = (A4_HEIGHT - viewport.height) / 2;

    context.save();
    context.translate(xOffset, yOffset);

    // Render to offscreen canvas
    const renderContext = {
      canvasContext: context,
      viewport: viewport,
      annotationMode: 0,
    };

    const renderTask = page.render(renderContext);
    await renderTask.promise;

    context.restore();

    // Copy to target canvas
    const targetContext = targetCanvas.getContext("2d");
    targetCanvas.width = A4_WIDTH;
    targetCanvas.height = A4_HEIGHT;
    targetContext.drawImage(offscreenCanvas, 0, 0);

    // Cleanup
    offscreenCanvas.width = 0;
    offscreenCanvas.height = 0;

    return true;
  } catch (error) {
    console.error("Error rendering page:", error);
    throw error;
  }
};
