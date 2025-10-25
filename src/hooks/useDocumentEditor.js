import { useState, useRef } from "react";
import { A4_WIDTH, A4_HEIGHT } from "../constants/layoutConstants";
import { FIELD_DEFAULTS } from "../constants/fieldConstants";

export const useDocumentEditor = (initialPages = [], initialFields = {}) => {
  const [pages, setPages] = useState(initialPages);
  const [currentPageNum, setCurrentPageNum] = useState(1);
  const [droppedFields, setDroppedFields] = useState(initialFields);
  const [selectedField, setSelectedField] = useState(null);
  const [draggedFieldType, setDraggedFieldType] = useState(null);
  const [isDraggingExistingField, setIsDraggingExistingField] = useState(false);
  const [draggedExistingField, setDraggedExistingField] = useState(null);

  const previewRef = useRef(null);

  const addField = (fieldType, x, y) => {
    const newField = {
      id: `${fieldType.type}-${Date.now()}`,
      type: fieldType.type,
      label: fieldType.label,
      icon: fieldType.icon,
      x,
      y,
      page: currentPageNum,
      value: "",
      ...FIELD_DEFAULTS,
      ...(fieldType.type === "select" && {
        options: ["Option 1", "Option 2"],
        defaultOptionIndex: 0,
      }),
      ...(fieldType.type === "image" && {
        imageSrc: null,
        alt: "",
        height: 100,
      }),
    };

    setDroppedFields((prev) => ({
      ...prev,
      [currentPageNum]: [...(prev[currentPageNum] || []), newField],
    }));

    setTimeout(() => setSelectedField(newField.id), 50);
    return newField;
  };

  const deleteField = (fieldId) => {
    setDroppedFields((prev) => ({
      ...prev,
      [currentPageNum]: prev[currentPageNum].filter((f) => f.id !== fieldId),
    }));
    setSelectedField(null);
  };

  const updateFieldAttribute = (fieldId, attr, value) => {
    setDroppedFields((prev) => ({
      ...prev,
      [currentPageNum]: (prev[currentPageNum] || []).map((f) =>
        f.id === fieldId ? { ...f, [attr]: value } : f
      ),
    }));
  };

  const updateFieldPosition = (fieldId, x, y) => {
    setDroppedFields((prev) => ({
      ...prev,
      [currentPageNum]: prev[currentPageNum].map((f) =>
        f.id === fieldId ? { ...f, x, y } : f
      ),
    }));
  };

  const addBlankPage = () => {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    canvas.width = A4_WIDTH;
    canvas.height = A4_HEIGHT;
    ctx.fillStyle = "white";
    ctx.fillRect(0, 0, A4_WIDTH, A4_HEIGHT);

    const newPage = {
      number: pages.length + 1,
      image: canvas.toDataURL(),
      width: A4_WIDTH,
      height: A4_HEIGHT,
    };

    setPages((prev) => [...prev, newPage]);
  };

  const calculateMaxChars = (width, fontSize) => {
    const charWidthRatio = 0.6;
    const padding = 12;
    return Math.floor((width + padding) / (fontSize * charWidthRatio));
  };

  return {
    pages,
    setPages,
    currentPageNum,
    setCurrentPageNum,
    droppedFields,
    setDroppedFields,
    selectedField,
    setSelectedField,
    draggedFieldType,
    setDraggedFieldType,
    isDraggingExistingField,
    setIsDraggingExistingField,
    draggedExistingField,
    setDraggedExistingField,
    previewRef,
    addField,
    deleteField,
    updateFieldAttribute,
    updateFieldPosition,
    addBlankPage,
    calculateMaxChars,
  };
};
