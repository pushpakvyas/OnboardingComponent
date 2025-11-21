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

// Process PDF and return ArrayBuffer + metadata
export const processPDF = async (file) => {
  try {
    const pdfjsLib = await loadPdfJs();
    const arrayBuffer = await file.arrayBuffer();

    if (!arrayBuffer || arrayBuffer.byteLength === 0) {
      throw new Error("Empty PDF file");
    }

    // Store the original ArrayBuffer
    const pdfArrayBuffer = arrayBuffer.slice(0);

    // Load PDF to get page count and dimensions
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
      pages,
      pageCount,
      isBlankDocument: false,
    };
  } catch (error) {
    console.error("Error processing PDF:", error);
    throw error;
  }
};

// Render specific page from ArrayBuffer to canvas
export const renderPageToCanvas = async (
  arrayBuffer,
  pageNumber,
  targetCanvas
) => {
  try {
    if (!arrayBuffer) {
      // Blank page
      const ctx = targetCanvas.getContext("2d");
      targetCanvas.width = A4_WIDTH;
      targetCanvas.height = A4_HEIGHT;
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, A4_WIDTH, A4_HEIGHT);
      return true;
    }

    if (!(arrayBuffer instanceof ArrayBuffer)) {
      throw new Error("Invalid PDF data. Expected ArrayBuffer.");
    }

    if (!targetCanvas) {
      throw new Error("No canvas provided");
    }

    const pdfjsLib = await loadPdfJs();

    // Load PDF
    const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
    const pdf = await loadingTask.promise;

    // Get page
    const page = await pdf.getPage(pageNumber);

    // Calculate scale to fit A4
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

    // Center the page content
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

    return true;
  } catch (error) {
    console.error("Error rendering page:", error);
    throw error;
  }
};
