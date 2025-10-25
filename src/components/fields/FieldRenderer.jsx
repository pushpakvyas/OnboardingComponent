import React from "react";
import { useDocumentEditor } from "../../hooks/useDocumentEditor";

export const FieldRenderer = ({
  field,
  value,
  onChange,
  readOnly = false,
  mode = "fill",
}) => {
  const isEditable = !readOnly && mode === "fill";
  console.log(typeof field.fontSize);

  const baseInputClass = `border rounded px-2 py-1 text-sm ${
    isEditable ? "bg-white" : "bg-gray-100 cursor-not-allowed"
  }`;
  const { calculateMaxChars } = useDocumentEditor();

  const renderLabel = () => {
    if (field.showLabel === false) return null;
    return (
      <div className="text-xs font-semibold mb-1">
        {field.label}
        {field.required && <span className="text-red-500 ml-0.5">*</span>}
      </div>
    );
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const imageUrl = URL.createObjectURL(file);
      onChange?.(imageUrl); // store image URL in form data
    }
  };

  const renderField = () => {
    switch (field.type) {
      case "checkbox":
        return (
          <input
            type="checkbox"
            className="w-4 h-4"
            checked={value === true || value === "true"}
            onChange={(e) => onChange?.(e.target.checked)}
            disabled={!isEditable}
          />
        );

      case "text":
      case "name":
      case "email":
      case "phone":
        return (
          <input
            type="text"
            className={baseInputClass}
            style={{
              width: field.width || 200,
              fontSize: `${field.fontSize}px` || "14px",
              fontFamily: field.fontFamily || "Arial",
              color: field.fontColor || "#000000",
            }}
            value={value || ""}
            onChange={(e) => onChange?.(e.target.value)}
            readOnly={!isEditable}
            placeholder={isEditable ? field.label : ""}
            maxLength={calculateMaxChars(
              field.width || 200,
              field.fontSize || 14
            )}
          />
        );

      case "date":
        return (
          <input
            type="date"
            className={baseInputClass}
            style={{
              width: field.width || 200,
              fontSize: `${field.fontSize}` || "14px",
              fontFamily: field.fontFamily || "Arial",
              color: field.fontColor || "#000000",
            }}
            value={value || ""}
            onChange={(e) => onChange?.(e.target.value)}
            readOnly={!isEditable}
          />
        );

      case "select":
        return (
          <select
            className={baseInputClass}
            style={{
              width: field.width || 200,
              fontSize: `${field.fontSize}` || "14px",
              fontFamily: field.fontFamily || "Arial",
              color: field.fontColor || "#000000",
            }}
            value={value || ""}
            onChange={(e) => onChange?.(e.target.value)}
            disabled={!isEditable}
          >
            {(field.options || []).map((opt, i) => (
              <option key={i} value={opt}>
                {opt}
              </option>
            ))}
          </select>
        );

      case "signature":
        return (
          <input
            type="text"
            className={baseInputClass}
            style={{
              width: field.width || 200,
              fontSize: `${field.fontSize}` || "14px",
              fontFamily: field.fontFamily || "cursive",
              color: field.fontColor || "#000000",
            }}
            value={value || ""}
            onChange={(e) => onChange?.(e.target.value)}
            readOnly={!isEditable}
            placeholder={isEditable ? "Sign here" : ""}
          />
        );

      case "image":
        return (
          <div
            className="border rounded flex flex-col items-center justify-center gap-2 p-2 text-xs"
            style={{
              width: field.width || 150,
              height: field.height || 100,
            }}
          >
            {value ? (
              <>
                <img
                  src={value}
                  alt={field.alt || "Uploaded"}
                  className="w-full h-full object-contain rounded"
                />
                {isEditable && (
                  <label className="text-[11px] text-blue-600 cursor-pointer hover:underline">
                    Change Image
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                    />
                  </label>
                )}
              </>
            ) : isEditable ? (
              <label className="flex flex-col items-center justify-center cursor-pointer text-blue-600 hover:underline">
                Upload Image
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />
              </label>
            ) : (
              <span className="text-gray-400 text-xs">No image</span>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div
      className="absolute bg-transparent rounded p-2"
      style={{ left: field.x, top: field.y }}
    >
      {field.labelPosition === "top" && renderLabel()}
      <div className="flex items-center gap-2">
        {field.labelPosition === "left" && (
          <div className="text-xs font-semibold whitespace-nowrap">
            {field.label}
            {field.required && <span className="text-red-500 ml-0.5">*</span>}:
          </div>
        )}
        {renderField()}
      </div>
    </div>
  );
};
