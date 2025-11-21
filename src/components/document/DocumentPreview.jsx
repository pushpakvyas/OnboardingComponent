// src/components/document/DocumentPreview.jsx
import React, { useState } from "react";
import { ChevronLeft, ChevronRight, Edit, X } from "lucide-react";
import { CanvasPageRenderer } from "./CanvasPageRenderer";
import { A4_WIDTH, A4_HEIGHT } from "../../constants/layoutConstants";
import { pdfBufferStore } from "../../utils/pdfProcessor";

export const DocumentPreview = ({ document, onBack, onEdit }) => {
  const [currentPage, setCurrentPage] = useState(1);

  // Get PDF buffer from in-memory store
  const pdfBuffer = pdfBufferStore.get(document.id);

  if (!document) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div>No document selected</div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-100">
      <div className="flex-1 flex flex-col">
        <div className="bg-white border-b px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={onBack}
              className="p-2 hover:bg-gray-100 rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>
            <div>
              <h2 className="text-xl font-semibold">{document.documentName}</h2>
              <p className="text-sm text-gray-500">Document Preview</p>
            </div>
          </div>
          <button
            onClick={onEdit}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
          >
            <Edit className="w-4 h-4" />
            Edit Document
          </button>
        </div>

        <div className="flex-1 overflow-auto p-8 flex justify-center">
          <div className="max-w-4xl">
            <div className="flex items-center justify-between mb-4">
              <button
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="p-2 rounded-lg hover:bg-white disabled:opacity-50"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <span className="text-sm font-medium">
                Page {currentPage} of {document.pages?.length || 0}
              </span>
              <button
                onClick={() =>
                  setCurrentPage(
                    Math.min(document.pages.length, currentPage + 1)
                  )
                }
                disabled={currentPage === document.pages.length}
                className="p-2 rounded-lg hover:bg-white disabled:opacity-50"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>

            <div
              className="bg-white shadow-lg"
              style={{ width: `${A4_WIDTH}px`, height: `${A4_HEIGHT}px` }}
            >
              <CanvasPageRenderer
                arrayBuffer={pdfBuffer}
                pageNumber={currentPage}
                width={A4_WIDTH}
                height={A4_HEIGHT}
                isBlankDocument={document.isBlankDocument}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DocumentPreview;
