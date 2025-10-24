import React from "react";
import { ChevronLeft } from "lucide-react";
import { FieldRenderer } from "../fields/FieldRenderer";
import { A4_WIDTH, A4_HEIGHT } from "../../constants/layoutConstants";

export const ApplicantFillView = ({
  document,
  userId,
  userFieldData,
  onUpdateFieldValue,
  onSave,
  onBack,
}) => {
  const { pages, droppedFields } = document;

  const handleSave = () => {
    const missingFields = [];
    Object.values(droppedFields || {})
      .flat()
      .filter((f) => f.role === "applicant" && f.required)
      .forEach((field) => {
        const value = userFieldData[document.id]?.[userId]?.[field.id];
        if (!value || !value.toString().trim()) {
          missingFields.push(field.label || "Unnamed Field");
        }
      });

    if (missingFields.length > 0) {
      alert(
        `Please fill all required applicant fields:\n- ${missingFields.join(
          "\n- "
        )}`
      );
      return;
    }

    onSave();
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
          <p className="text-sm text-gray-600">Filling as: {userId}</p>
        </div>
        <button
          onClick={handleSave}
          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
        >
          Save & Submit
        </button>
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
                  const isEditable = fieldRole === "applicant";
                  const fieldValue =
                    userFieldData[document.id]?.[userId]?.[field.id] || "";

                  return (
                    <FieldRenderer
                      key={field.id}
                      field={field}
                      value={fieldValue}
                      onChange={(value) => onUpdateFieldValue(field.id, value)}
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
  );
};
