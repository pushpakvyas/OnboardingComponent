// src/components/drawer/DocumentDrawer.jsx
import React, { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { processPDF } from "../../utils/pdfProcessor";

export const DocumentDrawer = ({ open, onClose, onSave, onFileProcess }) => {
  const [step, setStep] = useState("initial");
  const [documentForm, setDocumentForm] = useState({
    toBeFilledBy: "applicant",
    documentName: "",
    category: "",
    type: "",
    description: "",
  });
  const [workflows, setWorkflows] = useState([{ initiator: "", applicant: "", approvers: "" }]);
  const [isProcessing, setIsProcessing] = useState(false);
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
    setIsProcessing(false);
  };

  const handleClose = () => {
    if (window.confirm("Close without saving?")) {
      resetState();
      onClose();
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const fileType = file.name.split(".").pop().toLowerCase();
    if (!["pdf", "doc", "docx"].includes(fileType)) {
      alert("Only PDF, DOC, or DOCX files are supported");
      e.target.value = "";
      return;
    }

    if (fileType !== "pdf") {
      // for non-pdf we pass to parent for other handling
      await onFileProcess(file);
      setStep("upload");
      return;
    }

    setIsProcessing(true);
    try {
      // create a stable temp id for this upload
      const tempId = `temp-${Date.now().toString()}`;

      // processPDF will store the safe buffer in pdfBufferStore under tempId
      const result = await processPDF(file, tempId);

      // Pass processed data to parent (include tempId)
      await onFileProcess(file, {
        ...result,
        tempId,
        isBlankDocument: false,
      });

      setStep("upload");
    } catch (error) {
      console.error("File processing error:", error);
      alert(`Error processing file: ${error.message || error}`);
      e.target.value = "";
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDesign = () => {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    const A4_WIDTH = 816;
    const A4_HEIGHT = 1056;

    canvas.width = A4_WIDTH;
    canvas.height = A4_HEIGHT;
    ctx.fillStyle = "white";
    ctx.fillRect(0, 0, A4_WIDTH, A4_HEIGHT);

    const tempId = `blank-${Date.now().toString()}`;

    onFileProcess(null, {
      pages: [
        {
          number: 1,
          image: canvas.toDataURL(),
          width: A4_WIDTH,
          height: A4_HEIGHT,
        },
      ],
      arrayBuffer: null,
      pageCount: 1,
      isBlankDocument: true,
      tempId,
    });

    setStep("upload");
  };

  const handleProceed = () => {
    if (step === "upload") {
      if (!documentForm.documentName || !documentForm.category || !documentForm.type) {
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
        key="overlay"
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.5 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black z-40"
        onClick={handleClose}
      />
      <motion.div
        key="drawer"
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
          <button onClick={handleClose} className="text-gray-500 hover:text-gray-700">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {step === "initial" && (
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
                onClick={() => fileInputRef.current?.click()}
                disabled={isProcessing}
                className="w-full p-6 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition text-center disabled:opacity-50"
              >
                <div className="text-4xl mb-2">📤</div>
                <div className="font-semibold text-gray-700">{isProcessing ? "Processing..." : "Upload Document"}</div>
                <div className="text-sm text-gray-500">PDF or Word files</div>
              </button>

              <input ref={fileInputRef} type="file" accept=".pdf,.doc,.docx" onChange={handleFileUpload} className="hidden" />
            </div>
          )}

          {step === "upload" && (
            <div className="space-y-4">
              {/* document form fields */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">To Be Filled By *</label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2">
                    <input type="radio" value="applicant" checked={documentForm.toBeFilledBy === "applicant"} onChange={(e) => setDocumentForm({ ...documentForm, toBeFilledBy: e.target.value })} className="w-4 h-4" />
                    <span className="text-sm">Applicant</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input type="radio" value="vendor" checked={documentForm.toBeFilledBy === "vendor"} onChange={(e) => setDocumentForm({ ...documentForm, toBeFilledBy: e.target.value })} className="w-4 h-4" />
                    <span className="text-sm">Vendor</span>
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Document Name *</label>
                <input type="text" value={documentForm.documentName} onChange={(e) => setDocumentForm({ ...documentForm, documentName: e.target.value })} className="w-full px-3 py-2 border rounded-lg" placeholder="Enter document name" />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Category *</label>
                <select value={documentForm.category} onChange={(e) => setDocumentForm({ ...documentForm, category: e.target.value })} className="w-full px-3 py-2 border rounded-lg">
                  <option value="">Select category</option>
                  <option value="Legal">Legal</option>
                  <option value="Financial">Financial</option>
                  <option value="HR">HR</option>
                  <option value="Compliance">Compliance</option>
                  <option value="General">General</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Type *</label>
                <select value={documentForm.type} onChange={(e) => setDocumentForm({ ...documentForm, type: e.target.value })} className="w-full px-3 py-2 border rounded-lg">
                  <option value="">Select type</option>
                  <option value="Contract">Contract</option>
                  <option value="Agreement">Agreement</option>
                  <option value="Form">Form</option>
                  <option value="Report">Report</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Description</label>
                <textarea value={documentForm.description} onChange={(e) => setDocumentForm({ ...documentForm, description: e.target.value })} className="w-full px-3 py-2 border rounded-lg" rows="3" placeholder="Optional description" />
              </div>
            </div>
          )}

          {step === "workflow" && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Configure Approvers</h3>
              {workflows.map((workflow, index) => (
                <div key={index} className="p-4 border rounded-lg bg-gray-50">
                  <div className="flex justify-between items-center mb-3">
                    <h4 className="font-semibold text-sm">Workflow {index + 1}</h4>
                    {workflows.length > 1 && (
                      <button onClick={() => setWorkflows(workflows.filter((_, i) => i !== index))} className="text-red-600 text-sm hover:text-red-800">Remove</button>
                    )}
                  </div>
                  <div className="space-y-3">
                    <input type="text" value={workflow.applicant} onChange={(e) => { const newWorkflows = [...workflows]; newWorkflows[index].applicant = e.target.value; setWorkflows(newWorkflows); }} placeholder="Applicant email" className="w-full px-3 py-2 border rounded text-sm" />
                    <input type="text" value={workflow.approvers} onChange={(e) => { const newWorkflows = [...workflows]; newWorkflows[index].approvers = e.target.value; setWorkflows(newWorkflows); }} placeholder="Approver emails (comma separated)" className="w-full px-3 py-2 border rounded text-sm" />
                  </div>
                </div>
              ))}

              {workflows.length < 3 && (
                <button onClick={() => setWorkflows([...workflows, { initiator: "", applicant: "", approvers: "" }])} className="w-full py-2 border-2 border-dashed border-gray-300 rounded text-sm text-gray-600">+ Add Workflow</button>
              )}
            </div>
          )}
        </div>

        <div className="border-t px-6 py-4 flex justify-between bg-gray-50">
          <button onClick={handleClose} className="px-4 py-2 border rounded-lg hover:bg-gray-100">Cancel</button>
          <div className="flex gap-2">
            {step === "workflow" && (
              <button onClick={handleSkipWorkflow} className="px-4 py-2 border rounded-lg hover:bg-gray-100">Skip</button>
            )}
            {step !== "initial" && (
              <button onClick={handleProceed} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">Proceed</button>
            )}
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default DocumentDrawer;
