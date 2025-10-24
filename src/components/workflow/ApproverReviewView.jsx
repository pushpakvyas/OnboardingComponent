import React, { useState } from "react";
import { ChevronLeft, CheckCircle, XCircle } from "lucide-react";
import { FieldRenderer } from "../fields/FieldRenderer";
import { A4_WIDTH, A4_HEIGHT } from "../../constants/layoutConstants";

export const ApproverReviewView = ({
  document,
  approverId,
  applicants,
  userFieldData,
  onUpdateFieldValue,
  onDecision,
  onBack,
}) => {
  const [selectedApplicant, setSelectedApplicant] = useState(
    applicants[0] || ""
  );
  const { pages, droppedFields } = document;

  const handleDecision = (decision) => {
    const missingFields = [];
    Object.values(droppedFields || {})
      .flat()
      .filter((f) => f.role === "approver" && f.required)
      .forEach((field) => {
        const value =
          userFieldData[document.id]?.[selectedApplicant]?.[field.id];
        if (!value || !value.toString().trim()) {
          missingFields.push(field.label || "Unnamed Field");
        }
      });

    if (missingFields.length > 0) {
      alert(
        `Please fill all required approver fields before ${decision}:\n- ${missingFields.join(
          "\n- "
        )}`
      );
      return;
    }

    onDecision(decision, selectedApplicant);
  };

  return (
    <div className="flex-1 flex flex-col">
      <div className="bg-white border-b px-6 py-3 flex items-center justify-between">
        <button
          onClick={() => {
            if (window.confirm("Exit without saving?")) {
              onBack();
            }
          }}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
        >
          <ChevronLeft className="w-5 h-5" />
          Back
        </button>
        <div className="text-center">
          <h2 className="text-xl font-semibold">{document.documentName}</h2>
          <p className="text-sm text-gray-600">
            Approver: {approverId} | Reviewing: {selectedApplicant}
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => handleDecision("approved")}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
          >
            <CheckCircle className="w-4 h-4" />
            Approve
          </button>
          <button
            onClick={() => handleDecision("rejected")}
            className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
          >
            <XCircle className="w-4 h-4" />
            Reject
          </button>
        </div>
      </div>
      <div className="flex-1 flex">
        <div className="w-64 bg-white border-r p-4 overflow-y-auto">
          <h3 className="font-semibold text-gray-900 mb-4">Applicants</h3>
          <div className="space-y-2">
            {applicants.map((userId) => (
              <button
                key={userId}
                className={`w-full text-left px-3 py-2 rounded text-sm ${
                  selectedApplicant === userId
                    ? "bg-blue-100 text-blue-700 font-semibold"
                    : "bg-gray-50 hover:bg-gray-100"
                }`}
                onClick={() => setSelectedApplicant(userId)}
              >
                {userId}
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 flex justify-center overflow-auto bg-gray-100 p-6">
          <div className="flex flex-col justify-center items-start space-y-6">
            {pages.map((page) => (
              <div
                key={page.number}
                className="bg-white shadow-lg"
                style={{ width: A4_WIDTH, height: A4_HEIGHT }}
              >
                <div
                  className="relative"
                  style={{ width: A4_WIDTH, height: A4_HEIGHT }}
                >
                  <img
                    src={page.image}
                    alt={`Page ${page.number}`}
                    className="w-full h-full"
                  />
                  {(droppedFields[page.number] || []).map((field) => {
                    const fieldRole = field.role || "applicant";
                    const isEditable = fieldRole === "approver";
                    const fieldValue =
                      userFieldData[document.id]?.[selectedApplicant]?.[
                        field.id
                      ] || "";

                    return (
                      <FieldRenderer
                        key={field.id}
                        field={field}
                        value={fieldValue}
                        onChange={(value) =>
                          onUpdateFieldValue(field.id, value, selectedApplicant)
                        }
                        readOnly={!isEditable}
                        mode="fill"
                      />
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
