import React, { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { DrawerInitialStep } from "./DrawerInitialStep";
import { DrawerDetailsStep } from "./DrawerDetailsStep";
import { DrawerWorkflowStep } from "./DrawerWorkflowStep";

export const DocumentDrawer = ({ open, onClose, onSave, onFileProcess }) => {
  const [step, setStep] = useState("initial");
  const [documentForm, setDocumentForm] = useState({
    toBeFilledBy: "applicant",
    documentName: "",
    category: "",
    type: "",
    description: "",
  });
  const [workflows, setWorkflows] = useState([
    { initiator: "", applicant: "", approvers: "" },
  ]);
  const fileInputRef = useRef(null);

  const resetState = () => {
    setStep("initial");
    setDocumentForm({
      toBeFilledBy: "applicant",
      documentName: "",
      category: "",
      type: "",
      description: "",
    });
    setWorkflows([{ initiator: "", applicant: "", approvers: "" }]);
  };

  const handleClose = () => {
    if (window.confirm("Close without saving?")) {
      resetState();
      onClose();
    }
  };

  const handleProceed = () => {
    if (step === "upload") {
      if (
        !documentForm.documentName ||
        !documentForm.category ||
        !documentForm.type
      ) {
        alert("Please fill all required fields");
        return;
      }
      setStep("workflow");
    } else if (step === "workflow") {
      onSave(documentForm, workflows);
      resetState();
    }
  };

  const handleSkipWorkflow = () => {
    onSave(documentForm, []);
    resetState();
  };

  if (!open) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.5 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black z-40"
        onClick={handleClose}
      />
      <motion.div
        initial={{ x: "100%" }}
        animate={{ x: 0 }}
        exit={{ x: "100%" }}
        transition={{ type: "tween", duration: 0.3 }}
        className="fixed right-0 top-0 bottom-0 w-[500px] bg-white shadow-2xl z-50 flex flex-col"
      >
        <div className="border-b px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold">
            {step === "initial" && "Add Document"}
            {step === "upload" && "Document Details"}
            {step === "workflow" && "Configure Workflow"}
          </h2>
          <button
            onClick={handleClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {step === "initial" && (
            <DrawerInitialStep
              fileInputRef={fileInputRef}
              onDesign={() => setStep("upload")}
              onUpload={() => fileInputRef.current?.click()}
              onFileChange={onFileProcess}
              onStepChange={() => setStep("upload")}
            />
          )}

          {step === "upload" && (
            <DrawerDetailsStep
              documentForm={documentForm}
              setDocumentForm={setDocumentForm}
            />
          )}

          {step === "workflow" && (
            <DrawerWorkflowStep
              workflows={workflows}
              setWorkflows={setWorkflows}
            />
          )}
        </div>

        <div className="border-t px-6 py-4 flex items-center justify-between bg-gray-50">
          <button
            onClick={handleClose}
            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-100 transition"
          >
            Cancel
          </button>

          <div className="flex items-center gap-2">
            {step === "workflow" && (
              <button
                onClick={handleSkipWorkflow}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-100 transition"
              >
                Skip Workflow
              </button>
            )}

            {step !== "initial" && (
              <button
                onClick={handleProceed}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
              >
                Proceed
              </button>
            )}
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};
