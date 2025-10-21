import React from "react";

const FieldList = ({ fields }) => {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      {fields.map((field) => (
        <div
          key={field.id}
          style={{
            padding: "8px",
            border: "1px solid #ccc",
            borderRadius: 4,
            cursor: "grab",
            display: "flex",
            alignItems: "center",
            gap: 8,
          }}
          draggable
          onDragStart={(e) =>
            e.dataTransfer.setData("fieldType", JSON.stringify(field))
          }
        >
          <span>{field.icon}</span> {field.label}
        </div>
      ))}
    </div>
  );
};

export default FieldList;
