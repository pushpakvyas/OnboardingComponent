import { PDFDocument } from "pdf-lib";
import { A4_WIDTH, A4_HEIGHT } from "../../constants/layoutConstants";

const drawFilledField = async (ctx, field, fieldValue) => {
  if (fieldValue === undefined || fieldValue === null || fieldValue === "") {
    return;
  }

  ctx.font = `${field.fontSize || 14}px ${field.fontFamily || "Arial"}`;
  ctx.fillStyle = field.fontColor || "#000000";

  let textX = field.x;
  let textY = field.y;

  if (field.showLabel !== false && field.labelPosition === "top") {
    textY += 20;
  }

  textX += 8;
  textY += 20;

  if (field.type === "checkbox") {
    const isChecked = fieldValue === true || fieldValue === "true";
    if (isChecked) {
      ctx.strokeStyle = field.fontColor || "#000000";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(textX, textY - 2);
      ctx.lineTo(textX + 4, textY + 2);
      ctx.lineTo(textX + 10, textY - 6);
      ctx.stroke();
    }
  } else if (field.type === "signature") {
    ctx.font = `${field.fontSize || 14}px cursive`;
    ctx.fillText(fieldValue.toString(), textX, textY);
  } else {
    ctx.fillText(fieldValue.toString(), textX, textY);
  }
};

const drawTemplateField = async (ctx, field) => {
  const fieldWidth = field.width || 200;
  const fieldHeight = field.type === "image" ? field.height || 100 : 30;
  let boxX = field.x;
  let boxY = field.y;

  if (field.showLabel !== false) {
    ctx.font = "12px Arial";
    ctx.fillStyle = "#000000";

    const labelText = `${field.label}${field.required ? " *" : ""}`;

    if (field.labelPosition === "top") {
      ctx.fillText(labelText, boxX, boxY + 12);
      boxY += 20;
    } else if (field.labelPosition === "left") {
      ctx.fillText(labelText + ":", boxX, boxY + 20);
      const labelWidth = ctx.measureText(labelText + ": ").width;
      boxX += labelWidth + 5;
    }
  }

  ctx.strokeStyle = "#3B82F6";
  ctx.lineWidth = 2;
  ctx.setLineDash([]);

  if (field.type === "checkbox") {
    ctx.strokeRect(boxX + 5, boxY + 5, 20, 20);
  } else if (field.type === "image") {
    ctx.strokeRect(boxX, boxY, fieldWidth, fieldHeight);

    if (field.imageSrc) {
      try {
        const fieldImg = new Image();
        fieldImg.src = field.imageSrc;
        await new Promise((resolve, reject) => {
          fieldImg.onload = resolve;
          fieldImg.onerror = reject;
          setTimeout(reject, 1000);
        });
        ctx.drawImage(fieldImg, boxX, boxY, fieldWidth, fieldHeight);
      } catch (e) {
        ctx.fillStyle = "#9CA3AF";
        ctx.font = "12px Arial";
        ctx.setLineDash([]);
        ctx.fillText("Image", boxX + 10, boxY + fieldHeight / 2);
        ctx.setLineDash([5, 3]);
      }
    } else {
      ctx.fillStyle = "#9CA3AF";
      ctx.font = "12px Arial";
      ctx.setLineDash([]);
      ctx.fillText("No image", boxX + 10, boxY + fieldHeight / 2);
      ctx.setLineDash([5, 3]);
    }
  } else {
    ctx.strokeRect(boxX, boxY, fieldWidth, fieldHeight);

    ctx.setLineDash([]);
    ctx.fillStyle = "#9CA3AF";
    ctx.font = `${(field.fontSize || 14) - 2}px ${field.fontFamily || "Arial"}`;

    let placeholderText = "";
    switch (field.type) {
      case "text":
        placeholderText = "Text input";
        break;
      case "name":
        placeholderText = "Name";
        break;
      case "email":
        placeholderText = "Email address";
        break;
      case "phone":
        placeholderText = "Phone number";
        break;
      case "date":
        placeholderText = "DD/MM/YYYY";
        break;
      case "signature":
        placeholderText = "Signature";
        ctx.font = `${(field.fontSize || 14) - 2}px cursive`;
        break;
      case "select":
        placeholderText = field.options?.[0] || "Select...";
        break;
      default:
        placeholderText = "Input";
    }

    ctx.fillText(placeholderText, boxX + 8, boxY + 20);
    ctx.setLineDash([5, 3]);
  }

  ctx.setLineDash([]);
};

export const generatePDF = async (doc, userFieldData = null, userId = null) => {
  if (!doc.pages || doc.pages.length === 0) {
    throw new Error("No pages to download");
  }

  const pdfDoc = await PDFDocument.create();

  for (const page of doc.pages) {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    canvas.width = A4_WIDTH;
    canvas.height = A4_HEIGHT;

    const img = new Image();
    img.src = page.image;
    await new Promise((resolve) => {
      img.onload = resolve;
    });
    ctx.drawImage(img, 0, 0, A4_WIDTH, A4_HEIGHT);

    if (doc.droppedFields && doc.droppedFields[page.number]) {
      const fields = doc.droppedFields[page.number];

      for (const field of fields) {
        ctx.save();

        if (userId && userFieldData) {
          const fieldValue = userFieldData[doc.id]?.[userId]?.[field.id];
          await drawFilledField(ctx, field, fieldValue);
        } else {
          await drawTemplateField(ctx, field);
        }

        ctx.restore();
      }
    }

    const imageBytes = await new Promise((resolve) => {
      canvas.toBlob(async (blob) => {
        const arrayBuffer = await blob.arrayBuffer();
        resolve(arrayBuffer);
      }, "image/png");
    });

    const image = await pdfDoc.embedPng(imageBytes);
    const pdfPage = pdfDoc.addPage([A4_WIDTH, A4_HEIGHT]);

    pdfPage.drawImage(image, {
      x: 0,
      y: 0,
      width: A4_WIDTH,
      height: A4_HEIGHT,
    });
  }

  const pdfBytes = await pdfDoc.save();
  return new Blob([pdfBytes], { type: "application/pdf" });
};

export const downloadPDF = async (doc, userFieldData, userId) => {
  try {
    const blob = await generatePDF(doc, userFieldData, userId);
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = userId
      ? `${doc.documentName}_${userId}.pdf`
      : `${doc.documentName.replace(/\s+/g, "_")}_template.pdf`;
    link.click();
    URL.revokeObjectURL(url);
  } catch (error) {
    console.error("Error creating PDF:", error);
    alert("Failed to download PDF. Please try again.");
  }
};
