import { useState } from "react";
import mammoth from "mammoth";
import { A4_WIDTH, A4_HEIGHT } from "../utils/constants";

export const useFileProcessing = () => {
  const [pages, setPages] = useState([]);

  const processPDF = async (file) => {
    // This method requires pdfjs-dist or similar library imported globally
    if (!window["pdfjsLib"]) throw new Error("pdfjsLib not found in window");

    const pdfjsLib = window["pdfjsLib"];
    pdfjsLib.GlobalWorkerOptions.workerSrc =
      "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";

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

      await page.render({ canvasContext: context, viewport }).promise;

      pageImages.push({
        number: i,
        image: canvas.toDataURL(),
        width: canvas.width,
        height: canvas.height,
      });
    }
    setPages(pageImages);
    return pageImages;
  };

  const processWord = async (file) => {
    // Uses mammoth to convert Word to HTML, then render canvas pages
    const arrayBuffer = await file.arrayBuffer();
    const result = await mammoth.convertToHtml({ arrayBuffer });
    const html = result.value;

    const tempDiv = document.createElement("div");
    tempDiv.innerHTML = html;
    tempDiv.style.width = `${A4_WIDTH}px`;
    tempDiv.style.padding = "40px";
    tempDiv.style.backgroundColor = "white";
    tempDiv.style.fontFamily = "Arial, sans-serif";
    tempDiv.style.fontSize = "14px";
    tempDiv.style.lineHeight = "1.6";
    document.body.appendChild(tempDiv);

    const lines = tempDiv.innerText.split("\n").filter((l) => l.trim() !== "");
    document.body.removeChild(tempDiv);

    const linesPerPage = 45;
    const pageImages = [];

    for (let pageIdx = 0; pageIdx * linesPerPage < lines.length; pageIdx++) {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      canvas.width = A4_WIDTH;
      canvas.height = A4_HEIGHT;

      ctx.fillStyle = "white";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = "black";
      ctx.font = "14px Arial";

      let y = 40;
      const pageLines = lines.slice(
        pageIdx * linesPerPage,
        (pageIdx + 1) * linesPerPage
      );
      for (const line of pageLines) {
        if (y < canvas.height - 40) {
          ctx.fillText(line, 40, y);
          y += 20;
        }
      }

      pageImages.push({
        number: pageIdx + 1,
        image: canvas.toDataURL(),
        width: A4_WIDTH,
        height: A4_HEIGHT,
      });
    }

    setPages(pageImages);
    return pageImages;
  };

  return {
    pages,
    setPages,
    processPDF,
    processWord,
  };
};
