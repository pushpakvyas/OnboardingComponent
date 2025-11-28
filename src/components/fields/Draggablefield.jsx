import React, { useState } from "react";
import { motion } from "framer-motion";

export const DraggableField = ({
  field,
  isSelected,
  onSelect,
  onDelete,
  onUpdatePosition,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  const handleMouseDown = (e) => {
    if (e.target.classList.contains("drag-handle")) {
      setIsDragging(true);
      setDragStart({ x: e.clientX - field.x, y: e.clientY - field.y });
    }
  };

  const handleMouseMove = (e) => {
    if (isDragging) {
      const newX = Math.max(0, Math.min(e.clientX - dragStart.x, 816));
      const newY = Math.max(0, Math.min(e.clientY - dragStart.y, 1056));
      onUpdatePosition(field.id, newX, newY);
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  React.useEffect(() => {
    if (isDragging) {
      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleMouseUp);
      return () => {
        window.removeEventListener("mousemove", handleMouseMove);
        window.removeEventListener("mouseup", handleMouseUp);
      };
    }
  }, [isDragging]);

  // Define role colors
  const getRoleColor = (role) => {
    switch (role) {
      case "initiator":
        return "bg-green-100 text-green-700";
      case "approver":
        return "bg-purple-100 text-purple-700";
      case "applicant":
      default:
        return "bg-blue-100 text-blue-700";
    }
  };

  return (
    <motion.div
      key={field.id}
      className={`absolute ${
        isSelected ? "ring-2 ring-blue-500" : "hover:ring-2 hover:ring-gray-300"
      } rounded`}
      style={{ left: field.x, top: field.y, zIndex: isSelected ? 40 : 20 }}
      onMouseDown={handleMouseDown}
      onClick={(e) => {
        e.stopPropagation();
        if (!e.target.classList.contains("delete-btn")) {
          onSelect(field.id);
        }
      }}
    >
      <div className="flex gap-1 items-start">
        <div
          className="drag-handle cursor-move text-lg select-none"
          title="Drag to move"
        >
          ⠿
        </div>
        <div className="bg-transparent rounded p-2 min-w-max group relative">
          <div
            className={`absolute -top-2 left-0 text-[10px] px-2 py-0.5 rounded ${getRoleColor(
              field.role || "applicant"
            )}`}
          >
            {field.role || "applicant"}
          </div>
          {field.showLabel !== false && field.labelPosition === "top" && (
            <div className="text-xs font-semibold mb-1">
              {field.label}
              {field.required && <span className="text-red-500 ml-0.5">*</span>}
            </div>
          )}
          <div className="flex items-center gap-2">
            {field.showLabel !== false && field.labelPosition === "left" && (
              <div className="text-xs font-semibold whitespace-nowrap">
                {field.label}
                {field.required && (
                  <span className="text-red-500 ml-0.5">*</span>
                )}
                :
              </div>
            )}
            <div>
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
                  style={{ width: field.width || 200, fontFamily: "cursive" }}
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
          </div>
          <button
            onClick={(e) => {
              e.stopPropagation();
              e.preventDefault();
              onDelete(field.id);
            }}
            className="delete-btn absolute -top-2 -right-2 w-5 h-5 bg-red-500 text-white rounded-full text-xs opacity-0 group-hover:opacity-100 transition flex items-center justify-center font-bold"
          >
            ×
          </button>
        </div>
      </div>
    </motion.div>
  );
};
