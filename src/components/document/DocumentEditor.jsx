import React from "react";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { AnimatePresence } from "framer-motion";
import { useDocumentEditor } from "../../hooks/useDocumentEditor";
import { DocumentFieldsSidebar } from "./DocumentFieldsSidebar";
import { DocumentFieldConfig } from "./DocumentFieldConfig";
import { DraggableField } from "../fields/Draggablefield";
import { CanvasPageRenderer } from "./CanvasPageRenderer";
import { A4_WIDTH, A4_HEIGHT } from "../../constants/layoutConstants";
import { pdfBufferStore } from "../../utils/pdfProcessor";

export const DocumentEditor = ({ document, onSave, onBack }) => {
  const {
    pages,
    currentPageNum,
    setCurrentPageNum,
    droppedFields,
    selectedField,
    setSelectedField,
    draggedFieldType,
    setDraggedFieldType,
    previewRef,
    addField,
    deleteField,
    updateFieldAttribute,
    updateFieldPosition,
    addBlankPage,
  } = useDocumentEditor(document.pages, document.droppedFields);

  // Get PDF buffer from in-memory store
  const pdfBuffer = pdfBufferStore.get(document.id);

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (!draggedFieldType || !currentPageNum) return;

    const rect = previewRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(e.clientX - rect.left - 75, A4_WIDTH - 150));
    const y = Math.max(0, Math.min(e.clientY - rect.top - 18, A4_HEIGHT - 36));

    addField(draggedFieldType, x, y);
    setDraggedFieldType(null);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleSave = () => {
    const hasFields = Object.values(droppedFields).some(
      (fields) => fields.length > 0
    );

    if (hasFields) {
      onSave({
        ...document,
        pages,
        droppedFields,
      });
    } else {
      alert("Please add at least one field before saving.");
    }
  };

  const selectedFieldData = selectedField
    ? droppedFields[currentPageNum]?.find((f) => f.id === selectedField)
    : null;

  return (
    <div className="flex h-screen bg-gray-100">
      <DocumentFieldsSidebar onDragStart={setDraggedFieldType} />

      <div className="flex-1 flex flex-col">
        <div className="bg-white border-b px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={onBack}
              className="p-2 hover:bg-gray-100 rounded-lg"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <div>
              <h2 className="text-xl font-semibold">
                {document.documentName || "Untitled Document"}
              </h2>
              <p className="text-sm text-gray-500">Design Document</p>
            </div>
          </div>
          <div className="flex gap-3">
            <button
              onClick={addBlankPage}
              className="px-4 py-2 border rounded-lg hover:bg-gray-50 flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Add Page
            </button>
            <button
              onClick={handleSave}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Save & Share
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-auto p-8 flex justify-center">
          <div className="max-w-4xl">
            <div className="flex items-center justify-between mb-4">
              <button
                onClick={() =>
                  setCurrentPageNum(Math.max(1, currentPageNum - 1))
                }
                disabled={currentPageNum === 1}
                className="p-2 rounded-lg hover:bg-white disabled:opacity-50"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <span className="text-sm font-medium">
                Page {currentPageNum} of {pages.length}
              </span>
              <button
                onClick={() =>
                  setCurrentPageNum(Math.min(pages.length, currentPageNum + 1))
                }
                disabled={currentPageNum === pages.length}
                className="p-2 rounded-lg hover:bg-white disabled:opacity-50"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>

            <div
              ref={previewRef}
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              className="relative bg-white shadow-lg"
              style={{
                width: `${A4_WIDTH}px`,
                height: `${A4_HEIGHT}px`,
                position: "relative",
              }}
            >
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  zIndex: 0,
                  pointerEvents: "none",
                }}
              >
                <CanvasPageRenderer
                  arrayBuffer={pdfBuffer}
                  pageNumber={currentPageNum}
                  width={A4_WIDTH}
                  height={A4_HEIGHT}
                  isBlankDocument={document.isBlankDocument}
                />
              </div>

              <div style={{ position: "absolute", inset: 0, zIndex: 10 }}>
                <AnimatePresence>
                  {(droppedFields[currentPageNum] || []).map((field) => (
                    <DraggableField
                      key={field.id}
                      field={field}
                      isSelected={selectedField === field.id}
                      onSelect={() => setSelectedField(field.id)}
                      onUpdatePosition={updateFieldPosition}
                      onDelete={deleteField}
                    />
                  ))}
                </AnimatePresence>
              </div>
            </div>
          </div>
        </div>
      </div>

      <DocumentFieldConfig
        field={selectedFieldData}
        onUpdate={updateFieldAttribute}
        onClose={() => setSelectedField(null)}
      />
    </div>
  );
};
