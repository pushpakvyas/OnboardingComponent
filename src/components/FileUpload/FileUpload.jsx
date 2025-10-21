import React, { useRef } from "react";

const FileUpload = ({ onFileProcessed }) => {
  const fileInputRef = useRef(null);

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const fileType = file.name.split(".").pop().toLowerCase();
    if (!["pdf", "doc", "docx"].includes(fileType)) {
      alert("Please upload only PDF, DOC, or DOCX files");
      return;
    }

    onFileProcessed(file, fileType);
  };

  return (
    <>
      <button onClick={() => fileInputRef.current.click()}>
        Upload Document
      </button>
      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,.doc,.docx"
        onChange={handleFileUpload}
        style={{ display: "none" }}
      />
    </>
  );
};

export default FileUpload;
