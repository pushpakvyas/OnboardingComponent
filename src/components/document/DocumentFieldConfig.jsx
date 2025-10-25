import React from "react";
import { X } from "lucide-react";

export const DocumentFieldConfig = ({ field, onUpdate, onClose }) => {
  if (!field) return null;

  return (
    <div className="lg:w-60 xl:w-80 bg-white border-l overflow-y-auto">
      <div className="sticky top-0 bg-white border-b px-4 py-3 flex items-center justify-between">
        <h3 className="text-sm font-semibold">Field Configuration</h3>
        <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
          <X className="w-5 h-5" />
        </button>
      </div>
      <div className="p-4 space-y-4">
        <div>
          <label className="block text-xs font-semibold text-gray-700 mb-1">
            To Be Filled By
          </label>
          <select
            value={field.role || "applicant"}
            onChange={(e) => onUpdate(field.id, "role", e.target.value)}
            className="w-full px-2 py-1 border rounded text-sm"
          >
            <option value="applicant">Applicant</option>
            <option value="approver">Approver</option>
          </select>
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-700 mb-1">
            Label
          </label>
          <input
            type="text"
            value={field.label}
            onChange={(e) => onUpdate(field.id, "label", e.target.value)}
            className="w-full px-2 py-1 border rounded text-sm"
          />
        </div>

        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={field.showLabel === true}
            onChange={(e) => onUpdate(field.id, "showLabel", e.target.checked)}
            className="w-4 h-4"
            id="showLabelCheck"
          />
          <label
            htmlFor="showLabelCheck"
            className="text-xs font-semibold text-gray-700"
          >
            Show Label
          </label>
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-700 mb-1">
            Label Position
          </label>
          <select
            value={field.labelPosition || "top"}
            onChange={(e) =>
              onUpdate(field.id, "labelPosition", e.target.value)
            }
            className="w-full px-2 py-1 border rounded text-sm"
          >
            <option value="top">Top</option>
            <option value="left">Left (Inline)</option>
          </select>
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-700 mb-1">
            Width (px)
          </label>
          <input
            type="number"
            value={field.width || 200}
            onChange={(e) =>
              onUpdate(field.id, "width", parseInt(e.target.value))
            }
            className="w-full px-2 py-1 border rounded text-sm"
          />
        </div>

        {/* <div>
          <label className="block text-xs font-semibold text-gray-700 mb-1">
            Font Size
          </label>
          <input
            type="number"
            value={field.fontSize || 14}
            onChange={(e) =>
              onUpdate(field.id, "fontSize", parseInt(e.target.value))
            }
            className="w-full px-2 py-1 border rounded text-sm"
          />
        </div> */}

        <div>
          <label className="block text-xs font-semibold text-gray-700 mb-1">
            Font Size
          </label>
          <select
            value={field.fontSize ?? 12}
            onChange={(e) =>
              onUpdate(field.id, "fontSize", Number(e.target.value))
            }
            className="w-full px-2 py-1 border rounded text-sm"
          >
            {[12, 14, 16, 18, 20, 22, 24].map((size) => (
              <option key={size} value={size}>
                {size}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-700 mb-1">
            Font Family
          </label>
          <select
            value={field.fontFamily || "Arial"}
            onChange={(e) => onUpdate(field.id, "fontFamily", e.target.value)}
            className="w-full px-2 py-1 border rounded text-sm"
          >
            <option value="Arial">Arial</option>
            <option value="Times New Roman">Times New Roman</option>
            <option value="Courier New">Courier New</option>
            <option value="cursive">Cursive</option>
          </select>
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-700 mb-1">
            Font Color
          </label>
          <input
            type="color"
            value={field.fontColor || "#000000"}
            onChange={(e) => onUpdate(field.id, "fontColor", e.target.value)}
            className="w-full h-10"
          />
        </div>

        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={field.required || false}
            onChange={(e) => onUpdate(field.id, "required", e.target.checked)}
            className="w-4 h-4"
          />
          <label className="text-xs font-semibold text-gray-700">
            Required Field
          </label>
        </div>

        {field.type === "select" && (
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              Options
            </label>
            {(field.options || []).map((opt, idx) => (
              <div key={idx} className="flex gap-2 mb-2">
                <input
                  type="text"
                  value={opt}
                  onChange={(e) => {
                    const newOptions = [...field.options];
                    newOptions[idx] = e.target.value;
                    onUpdate(field.id, "options", newOptions);
                  }}
                  className="flex-1 px-2 py-1 border rounded text-sm"
                />
                <button
                  onClick={() => {
                    const newOptions = field.options.filter(
                      (_, i) => i !== idx
                    );
                    onUpdate(field.id, "options", newOptions);
                  }}
                  className="px-2 py-1 bg-red-500 text-white rounded text-xs"
                >
                  Remove
                </button>
              </div>
            ))}
            <button
              onClick={() => {
                onUpdate(field.id, "options", [
                  ...field.options,
                  `Option ${field.options.length + 1}`,
                ]);
              }}
              className="px-3 py-1 bg-blue-600 text-white rounded text-sm"
            >
              Add Option
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
