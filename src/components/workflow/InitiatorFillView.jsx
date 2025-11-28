import React, { useState } from "react";
import { Save, ChevronLeft, ChevronRight, AlertCircle } from "lucide-react";
import { FieldRenderer } from "../fields/FieldRenderer";
import { CanvasPageRenderer } from "../document/CanvasPageRenderer";
import { A4_WIDTH, A4_HEIGHT } from "../../constants/layoutConstants";
import { pdfBufferStore } from "../../utils/pdfBufferStore";

export const InitiatorFillView = ({
  document,
  userId,
  userFieldData = {},
  onUpdateField,
  onSave,
  onBack,
}) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [validationErrors, setValidationErrors] = useState([]);

  // Get PDF buffer from in-memory store
  const pdfBuffer = pdfBufferStore.get(document.id);

  // Get all initiator fields across all pages
  const getAllInitiatorFields = () => {
    const allFields = [];
    if (!document.droppedFields) return allFields;

    Object.keys(document.droppedFields).forEach((pageNum) => {
      const pageFields =
        document.droppedFields[pageNum]?.filter(
          (f) => f.role === "initiator"
        ) || [];
      allFields.push(...pageFields);
    });

    return allFields;
  };

  // Validate all required initiator fields
  const validateFields = () => {
    const errors = [];
    const allInitiatorFields = getAllInitiatorFields();

    allInitiatorFields.forEach((field) => {
      if (field.required) {
        const value = userFieldData?.[field.id];
        if (!value || String(value).trim() === "") {
          errors.push({
            fieldId: field.id,
            label: field.label || "Unnamed Field",
            page: field.page,
          });
        }
      }
    });

    return errors;
  };

  const handleSave = () => {
    const errors = validateFields();
    if (errors.length > 0) {
      setValidationErrors(errors);
      alert(
        "Please fill all required initiator fields:\n" +
          errors
            .slice(0, 5)
            .map((e) => `${e.label} (Page ${e.page})`)
            .join("\n")
      );

      // Navigate to first error page
      if (errors[0]?.page) {
        setCurrentPage(errors[0].page);
      }
      return;
    }

    setValidationErrors([]);
    onSave();
  };

  // Fields for the current page with role "initiator"
  const initiatorFields =
    document.droppedFields?.[currentPage]?.filter(
      (f) => f.role === "initiator"
    ) || [];

  return (
    <div className="flex h-screen bg-gray-100">
      <div className="flex-1 flex flex-col">
        {/* Header */}
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
              <p className="text-sm text-gray-500">
                Initiator - Fill Form ({userId})
              </p>
            </div>
          </div>

          <button
            onClick={handleSave}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
          >
            <Save className="w-4 h-4" />
            Save & Submit
          </button>
        </div>

        {/* Validation banner */}
        {validationErrors.length > 0 && (
          <div className="bg-red-50 border-b border-red-200 px-6 py-3 flex items-start gap-2">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-medium text-red-800">
                Please fill all required fields
              </p>
              <ul className="mt-1 text-xs text-red-700">
                {validationErrors.slice(0, 3).map((error, idx) => (
                  <li key={idx}>
                    {error.label} - Page {error.page}
                  </li>
                ))}
                {validationErrors.length > 3 && (
                  <li>... and {validationErrors.length - 3} more</li>
                )}
              </ul>
            </div>
          </div>
        )}

        {/* Main content */}
        <div className="flex-1 overflow-auto p-8 flex justify-center">
          <div className="max-w-4xl w-full">
            {/* Page navigation */}
            <div className="flex items-center justify-between mb-4">
              <button
                onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="p-2 rounded-lg hover:bg-white disabled:opacity-50"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <span className="text-sm font-medium">
                Page {currentPage} of {document.pages?.length || 0 || 1}
              </span>
              <button
                onClick={() =>
                  setCurrentPage((prev) =>
                    Math.min(document.pages?.length || 1, prev + 1)
                  )
                }
                disabled={currentPage === (document.pages?.length || 1)}
                className="p-2 rounded-lg hover:bg-white disabled:opacity-50"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>

            {/* PDF + Fields */}
            <div
              className="relative bg-white shadow-lg"
              style={{ width: `${A4_WIDTH}px`, height: `${A4_HEIGHT}px` }}
            >
              {/* PDF Background */}
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
                  pageNumber={currentPage}
                  width={A4_WIDTH}
                  height={A4_HEIGHT}
                  isBlankDocument={document.isBlankDocument}
                />
              </div>

              {/* Fields Layer */}
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  zIndex: 10,
                }}
              >
                {initiatorFields.map((field) => {
                  const hasError = validationErrors.some(
                    (e) => e.fieldId === field.id
                  );
                  return (
                    <div
                      key={field.id}
                      className={hasError ? "ring-2 ring-red-500 rounded" : ""}
                    >
                      <FieldRenderer
                        field={field}
                        value={userFieldData?.[field.id]}
                        onChange={(val) => {
                          onUpdateField(field.id, val);
                          setValidationErrors((prev) =>
                            prev.filter((e) => e.fieldId !== field.id)
                          );
                        }}
                        readOnly={false}
                        role="initiator"
                      />
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
