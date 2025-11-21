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
        if (isBlankDocument || !arrayBuffer) {
          // Render blank page
          const context = canvasRef.current.getContext("2d");
          context.fillStyle = "#ffffff";
          context.fillRect(0, 0, width, height);
          return;
        }

        if (currentRenderId === renderIdRef.current) {
          await renderPageToCanvas(arrayBuffer, pageNumber, canvasRef.current);
        }
      } catch (error) {
        console.error("Error rendering page:", error);

        // Render error state
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
