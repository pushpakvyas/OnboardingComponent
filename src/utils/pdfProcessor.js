import { A4_WIDTH, A4_HEIGHT } from "../constants/layoutConstants";
let pdfjsLib = null;
let pdfjsLoadingPromise = null;

const loadPdfJs = () => {
  // If already loaded, return it
  if (pdfjsLib) {
    return Promise.resolve(pdfjsLib);
  }

  // If currently loading, return the existing promise
  if (pdfjsLoadingPromise) {
    return pdfjsLoadingPromise;
  }

  // Start loading
  pdfjsLoadingPromise = new Promise((resolve, reject) => {
    // Check if already loaded in window
    if (window["pdfjs-dist/build/pdf"]) {
      pdfjsLib = window["pdfjs-dist/build/pdf"];
      pdfjsLib.GlobalWorkerOptions.workerSrc =
        "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";
      resolve(pdfjsLib);
      return;
    }

    // Dynamically load the script
    const script = document.createElement("script");
    script.src =
      "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js";
    script.async = true;

    script.onload = () => {
      pdfjsLib = window["pdfjs-dist/build/pdf"];
      if (pdfjsLib) {
        pdfjsLib.GlobalWorkerOptions.workerSrc =
          "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";
        console.log("PDF.js loaded successfully");
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

export const processPDF = async (file) => {
  // Load PDF.js first
  const pdfjsLib = await loadPdfJs();

  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  const pageCount = pdf.numPages;
  const pageImages = [];

  for (let i = 1; i <= pageCount; i++) {
    const page = await pdf.getPage(i);
    const viewport = page.getViewport({ scale: 1.2 });
    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d");
    canvas.width = viewport.width;
    canvas.height = viewport.height;

    await page.render({
      canvasContext: context,
      viewport: page.getViewport({ scale: A4_WIDTH / viewport.width }),
    }).promise;

    pageImages.push({
      number: i,
      image: canvas.toDataURL(),
      width: canvas.width,
      height: canvas.height,
    });
  }

  return pageImages;
};
