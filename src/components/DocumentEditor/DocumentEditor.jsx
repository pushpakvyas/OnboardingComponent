import React, { useState } from "react";
import FieldList from "./FieldList";
import FieldConfigPanel from "./FieldConfigPanel";
import DocumentPreview from "../DocumentPreview/DocumentPreview";
import { STANDARD_FIELDS } from "../../utils/constants";

const DocumentEditor = ({
  document,
  pages,
  droppedFields,
  setDroppedFields,
  setDocument,
  onSave,
  onCancel,
}) => {
  const [selectedFieldId, setSelectedFieldId] = useState(null);

  return (
    <div style={{ display: "flex", height: "100vh", overflow: "hidden" }}>
      <aside
        style={{
          width: 300,
          borderRight: "1px solid #ddd",
          padding: 16,
          overflowY: "auto",
          boxSizing: "border-box",
        }}
      >
        <h3>Available Fields</h3>
        <FieldList fields={STANDARD_FIELDS} />
      </aside>

      <main
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          padding: 16,
          overflowY: "auto",
        }}
      >
        <h2>{document.documentName || "Untitled Document"}</h2>

        <div
          style={{
            flexGrow: 1,
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            width: "100%",
            minHeight: 400,
          }}
        >
          <DocumentPreview pages={pages} />
        </div>

        <div style={{ marginTop: 10 }}>
          <button onClick={() => onSave(document)}>Save Document</button>
          <button onClick={onCancel} style={{ marginLeft: 8 }}>
            Cancel
          </button>
        </div>
      </main>

      {selectedFieldId && (
        <FieldConfigPanel
          field={droppedFields[selectedFieldId]}
          onUpdate={(updatedField) => {
            setDroppedFields((prev) => ({
              ...prev,
              [selectedFieldId]: updatedField,
            }));
          }}
          onClose={() => setSelectedFieldId(null)}
        />
      )}
    </div>
  );
};

export default DocumentEditor;
