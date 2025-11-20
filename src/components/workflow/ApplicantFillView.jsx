import React, { useState } from "react";
import { Save, ChevronLeft, ChevronRight } from "lucide-react";
import { FieldRenderer } from "../fields/FieldRenderer";
import { CanvasPageRenderer } from "../document/CanvasPageRenderer";
import { A4_WIDTH, A4_HEIGHT } from "../../constants/layoutConstants";

export const ApplicantFillView = ({
  document,
  userId,
  userFieldData = {},
  onUpdateField,
  onSave,
  onBack,
}) => {
  const [currentPage, setCurrentPage] = useState(1);

  const applicantFields = Object.entries(document.droppedFields || {})
    .flatMap(([pageNum, fields]) =>
      fields
        .filter((f) => f.toBeFilledBy === "applicant")
        .map((f) => ({ ...f, page: parseInt(pageNum) }))
    )
    .filter((f) => f.page === currentPage);

  return (
    <div className="flex h-screen bg-gray-100">
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
              <h2 className="text-xl font-semibold">{document.documentName}</h2>
              <p className="text-sm text-gray-500">Fill Form Fields</p>
            </div>
          </div>
          <button
            onClick={onSave}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
          >
            <Save className="w-4 h-4" />
            Save & Submit
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
                Page {currentPage} of {document.pages.length}
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
              className="relative bg-white shadow-lg"
              style={{ width: `${A4_WIDTH}px`, height: `${A4_HEIGHT}px` }}
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
                  pdfData={document.arrayBuffer}
                  pageNumber={currentPage}
                  width={A4_WIDTH}
                  height={A4_HEIGHT}
                  isBlankDocument={document.isBlankDocument}
                />
              </div>

              <div style={{ position: "absolute", inset: 0, zIndex: 10 }}>
                {applicantFields.map((field) => (
                  <FieldRenderer
                    key={field.id}
                    field={field}
                    value={userFieldData[field.id] || field.value || ""}
                    onChange={(value) => onUpdateField(field.id, value)}
                    disabled={false}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
