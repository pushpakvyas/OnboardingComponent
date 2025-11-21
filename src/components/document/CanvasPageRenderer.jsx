// src/components/document/CanvasPageRenderer.jsx
import React, { useEffect, useRef } from "react";
import { renderPageToCanvas } from "../../utils/pdfProcessor";
import { A4_WIDTH, A4_HEIGHT } from "../../constants/layoutConstants";

export const CanvasPageRenderer = ({
  arrayBuffer,
  pageNumber,
  width = A4_WIDTH,
  height = A4_HEIGHT,
  className = "",
  isBlankDocument = false,
}) => {
  const canvasRef = useRef(null);
  const renderIdRef = useRef(0);

  useEffect(() => {
    const currentRenderId = ++renderIdRef.current;

    const renderPage = async () => {
      if (!canvasRef.current || !pageNumber) return;

      try {
        if (isBlankDocument) {
          const ctx = canvasRef.current.getContext("2d");
          ctx.fillStyle = "#ffffff";
          ctx.fillRect(0, 0, width, height);
          return;
        }

        if (!arrayBuffer) {
          console.warn("CanvasPageRenderer: no arrayBuffer provided");
          const ctx = canvasRef.current.getContext("2d");
          ctx.fillStyle = "#ffffff";
          ctx.fillRect(0, 0, width, height);
          ctx.fillStyle = "#333";
          ctx.font = "12px sans-serif";
          ctx.textAlign = "center";
          ctx.fillText("No PDF data", width / 2, height / 2);
          return;
        }

        if (currentRenderId === renderIdRef.current) {
          await renderPageToCanvas(arrayBuffer, pageNumber, canvasRef.current);
        }
      } catch (error) {
        console.error("Error rendering page:", error);
        if (canvasRef.current && currentRenderId === renderIdRef.current) {
          const context = canvasRef.current.getContext("2d");
          context.fillStyle = "#ffffff";
          context.fillRect(0, 0, width, height);
          context.fillStyle = "#ef4444";
          context.font = "14px sans-serif";
          context.textAlign = "center";
          context.fillText("Error loading PDF", width / 2, height / 2);
        }
      }
    };

    renderPage();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [arrayBuffer, pageNumber, width, height, isBlankDocument]);

  return (
    <canvas
      ref={canvasRef}
      width={width}
      height={height}
      className={className}
      style={{ display: "block" }}
    />
  );
};

export default CanvasPageRenderer;
