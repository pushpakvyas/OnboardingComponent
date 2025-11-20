import { PDFDocument, rgb } from "pdf-lib";
import { A4_WIDTH, A4_HEIGHT } from "../constants/layoutConstants";

const PDF_A4_WIDTH = 595.28;
const PDF_A4_HEIGHT = 841.89;

const pixelToPoint = (pixel) => {
  return (pixel / A4_WIDTH) * PDF_A4_WIDTH;
};

const base64ToArrayBuffer = (base64) => {
  const binary = atob(base64);
  const len = binary.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
};

const addFormField = (form, pdfPage, field, pageHeight) => {
  const x = pixelToPoint(field.x);
  const width = pixelToPoint(field.width || 150);
  const height = pixelToPoint(field.height || 36);

  const y = pageHeight - pixelToPoint(field.y) - height;
  const fieldName = `field_${field.id.replace(/[^a-zA-Z0-9]/g, "_")}`;

  try {
    let createdField;

    switch (field.type) {
      case "checkbox":
        createdField = form.createCheckBox(fieldName);
        createdField.addToPage(pdfPage, {
          x,
          y,
          width: pixelToPoint(20),
          height: pixelToPoint(20),
          borderWidth: 2,
          borderColor: rgb(0, 0, 1),
          backgroundColor: rgb(0.95, 0.95, 1),
        });
        if (field.value === true || field.value === "true") {
          createdField.check();
        } else {
          createdField.uncheck();
        }
        break;

      case "dropdown":
        createdField = form.createDropdown(fieldName);
        const options = field.options || ["Option 1", "Option 2", "Option 3"];
        createdField.addOptions(options);
        createdField.addToPage(pdfPage, {
          x,
          y,
          width,
          height,
          borderWidth: 2,
          borderColor: rgb(0, 0, 1),
          backgroundColor: rgb(0.95, 0.95, 1),
        });
        if (field.value && options.includes(field.value)) {
          createdField.select(field.value);
        }
        createdField.setFontSize(field.fontSize || 12);
        break;

      default:
        createdField = form.createTextField(fieldName);
        createdField.addToPage(pdfPage, {
          x,
          y,
          width,
          height:
            field.type === "textarea"
              ? pixelToPoint(field.height || 80)
              : height,
          borderWidth: 2,
          borderColor: rgb(0, 0, 1),
          backgroundColor: rgb(0.95, 0.95, 1),
        });

        if (field.type === "textarea") {
          createdField.enableMultiline();
        }

        if (field.value) {
          createdField.setText(String(field.value));
        }

        createdField.setFontSize(field.fontSize || 12);
        createdField.enableReadOnly(false);

        if (field.required) {
          createdField.enableRequired();
        }
        break;
    }

    console.log(`✅ Added ${field.type} field: ${fieldName}`);
    return true;
  } catch (error) {
    console.error(`❌ Failed to add field ${fieldName}:`, error);
    return false;
  }
};

export const generatePDF = async (doc, userFieldData = null, userId = null) => {
  try {
    if (!doc.pages || doc.pages.length === 0) {
      throw new Error("No pages to download");
    }

    let pdfDoc;

    if (doc.arrayBufferBase64 && !doc.isBlankDocument) {
      const arrayBuffer = base64ToArrayBuffer(doc.arrayBufferBase64);
      pdfDoc = await PDFDocument.load(arrayBuffer, {
        updateMetadata: false,
        ignoreEncryption: true,
      });
      console.log("Loaded original PDF");
    } else {
      pdfDoc = await PDFDocument.create();
      for (let i = 0; i < doc.pages.length; i++) {
        pdfDoc.addPage([PDF_A4_WIDTH, PDF_A4_HEIGHT]);
      }
      console.log("Created blank PDF");
    }

    const form = pdfDoc.getForm();
    const pages = pdfDoc.getPages();

    let totalFieldsAdded = 0;

    for (let i = 0; i < pages.length; i++) {
      const pageNum = i + 1;
      const pdfPage = pages[i];

      if (doc.droppedFields && doc.droppedFields[pageNum]) {
        const fields = doc.droppedFields[pageNum];

        for (const field of fields) {
          let fieldData = { ...field };

          if (userId && userFieldData?.[doc.id]?.[userId]?.[field.id]) {
            fieldData.value = userFieldData[doc.id][userId][field.id];
          }

          const success = addFormField(form, pdfPage, fieldData, PDF_A4_HEIGHT);
          if (success) totalFieldsAdded++;
        }
      }
    }

    console.log(`Added ${totalFieldsAdded} form fields to PDF`);

    const pdfBytes = await pdfDoc.save({
      useObjectStreams: false,
      addDefaultPage: false,
      updateFieldAppearances: true,
    });

    return new Blob([pdfBytes], { type: "application/pdf" });
  } catch (error) {
    console.error("Error generating PDF:", error);
    throw error;
  }
};

export const downloadPDF = async (doc, userFieldData, userId) => {
  try {
    console.log("Downloading PDF:", doc.documentName);

    const fieldCount = Object.values(doc.droppedFields || {}).flat().length;

    if (fieldCount === 0) {
      alert("This document has no form fields to export.");
      return;
    }

    const blob = await generatePDF(doc, userFieldData, userId);
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;

    const filename = userId
      ? `${doc.documentName}_${userId}.pdf`
      : `${doc.documentName.replace(/\s+/g, "_")}.pdf`;

    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setTimeout(() => URL.revokeObjectURL(url), 100);

    console.log("✅ PDF downloaded with", fieldCount, "editable fields");
  } catch (error) {
    console.error("Download error:", error);
    alert(`Failed to download PDF: ${error.message}`);
  }
};
