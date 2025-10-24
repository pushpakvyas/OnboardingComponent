import React from "react";
import { STANDARD_FIELDS } from "../../constants/fieldConstants";

export const DocumentFieldsSidebar = ({ onDragStart, onDragEnd }) => {
  const handleDragStart = (e, field) => {
    try {
      const transparent = document.createElement("canvas");
      transparent.width = transparent.height = 1;
      e.dataTransfer.setDragImage(transparent, 0, 0);
    } catch (err) {
      console.log("Drag image error:", err);
    }
    onDragStart(field);
  };

  return (
    <div className="w-64 bg-white border-r overflow-y-auto">
      <div className="p-4">
        <h3 className="font-semibold text-gray-900 mb-4">Drag Fields</h3>
        <div className="space-y-2">
          {STANDARD_FIELDS.map((field) => (
            <div
              key={field.id}
              draggable
              onDragStart={(e) => handleDragStart(e, field)}
              onDragEnd={onDragEnd}
              className="flex items-center gap-2 p-2 bg-orange-50 border border-orange-200 rounded cursor-move hover:bg-blue-100 transition"
            >
              <span className="text-sm">{field.icon}</span>
              <span className="text-xs text-gray-700">{field.label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
