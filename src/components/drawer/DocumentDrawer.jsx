import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { processPDF } from "../../utils/pdfProcessor";
import { DrawerInitialStep } from "./DrawerInitialStep";
import { DrawerDetailsStep } from "./DrawerDetailsStep";
import { DrawerWorkflowStep } from "./DrawerWorkflowStep";

const DocumentDrawer = ({
  open,
  step,
  documentForm,
  workflows,
  isProcessing,
  fileInputRef,
  onClose,
  onStepChange,
  onDocumentFormChange,
  onWorkflowsChange,
  onFileProcess,
  onProceed,
  onSkipWorkflow,
  setIsProcessing,
}) => {
  const handleFileUpload = async (file) => {
    if (!file) return;

    const fileType = file.name.split(".").pop().toLowerCase();
    if (!["pdf", "doc", "docx"].includes(fileType)) {
      alert("Only PDF, DOC, or DOCX files are supported");
      return;
    }

    if (fileType !== "pdf") {
      await onFileProcess(file);
      onStepChange("upload");
      return;
    }

    setIsProcessing(true);
    try {
      const tempId = `temp-${Date.now().toString()}`;
      const result = await processPDF(file, tempId);

      await onFileProcess(file, {
        ...result,
        tempId,
        isBlankDocument: false,
      });

      onStepChange("upload");
    } catch (error) {
      console.error("File processing error:", error);
      alert(`Error processing file: ${error.message || error}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const getStepTitle = () => {
    switch (step) {
      case "initial":
        return "Add Document";
      case "upload":
        return "Document Details";
      case "workflow":
        return "Configure Workflow";
      default:
        return "Add Document";
    }
  };

  if (!open) return null;

  return (
    <AnimatePresence>
      <motion.div
        key="overlay"
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.5 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black z-40"
        onClick={onClose}
      />
      <motion.div
        key="drawer"
        initial={{ x: "100%" }}
        animate={{ x: 0 }}
        exit={{ x: "100%" }}
        transition={{ type: "tween", duration: 0.3 }}
        className="fixed right-0 top-0 bottom-0 w-[500px] bg-white shadow-2xl z-50 flex flex-col overflow-hidden"
      >
        {/* Header */}
        <div className="border-b border-gray-200 px-6 py-4 flex items-center justify-between flex-shrink-0 bg-white">
          <h2 className="text-xl font-semibold text-gray-900">
            {getStepTitle()}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content Area - THIS IS WHERE STEP CONTENT RENDERS */}
        <div className="flex-1 overflow-y-auto p-6 bg-white">
          {step === "initial" && (
            <DrawerInitialStep
              fileInputRef={fileInputRef}
              onDesign={() => {
                // Design logic handled by parent's handleDesign
                onFileProcess(null, {
                  pages: [
                    {
                      number: 1,
                      image: "data:image/png;base64,...", // Will be set by parent
                      width: 816,
                      height: 1056,
                    },
                  ],
                  arrayBuffer: null,
                  pageCount: 1,
                  isBlankDocument: true,
                  tempId: `blank-${Date.now()}`,
                });
                onStepChange("upload");
              }}
              onUpload={() => fileInputRef.current?.click()}
              onFileChange={handleFileUpload}
              onStepChange={() => onStepChange("upload")}
            />
          )}

          {step === "upload" && (
            <DrawerDetailsStep
              documentForm={documentForm}
              setDocumentForm={onDocumentFormChange}
            />
          )}

          {step === "workflow" && (
            <DrawerWorkflowStep
              workflows={workflows}
              setWorkflows={onWorkflowsChange}
            />
          )}

          {/* Debug: Show step value */}
          {!step && (
            <div className="text-center text-gray-500 py-8">
              <p>No step selected. Current step: {step}</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 px-6 py-4 flex justify-between bg-gray-50 flex-shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors font-medium"
          >
            Cancel
          </button>
          <div className="flex gap-2">
            {step === "workflow" && (
              <button
                onClick={onSkipWorkflow}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors font-medium"
              >
                Skip
              </button>
            )}
            {step !== "initial" && (
              <button
                onClick={onProceed}
                disabled={isProcessing}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
              >
                {isProcessing ? "Processing..." : "Proceed"}
              </button>
            )}
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default DocumentDrawer;
