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
  initiatorData = {},
  applicantData = {},
  onUpdateField,
  onApprove,
  onReject,
  onBack,
}) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [remarks, setRemarks] = useState("");
  const [validationErrors, setValidationErrors] = useState([]);
  const [isDownloading, setIsDownloading] = useState(false);

  const pdfBuffer = pdfBufferStore.get(document.id);

  // Approver editable fields on current page
  const approverFields =
    (document.droppedFields?.[currentPage] || []).filter(
      (f) => f.role === "approver"
    ) || [];

  // Initiator read-only fields on current page
  const initiatorFields =
    (document.droppedFields?.[currentPage] || []).filter(
      (f) => f.role === "initiator"
    ) || [];

  // Applicant read-only fields on current page
  const applicantFields =
    (document.droppedFields?.[currentPage] || []).filter(
      (f) => f.role === "applicant"
    ) || [];
  console.log("applicantFields", applicantFields);

  const validateFields = () => {
    const errors = [];
    approverFields.forEach((field) => {
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
        "Please fill all required approver fields before saving:\n" +
          errors
            .slice(0, 5)
            .map((e) => `${e.label} (Page ${e.page})`)
            .join("\n")
      );
      if (errors[0]?.page) {
        setCurrentPage(errors[0].page);
      }
      return false;
    }
    setValidationErrors([]);
    return true;
  };

  const handleDownload = async () => {
    setIsDownloading(true);
    try {
      await downloadPDF(
        document,
        { ...initiatorData, ...applicantData, ...userFieldData },
        selectedApplicant
      );
    } finally {
      setIsDownloading(false);
    }
  };

  const handleApprove = () => {
    if (remarks.trim() === "") {
      alert("Please add remarks before approving");
      return;
    }
    onUpdateField("_approver_remarks", remarks, selectedApplicant);
    if (handleSave()) {
      onApprove(selectedApplicant);
    }
  };

  const handleReject = () => {
    if (remarks.trim() === "") {
      alert("Please add rejection reason");
      return;
    }
    onUpdateField("_approver_remarks", remarks, selectedApplicant);
    onReject(selectedApplicant);
  };

  return (
    <div className="flex h-screen bg-gray-100">
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="bg-white border-b px-6 py-4 flex items-center justify-between mb-4">
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
        <div className="flex items-center gap-3 px-6 mb-4">
          <label className="text-sm font-medium" htmlFor="applicant-select">
            Reviewing Applicant:
          </label>
          <select
            id="applicant-select"
            value={selectedApplicant}
            onChange={(e) => {
              onSelectApplicant(e.target.value);
              setRemarks("");
              setValidationErrors([]);
            }}
            className="px-3 py-2 border rounded-lg"
          >
            {applicants.map((app) => (
              <option key={app} value={app}>
                {app}
              </option>
            ))}
          </select>
        </div>

        {/* Content */}
        <div className="flex-1 flex overflow-hidden">
          <div className="flex-1 overflow-auto p-8 flex flex-col items-center">
            <div className="max-w-4xl w-full">
              {/* Page navigation */}
              <div className="flex items-center justify-between mb-4">
                <button
                  onClick={() =>
                    setCurrentPage((prev) => Math.max(1, prev - 1))
                  }
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

              {/* PDF and fields layer */}
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

                {/* Initiator fields (read-only) */}
                <div
                  style={{
                    position: "absolute",
                    inset: 0,
                    zIndex: 10,
                    pointerEvents: "none",
                    opacity: 0.7,
                  }}
                >
                  {initiatorFields.map((field) => (
                    <FieldRenderer
                      key={field.id}
                      field={field}
                      value={initiatorData?.[field.id] || ""}
                      readOnly={true}
                      onChange={() => {}}
                      role="initiator"
                    />
                  ))}
                </div>

                {/* Applicant fields (read-only) */}
                <div
                  style={{
                    position: "absolute",
                    inset: 0,
                    zIndex: 15,
                    pointerEvents: "none",
                    opacity: 0.85,
                  }}
                >
                  {applicantFields.map((field) => (
                    <FieldRenderer
                      key={field.id}
                      field={field}
                      value={applicantData?.[field.id] || ""}
                      readOnly={true}
                      onChange={() => {}}
                      role="applicant"
                    />
                  ))}
                </div>

                <div className="flex flex-1">
                  <div
                    style={{
                      position: "absolute",
                      inset: 0,
                      zIndex: 20,
                    }}
                  >
                    {approverFields.map((field) => {
                      const hasError = validationErrors.some(
                        (e) => e.fieldId === field.id
                      );
                      return (
                        <div
                          key={field.id}
                          className={
                            hasError ? "ring-2 ring-red-500 rounded" : ""
                          }
                        >
                          <FieldRenderer
                            field={field}
                            value={userFieldData?.[field.id] || ""}
                            onChange={(val) => {
                              onUpdateField(field.id, val);
                              setValidationErrors((prev) =>
                                prev.filter((e) => e.fieldId !== field.id)
                              );
                            }}
                            readOnly={false}
                            role="approver"
                          />
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="w-80 bg-white border-l p-4 flex flex-col gap-4">
            <h3 className="font-semibold text-gray-900 mb-2">Remarks</h3>
            <textarea
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              placeholder="Add approval remarks or rejection reason..."
              className="w-full h-40 px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 resize-none"
            />
          </div>
        </div>
      </div>
    </div>
  );
};
