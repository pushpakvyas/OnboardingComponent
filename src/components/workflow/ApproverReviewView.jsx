import React, { useState } from "react";
import { ChevronLeft, ChevronRight, Check, X } from "lucide-react";
import { FieldRenderer } from "../fields/FieldRenderer";
import { CanvasPageRenderer } from "../document/CanvasPageRenderer";
import { A4_WIDTH, A4_HEIGHT } from "../../constants/layoutConstants";
import { pdfBufferStore } from "../../utils/pdfProcessor";

export const ApproverReviewView = ({
  document,
  approverId,
  selectedApplicant,
  onSelectApplicant,
  applicants = [],
  userFieldData = {},
  onUpdateField,
  onApprove,
  onReject,
  onBack,
}) => {
  const [currentPage, setCurrentPage] = useState(1);

  // Get PDF buffer from in-memory store
  const pdfBuffer = pdfBufferStore.get(document.id);

  // Filter fields for current page
  const applicantFields = (document.droppedFields?.[currentPage] || []).filter(
    (f) => f.role === "applicant"
  );

  const approverFields = (document.droppedFields?.[currentPage] || []).filter(
    (f) => f.role === "approver"
  );

  return (
    <div className="flex h-screen bg-gray-100">
      <div className="flex-1 flex flex-col">
        <div className="bg-white border-b px-6 py-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              <button
                onClick={onBack}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <div>
                <h2 className="text-xl font-semibold">
                  {document.documentName}
                </h2>
                <p className="text-sm text-gray-500">Approver - Review</p>
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => onReject(selectedApplicant)}
                className="px-4 py-2 border border-red-500 text-red-600 rounded-lg hover:bg-red-50 flex items-center gap-2"
              >
                <X className="w-4 h-4" />
                Reject
              </button>
              <button
                onClick={() => onApprove(selectedApplicant)}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2"
              >
                <Check className="w-4 h-4" />
                Approve
              </button>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <label className="text-sm font-medium">Reviewing:</label>
            <select
              value={selectedApplicant}
              onChange={(e) => onSelectApplicant(e.target.value)}
              className="px-3 py-2 border rounded-lg"
            >
              {applicants.map((applicant) => (
                <option key={applicant} value={applicant}>
                  {applicant}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex-1 overflow-auto p-8 flex justify-center">
          <div className="max-w-4xl w-full">
            <div className="flex items-center justify-between mb-4">
              <button
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="p-2 rounded-lg hover:bg-white disabled:opacity-50"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <span className="text-sm font-medium">
                Page {currentPage} of {document.pages?.length || 1}
              </span>
              <button
                onClick={() =>
                  setCurrentPage(
                    Math.min(document.pages?.length || 1, currentPage + 1)
                  )
                }
                disabled={currentPage === (document.pages?.length || 1)}
                className="p-2 rounded-lg hover:bg-white disabled:opacity-50"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>

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
              <div style={{ position: "absolute", inset: 0, zIndex: 10 }}>
                {/* Applicant Fields - Read Only */}
                {applicantFields.map((field) => (
                  <FieldRenderer
                    key={field.id}
                    field={field}
                    value={userFieldData?.[field.id] || ""}
                    onChange={() => {}}
                    readOnly={true}
                    role="applicant"
                  />
                ))}

                {/* Approver Fields - Editable */}
                {approverFields.map((field) => (
                  <FieldRenderer
                    key={field.id}
                    field={field}
                    value={userFieldData?.[field.id] || ""}
                    onChange={(val) =>
                      onUpdateField(field.id, val, selectedApplicant)
                    }
                    readOnly={false}
                    role="approver"
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
