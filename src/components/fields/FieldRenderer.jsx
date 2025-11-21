import React from "react";

export const FieldRenderer = ({
  field,
  value,
  onChange,
  readOnly = false,
  role = "applicant",
}) => {
  // Determine if field is editable based on role
  const isEditable = !readOnly && field.role === role;

  const baseInputClass = `border rounded px-2 py-1 text-sm transition-colors ${
    isEditable
      ? "bg-white border-blue-300 focus:ring-2 focus:ring-blue-500"
      : "bg-gray-100 border-gray-200 cursor-not-allowed"
  }`;

  const renderLabel = () => {
    if (field.showLabel === false) return null;
    return (
      <div className="text-xs font-semibold mb-1 text-gray-700">
        {field.label}
        {field.required && <span className="text-red-500 ml-0.5">*</span>}
      </div>
    );
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        onChange?.(event.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const renderField = () => {
    const styleProps = {
      width: `${field.width || 200}px`,
      fontSize: `${field.fontSize || 14}px`,
      fontFamily: field.fontFamily || "Arial",
      color: field.fontColor || "#000000",
    };

    switch (field.type) {
      case "checkbox":
        return (
          <input
            type="checkbox"
            className="w-4 h-4 cursor-pointer"
            checked={value === true || value === "true"}
            onChange={(e) => isEditable && onChange?.(e.target.checked)}
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
            style={styleProps}
            value={value || ""}
            onChange={(e) => isEditable && onChange?.(e.target.value)}
            disabled={!isEditable}
            placeholder={isEditable ? field.label || "Enter text" : ""}
          />
        );

      case "date":
        return (
          <input
            type="date"
            className={baseInputClass}
            style={styleProps}
            value={value || ""}
            onChange={(e) => isEditable && onChange?.(e.target.value)}
            disabled={!isEditable}
          />
        );

      case "select":
        return (
          <select
            className={baseInputClass}
            style={styleProps}
            value={value || ""}
            onChange={(e) => isEditable && onChange?.(e.target.value)}
            disabled={!isEditable}
          >
            <option value="">Select an option</option>
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
            style={{ ...styleProps, fontFamily: field.fontFamily || "cursive" }}
            value={value || ""}
            onChange={(e) => isEditable && onChange?.(e.target.value)}
            disabled={!isEditable}
            placeholder={isEditable ? "Sign here" : ""}
          />
        );

      case "image":
        return (
          <div
            className="border rounded flex flex-col items-center justify-center gap-2 p-2 text-xs"
            style={{
              width: `${field.width || 150}px`,
              height: `${field.height || 100}px`,
              backgroundColor: isEditable ? "#fafafa" : "#f0f0f0",
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
                    Change
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
                Upload
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />
              </label>
            ) : (
              <span className="text-gray-400">No image</span>
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
      style={{ left: field.x, top: field.y, zIndex: 10 }}
    >
      {field.labelPosition === "top" && renderLabel()}
      <div className="flex items-center gap-2">
        {field.labelPosition === "left" && (
          <div className="text-xs font-semibold whitespace-nowrap text-gray-700">
            {field.label}
            {field.required && <span className="text-red-500 ml-0.5">*</span>}:
          </div>
        )}
        {renderField()}
      </div>
    </div>
  );
};
