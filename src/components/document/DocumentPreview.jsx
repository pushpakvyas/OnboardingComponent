import React from "react";
import { ChevronLeft } from "lucide-react";
import { A4_WIDTH, A4_HEIGHT } from "../../constants/layoutConstants";

export const DocumentPreview = ({ document, onBack }) => {
  const { pages, droppedFields } = document;

  return (
    <div className="flex-1 flex flex-col">
      <div className="bg-white border-b px-6 py-3 flex items-center justify-between">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
        >
          <ChevronLeft className="w-5 h-5" />
          Back to Documents
        </button>
        <h2 className="text-xl font-semibold">{document.documentName}</h2>
        <div className="w-32"></div>
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
                {(droppedFields[page.number] || []).map((field) => (
                  <div
                    key={field.id}
                    className="absolute bg-transparent rounded p-2"
                    style={{ left: field.x, top: field.y }}
                  >
                    {field.showLabel !== false &&
                      field.labelPosition === "top" && (
                        <div className="text-xs font-semibold mb-1">
                          {field.label}
                          {field.required && (
                            <span className="text-red-500 ml-0.5">*</span>
                          )}
                        </div>
                      )}
                    {field.type === "checkbox" && (
                      <input type="checkbox" className="w-4 h-4" readOnly />
                    )}
                    {(field.type === "text" ||
                      field.type === "name" ||
                      field.type === "email" ||
                      field.type === "phone") && (
                      <input
                        type="text"
                        className="border rounded px-2 py-1 text-sm"
                        style={{ width: field.width || 200 }}
                        readOnly
                      />
                    )}
                    {field.type === "date" && (
                      <input
                        type="date"
                        className="border rounded px-2 py-1 text-sm"
                        style={{ width: field.width || 200 }}
                        readOnly
                      />
                    )}
                    {field.type === "select" && (
                      <select
                        className="border rounded px-2 py-1 text-sm"
                        style={{ width: field.width || 200 }}
                      >
                        {(field.options || []).map((opt, i) => (
                          <option key={i}>{opt}</option>
                        ))}
                      </select>
                    )}
                    {field.type === "signature" && (
                      <input
                        type="text"
                        className="border rounded px-2 py-1 text-sm"
                        style={{
                          width: field.width || 200,
                          fontFamily: "cursive",
                        }}
                        readOnly
                      />
                    )}
                    {field.type === "image" && (
                      <div
                        className="border rounded p-2 text-xs"
                        style={{
                          width: field.width || 150,
                          height: field.height || 100,
                        }}
                      >
                        {field.imageSrc ? (
                          <img
                            src={field.imageSrc}
                            alt={field.alt}
                            className="w-full h-full object-contain"
                          />
                        ) : (
                          "No image"
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
