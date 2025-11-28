import { pdfBufferStore } from "./pdfBufferStore";
import * as pdfjsLib from "pdfjs-dist";

import workerSrc from "pdfjs-dist/build/pdf.worker.min.js?url";

// Configure worker with correct path
if (typeof window !== "undefined") {
  pdfjsLib.GlobalWorkerOptions.workerSrc = workerSrc;
}

export const loadPdfJs = () => {
  return Promise.resolve(pdfjsLib);
};

export const processPDF = async (file, documentId) => {
  if (!file) throw new Error("No file provided to processPDF");
  if (!documentId) throw new Error("documentId is required for processPDF");

  const original = await file.arrayBuffer();

  if (!original || original.byteLength === 0) {
    throw new Error("Empty PDF file");
  }

  // safe store copy (never passed to worker)
  const storedBuffer = original.slice(0);

  // worker copy (allowed to be detached by pdf.js)
  const workerBuffer = original.slice(0);

  // persist safe buffer
  pdfBufferStore.set(documentId, storedBuffer);

  // pass worker copy to pdf.js as a Uint8Array (worker may take ownership)
  const loadingTask = pdfjsLib.getDocument({
    data: new Uint8Array(workerBuffer),
  });
  const pdf = await loadingTask.promise;

  const pageCount = pdf.numPages;
  const pages = [];

  for (let i = 1; i <= pageCount; i++) {
    const page = await pdf.getPage(i);
    const viewport = page.getViewport({ scale: 1.0 });
    pages.push({
      number: i,
      width: 816,
      height: 1056,
      originalWidth: viewport.width,
      originalHeight: viewport.height,
    });
  }

  return {
    arrayBuffer: storedBuffer,
    pages,
    pageCount,
    isBlankDocument: false,
  };
};

export const renderPageToCanvas = async (
  arrayBufferOrView,
  pageNumber,
  targetCanvas
) => {
  try {
    if (!arrayBufferOrView)
      throw new Error("No arrayBuffer provided to renderPageToCanvas");

    let workerUint8;

    // ArrayBuffer
    if (arrayBufferOrView instanceof ArrayBuffer) {
      if (arrayBufferOrView.byteLength === 0)
        throw new Error("Provided ArrayBuffer is detached/empty");
      workerUint8 = new Uint8Array(arrayBufferOrView.slice(0)); // fresh clone
    } else if (ArrayBuffer.isView(arrayBufferOrView)) {
      // TypedArray or DataView: copy the real bytes
      const view = arrayBufferOrView;
      const buf = view.buffer.slice(
        view.byteOffset,
        view.byteOffset + view.byteLength
      );
      if (buf.byteLength === 0)
        throw new Error("Provided ArrayBuffer view is detached/empty");
      workerUint8 = new Uint8Array(buf);
    } else {
      throw new Error("Unsupported buffer type for renderPageToCanvas");
    }

    const loadingTask = pdfjsLib.getDocument({ data: workerUint8 });
    const pdf = await loadingTask.promise;

    const page = await pdf.getPage(pageNumber);
    const viewport = page.getViewport({ scale: 1.5 });

    // render to temporary canvas then draw scaled to target
    const tempCanvas = document.createElement("canvas");
    tempCanvas.width = viewport.width;
    tempCanvas.height = viewport.height;

    const tempCtx = tempCanvas.getContext("2d");
    tempCtx.fillStyle = "#ffffff";
    tempCtx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);

    await page.render({
      canvasContext: tempCtx,
      viewport,
    }).promise;

    const targetCtx = targetCanvas.getContext("2d");
    targetCtx.clearRect(0, 0, targetCanvas.width, targetCanvas.height);
    targetCtx.drawImage(
      tempCanvas,
      0,
      0,
      targetCanvas.width,
      targetCanvas.height
    );

    return true;
  } catch (err) {
    console.error("PDF render failed:", err);
    throw err;
  }
};
