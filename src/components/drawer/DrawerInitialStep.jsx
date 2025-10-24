import React from "react";
import { A4_WIDTH, A4_HEIGHT } from "../../constants/layoutConstants";

export const DrawerInitialStep = ({
  fileInputRef,
  onDesign,
  onUpload,
  onFileChange,
  onStepChange,
}) => {
  // const handleFileUpload = async (e) => {
  //   const file = e.target.files[0];
  //   if (!file) return;

  //   const fileType = file.name.split(".").pop().toLowerCase();
  //   if (!["pdf", "doc", "docx"].includes(fileType)) {
  //     alert("Please upload only PDF, DOC, or DOCX files");
  //     return;
  //   }

  //   await onFileChange(file);
  //   onStepChange();
  // };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const fileType = file.name.split(".").pop().toLowerCase();
    if (!["pdf", "doc", "docx"].includes(fileType)) {
      alert("Please upload only PDF, DOC, or DOCX files");
      if (e.target) {
        e.target.value = "";
      }
      return;
    }
    try {
      await onFileChange(file);
      onStepChange();
    } catch (error) {
      console.error("File upload failed:", error);

      alert(
        "Failed to upload file. Please try again.\n\n" +
          "Possible reasons:\n" +
          "• File may be corrupted\n" +
          "• File may be too large\n" +
          "• File format may not be supported\n\n" +
          "Error: " +
          (error.message || "Unknown error")
      );

      if (e.target) {
        e.target.value = "";
      }
    }
  };

  const handleDesign = () => {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    canvas.width = A4_WIDTH;
    canvas.height = A4_HEIGHT;
    ctx.fillStyle = "white";
    ctx.fillRect(0, 0, A4_WIDTH, A4_HEIGHT);

    onFileChange(null, [
      {
        number: 1,
        image: canvas.toDataURL(),
        width: A4_WIDTH,
        height: A4_HEIGHT,
      },
    ]);
    onDesign();
  };

  return (
    <div className="space-y-4">
      <button
        onClick={handleDesign}
        className="w-full p-6 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition text-center"
      >
        <div className="text-4xl mb-2">📝</div>
        <div className="font-semibold text-gray-700">Design Document</div>
        <div className="text-sm text-gray-500">Start with a blank page</div>
      </button>

      <button
        onClick={onUpload}
        className="w-full p-6 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition text-center"
      >
        <div className="text-4xl mb-2">📤</div>
        <div className="font-semibold text-gray-700">Upload Document</div>
        <div className="text-sm text-gray-500">PDF or Word files</div>
      </button>

      <button
        className="w-full p-6 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition text-center"
        onClick={() => alert("Void document functionality coming soon")}
      >
        <div className="text-4xl mb-2">🚫</div>
        <div className="font-semibold text-gray-700">Void Document</div>
        <div className="text-sm text-gray-500">Mark as void</div>
      </button>

      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,.doc,.docx"
        onChange={handleFileUpload}
        className="hidden"
      />
    </div>
  );
};
