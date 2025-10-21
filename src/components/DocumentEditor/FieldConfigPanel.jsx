import React, { useState, useEffect } from "react";

const FieldConfigPanel = ({ field, onUpdate, onClose }) => {
  const [config, setConfig] = useState(field || {});

  useEffect(() => {
    setConfig(field);
  }, [field]);

  if (!field) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setConfig((c) => ({ ...c, [name]: value }));
  };

  const handleSubmit = () => {
    onUpdate(config);
    onClose();
  };

  return (
    <div
      style={{
        width: 300,
        padding: 16,
        borderLeft: "1px solid #ddd",
        backgroundColor: "#f9f9f9",
      }}
    >
      <h3>Configure Field</h3>
      <div>
        <label>Label:</label>
        <input
          name="label"
          value={config.label || ""}
          onChange={handleChange}
          type="text"
        />
      </div>
      {/* Add other configurable properties as needed */}
      <div style={{ marginTop: 10 }}>
        <button onClick={handleSubmit}>Save</button>
        <button onClick={onClose} style={{ marginLeft: 10 }}>
          Cancel
        </button>
      </div>
    </div>
  );
};

export default FieldConfigPanel;
