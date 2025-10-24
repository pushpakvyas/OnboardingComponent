import React from "react";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { AnimatePresence } from "framer-motion";
import { useDocumentEditor } from "../../hooks/useDocumentEditor";
import { DocumentFieldsSidebar } from "./DocumentFieldsSidebar";
import { DocumentFieldConfig } from "./DocumentFieldConfig";
import { DraggableField } from "../fields/Draggablefield";
import { A4_WIDTH, A4_HEIGHT } from "../../constants/layoutConstants";

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

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (!draggedFieldType || !currentPageNum) return;

    const rect = previewRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(e.clientX - rect.left, A4_WIDTH));
    const y = Math.max(0, Math.min(e.clientY - rect.top, A4_HEIGHT));

    addField(draggedFieldType, x, y);
    setDraggedFieldType(null);
  };

  const handleSave = () => {
    onSave({ ...document, pages, droppedFields });
  };

  return (
    <div className="flex-1 flex overflow-hidden">
      <DocumentFieldsSidebar
        onDragStart={setDraggedFieldType}
        onDragEnd={() => setDraggedFieldType(null)}
      />

      <div className="flex-1 flex flex-col">
        <div className="bg-gray-200 border-b px-4 py-2 flex items-center justify-between">
          <button
            onClick={() => {
              if (window.confirm("Save changes before leaving?")) {
                handleSave();
                onBack();
              } else {
                onBack();
              }
            }}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
          >
            <ChevronLeft className="w-5 h-5" />
            Back
          </button>

          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">
              Page {currentPageNum} of {pages.length}
            </span>
            <button
              onClick={() => setCurrentPageNum((prev) => Math.max(1, prev - 1))}
              disabled={currentPageNum === 1}
              className="p-1 rounded hover:bg-gray-300 disabled:opacity-30"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() =>
                setCurrentPageNum((prev) => Math.min(pages.length, prev + 1))
              }
              disabled={currentPageNum === pages.length}
              className="p-1 rounded hover:bg-gray-300 disabled:opacity-30"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={addBlankPage}
              className="flex items-center gap-1 px-3 py-1 bg-white border rounded hover:bg-gray-100 text-sm"
            >
              <Plus className="w-4 h-4" />
              Add Page
            </button>
            <button
              onClick={handleSave}
              className="px-4 py-1 bg-green-600 text-white rounded hover:bg-green-700 text-sm"
            >
              Save Document
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-auto bg-gray-100 p-6 flex justify-center items-start">
          {pages[currentPageNum - 1] && (
            <div
              ref={previewRef}
              className="relative bg-white shadow-lg"
              style={{
                width: A4_WIDTH,
                height: A4_HEIGHT,
                minWidth: A4_WIDTH,
                minHeight: A4_HEIGHT,
              }}
              onDrop={handleDrop}
              onDragOver={(e) => e.preventDefault()}
              onClick={(e) => {
                if (e.target === e.currentTarget) {
                  setSelectedField(null);
                }
              }}
            >
              <img
                src={pages[currentPageNum - 1].image}
                alt={`Page ${currentPageNum}`}
                style={{
                  width: A4_WIDTH,
                  height: A4_HEIGHT,
                  display: "block",
                }}
                draggable={false}
              />
              <AnimatePresence>
                {(droppedFields[currentPageNum] || []).map((field) => (
                  <DraggableField
                    key={field.id}
                    field={field}
                    isSelected={selectedField === field.id}
                    onSelect={setSelectedField}
                    onDelete={deleteField}
                    onUpdatePosition={updateFieldPosition}
                  />
                ))}
              </AnimatePresence>
            </div>
          )}
        </div>
      </div>

      {selectedField && (
        <DocumentFieldConfig
          field={(droppedFields[currentPageNum] || []).find(
            (f) => f.id === selectedField
          )}
          onUpdate={updateFieldAttribute}
          onClose={() => setSelectedField(null)}
        />
      )}
    </div>
  );
};
