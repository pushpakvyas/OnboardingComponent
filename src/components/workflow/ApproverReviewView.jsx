import React, { useState } from "react";
import { ChevronLeft, ChevronRight, Check, X, Download } from "lucide-react";
import { FieldRenderer } from "../fields/FieldRenderer";
import { CanvasPageRenderer } from "../document/CanvasPageRenderer";
import { downloadPDF } from "../../utils/pdfGenerator";
import { pdfBufferStore } from "../../utils/pdfBufferStore";

const A4_WIDTH = 816;
const A4_HEIGHT = 1056;

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
  const [remarks, setRemarks] = useState("");
  const [isDownloading, setIsDownloading] = useState(false);

  // const { pdfBufferStore } = require("../../utils/pdfProcessor");
  const pdfBuffer = pdfBufferStore.get(document.id);

  // FIXED: Only show APPROVER fields in editable form
  const approverFields = (document.droppedFields?.[currentPage] || []).filter(
    (f) => f.role === "approver"
  );

  // Show all fields (both applicant read-only and approver editable)
  const allFields = document.droppedFields?.[currentPage] || [];

  const handleDownload = async () => {
    setIsDownloading(true);
    try {
      await downloadPDF(document, userFieldData, selectedApplicant);
    } finally {
      setIsDownloading(false);
    }
  };

  const handleApprove = () => {
    if (remarks.trim() === "") {
      alert("Please add remarks before approving");
      return;
    }
    // Store remarks
    onUpdateField("_approver_remarks", remarks, selectedApplicant);
    onApprove(selectedApplicant);
  };

  const handleReject = () => {
    if (remarks.trim() === "") {
      alert("Please add rejection reason");
      return;
    }
    // Store remarks
    onUpdateField("_approver_remarks", remarks, selectedApplicant);
    onReject(selectedApplicant);
  };

  return (
    <div className="flex h-screen bg-gray-100">
      <div className="flex-1 flex flex-col">
        {/* Header */}
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
                <p className="text-sm text-gray-500">
                  Approver Review - {approverId}
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={handleDownload}
                disabled={isDownloading}
                className="px-4 py-2 border border-blue-500 text-blue-600 rounded-lg hover:bg-blue-50 flex items-center gap-2 disabled:opacity-50"
              >
                <Download className="w-4 h-4" />
                {isDownloading ? "Downloading..." : "Download"}
              </button>
              <button
                onClick={handleReject}
                className="px-4 py-2 border border-red-500 text-red-600 rounded-lg hover:bg-red-50 flex items-center gap-2"
              >
                <X className="w-4 h-4" />
                Reject
              </button>
              <button
                onClick={handleApprove}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2"
              >
                <Check className="w-4 h-4" />
                Approve
              </button>
            </div>
          </div>

          {/* Applicant selector */}
          <div className="flex items-center gap-3">
            <label className="text-sm font-medium">Reviewing:</label>
            <select
              value={selectedApplicant}
              onChange={(e) => {
                onSelectApplicant(e.target.value);
                setRemarks("");
              }}
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

        {/* Main content */}
        <div className="flex-1 flex overflow-hidden">
          {/* Document preview */}
          <div className="flex-1 overflow-auto p-8 flex flex-col items-center">
            <div className="max-w-4xl w-full">
              {/* Page navigation */}
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

              {/* PDF Canvas */}
              <div
                className="relative bg-white shadow-lg mx-auto"
                style={{ width: `${A4_WIDTH}px`, height: `${A4_HEIGHT}px` }}
              >
                <div style={{ position: "absolute", inset: 0, zIndex: 0 }}>
                  <CanvasPageRenderer
                    arrayBuffer={pdfBuffer}
                    pageNumber={currentPage}
                    width={A4_WIDTH}
                    height={A4_HEIGHT}
                    isBlankDocument={document.isBlankDocument}
                  />
                </div>

                {/* Fields - FIXED: Show all fields */}
                <div style={{ position: "absolute", inset: 0, zIndex: 10 }}>
                  {allFields.map((field) => {
                    const isApproverField = field.role === "approver";
                    const isEditable = isApproverField;

                    return (
                      <FieldRenderer
                        key={field.id}
                        field={field}
                        value={userFieldData?.[field.id] || ""}
                        onChange={(val) =>
                          isEditable &&
                          onUpdateField(field.id, val, selectedApplicant)
                        }
                        readOnly={!isEditable}
                        role={isApproverField ? "approver" : "applicant"}
                      />
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* Remarks sidebar */}
          <div className="w-80 bg-white border-l p-4 flex flex-col gap-4">
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">Remarks</h3>
              <textarea
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                placeholder="Add approval remarks or rejection reason..."
                className="w-full h-40 px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 resize-none"
              />
            </div>

            {/* Approver fields list */}
            {approverFields.length > 0 && (
              <div>
                <h4 className="font-semibold text-sm text-gray-700 mb-2">
                  Approver Fields
                </h4>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {approverFields.map((field) => (
                    <div
                      key={field.id}
                      className="p-2 bg-blue-50 border border-blue-200 rounded text-xs"
                    >
                      <p className="font-medium">{field.label}</p>
                      <p className="text-gray-600">
                        {userFieldData?.[field.id] || "(empty)"}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Applicant info */}
            <div className="pt-4 border-t">
              <h4 className="font-semibold text-sm text-gray-700 mb-2">
                Applicant
              </h4>
              <p className="text-sm text-gray-600">{selectedApplicant}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
