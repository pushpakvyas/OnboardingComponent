import mammoth from "mammoth";
import {
  A4_WIDTH,
  A4_HEIGHT,
  WORD_LINES_PER_PAGE,
  CANVAS_CONFIG,
} from "../../constants/layoutConstants";

export const processWord = async (file) => {
  const arrayBuffer = await file.arrayBuffer();
  const result = await mammoth.convertToHtml({ arrayBuffer });
  const html = result.value;

  const tempDiv = document.createElement("div");
  tempDiv.innerHTML = html;
  tempDiv.style.width = `${A4_WIDTH}px`;
  tempDiv.style.padding = `${CANVAS_CONFIG.padding}px`;
  tempDiv.style.backgroundColor = CANVAS_CONFIG.backgroundColor;
  tempDiv.style.fontFamily = CANVAS_CONFIG.fontFamily;
  tempDiv.style.fontSize = `${CANVAS_CONFIG.fontSize}px`;
  tempDiv.style.lineHeight = CANVAS_CONFIG.lineHeight;
  document.body.appendChild(tempDiv);

  const lines = tempDiv.innerText.split("\n").filter((l) => l.trim() !== "");
  document.body.removeChild(tempDiv);

  const pageImages = [];

  for (
    let pageIdx = 0;
    pageIdx * WORD_LINES_PER_PAGE < lines.length;
    pageIdx++
  ) {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    canvas.width = A4_WIDTH;
    canvas.height = A4_HEIGHT;

    ctx.fillStyle = CANVAS_CONFIG.backgroundColor;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "black";
    ctx.font = `${CANVAS_CONFIG.fontSize}px ${CANVAS_CONFIG.fontFamily}`;

    let y = CANVAS_CONFIG.padding;
    const pageLines = lines.slice(
      pageIdx * WORD_LINES_PER_PAGE,
      (pageIdx + 1) * WORD_LINES_PER_PAGE
    );

    for (const line of pageLines) {
      if (y < canvas.height - CANVAS_CONFIG.padding) {
        ctx.fillText(line, CANVAS_CONFIG.padding, y);
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

  return pageImages;
};
