// src/pages/DocumentManagementSystem.jsx
import React, { useState, useEffect, useRef } from "react";
import { DocumentTable } from "../components/document/DocumentTable";
import { DocumentPreview } from "../components/document/DocumentPreview";
import { DocumentEditor } from "../components/document/DocumentEditor";
import { ApplicantFillView } from "../components/workflow/ApplicantFillView";
import { ApproverReviewView } from "../components/workflow/ApproverReviewView";
import { InitiatorFillView } from "../components/workflow/InitiatorFillView";
import DocumentDrawer from "../components/drawer/DocumentDrawer";
import { pdfBufferStore } from "../utils/pdfBufferStore";
import { useUserFieldData } from "../hooks/useUserFieldData";
import { dataService } from "../services/dataService";

const DocumentManagementSystem = () => {
  const [view, setView] = useState("table");
  const [currentDocument, setCurrentDocument] = useState(null);

  // Drawer state management
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerStep, setDrawerStep] = useState("initial");
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
  const [isProcessing, setIsProcessing] = useState(false);
  const fileInputRef = useRef(null);

  const [currentUserId, setCurrentUserId] = useState("");
  const [currentUserRole, setCurrentUserRole] = useState("");
  const [selectedApplicant, setSelectedApplicant] = useState("");
  const [tempDocumentData, setTempDocumentData] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);

  const {
    userFieldData,
    updateFieldValue,
    updateUserStatus,
    deleteDocumentData,
    getSubmittedApplicants,
  } = useUserFieldData();

  useEffect(() => {
    const loadDocuments = async () => {
      try {
        setLoading(true);
        const docs = await dataService.getDocuments();
        setDocuments(docs || []);
      } catch (error) {
        console.error("Error loading documents:", error);
        setDocuments([]);
      } finally {
        setLoading(false);
      }
    };
    loadDocuments();
  }, []);

  useEffect(() => {
    if (!loading && documents.length >= 0) {
      const saveDocuments = async () => {
        try {
          await dataService.saveDocuments(documents);
        } catch (error) {
          console.error("Error saving documents:", error);
        }
      };
      const timer = setTimeout(saveDocuments, 500);
      return () => clearTimeout(timer);
    }
  }, [documents, loading]);

  const addDocument = (doc) => {
    setDocuments((prev) => [doc, ...prev]);
  };

  const updateDocument = (id, updated) => {
    setDocuments((prev) =>
      prev.map((d) => (d.id === id ? { ...d, ...updated } : d))
    );
  };

  const deleteDocumentLocal = (id) => {
    setDocuments((prev) => prev.filter((d) => d.id !== id));
    pdfBufferStore.delete(id);
    deleteDocumentData(id);
  };

  // Reset drawer state
  const resetDrawerState = () => {
    setDrawerStep("initial");
    setDocumentForm({
      toBeFilledBy: "applicant",
      documentName: "",
      category: "",
      type: "",
      description: "",
    });
    setWorkflows([{ initiator: "", applicant: "", approvers: "" }]);
    setIsProcessing(false);
    setTempDocumentData(null);
  };

  const handleFileProcess = (file, pdfData = null) => {
    if (pdfData && pdfData.isBlankDocument) {
      setTempDocumentData(pdfData);
      return;
    }
    if (!file && !pdfData) return;
    if (pdfData) {
      setTempDocumentData(pdfData);
    }
  };

  const handleDrawerClose = () => {
    if (window.confirm("Close without saving?")) {
      resetDrawerState();
      setDrawerOpen(false);
    }
  };

  const handleDrawerProceed = () => {
    if (drawerStep === "upload") {
      if (
        !documentForm.documentName ||
        !documentForm.category ||
        !documentForm.type
      ) {
        alert("Please fill all required fields");
        return;
      }
      setDrawerStep("workflow");
    } else if (drawerStep === "workflow") {
      handleSaveFromDrawer(documentForm, workflows);
    }
  };

  const handleSkipWorkflow = () => {
    handleSaveFromDrawer(documentForm, []);
  };

  const handleSaveFromDrawer = (documentForm, workflows) => {
    let docId;
    if (tempDocumentData?.tempId) {
      docId = tempDocumentData.tempId;
    } else {
      docId = Date.now().toString();
    }

    const newDoc = {
      id: docId,
      referenceId: `DOC-${Date.now()}`,
      documentName: documentForm.documentName || "Untitled",
      category: documentForm.category || "General",
      type: documentForm.type || "Other",
      description: documentForm.description || "",
      toBeFilledBy: documentForm.toBeFilledBy || "applicant",
      createdBy: `Current User_${Date.now()}`,
      createdOn: new Date().toISOString(),
      workflows: workflows || [],
      arrayBuffer: tempDocumentData?.arrayBuffer || null,
      pages: tempDocumentData?.pages || [],
      droppedFields: {},
      status: "active",
      isBlankDocument: tempDocumentData?.isBlankDocument || false,
    };

    if (!newDoc.arrayBuffer && tempDocumentData?.tempId) {
      const stored = pdfBufferStore.get(tempDocumentData.tempId);
      if (stored) {
        newDoc.arrayBuffer = stored;
      }
    }

    if (tempDocumentData?.tempId && tempDocumentData.tempId !== docId) {
      const buf = pdfBufferStore.get(tempDocumentData.tempId);
      if (buf) {
        pdfBufferStore.set(docId, buf);
        pdfBufferStore.delete(tempDocumentData.tempId);
      }
    }

    addDocument(newDoc);
    resetDrawerState();
    setDrawerOpen(false);
    setView("table");
  };

  const handleApproverDecision = (decision, applicantId) => {
    updateUserStatus(currentDocument.id, applicantId, decision, {
      approver: currentUserId,
      approvedAt: new Date().toISOString(),
    });
    alert(`Application ${decision}!`);
    setView("table");
    setCurrentDocument(null);
    setCurrentUserId("");
    setCurrentUserRole("");
    setSelectedApplicant("");
  };

  const handleViewDocument = (doc) => {
    setCurrentDocument(doc);
    setView("preview");
  };

  const handleEditDocument = (doc) => {
    setCurrentDocument(doc);
    setView("editor");
  };

  const handleUpdateField = (fieldId, value) => {
    updateFieldValue(currentDocument.id, currentUserId, fieldId, value);
  };

  const handleSaveInitiatorData = () => {
    const initiatorFields = Object.values(currentDocument.droppedFields || {})
      .flat()
      .filter((f) => f.role === "initiator" && f.required);

    const hasEmpty = initiatorFields.some(
      (field) =>
        !userFieldData[currentDocument.id]?.[currentUserId]?.[field.id] ||
        String(
          userFieldData[currentDocument.id][currentUserId][field.id]
        ).trim() === ""
    );

    if (hasEmpty) {
      alert("Please fill all required initiator fields.");
      return;
    }

    updateUserStatus(currentDocument.id, currentUserId, "initiator-submitted", {
      role: "initiator",
      submittedAt: new Date().toISOString(),
    });
    alert("Initiator data has been saved!");
    setView("table");
    setCurrentDocument(null);
    setCurrentUserId("");
    setCurrentUserRole("");
  };

  const handleSaveApplicantData = () => {
    const applicantFields = Object.values(currentDocument.droppedFields || {})
      .flat()
      .filter((f) => f.role === "applicant" && f.required);

    const hasEmpty = applicantFields.some(
      (field) =>
        !userFieldData[currentDocument.id]?.[currentUserId]?.[field.id] ||
        String(
          userFieldData[currentDocument.id][currentUserId][field.id]
        ).trim() === ""
    );

    if (hasEmpty) {
      alert("Please fill all required applicant fields.");
      return;
    }

    updateUserStatus(currentDocument.id, currentUserId, "applicant-submitted", {
      role: "applicant",
      submittedAt: new Date().toISOString(),
    });
    alert("Applicant data saved! Ready for approver review.");
    setView("table");
    setCurrentDocument(null);
    setCurrentUserId("");
    setCurrentUserRole("");
  };

  const handleSaveApproverData = () => {
    const approverFields = Object.values(currentDocument.droppedFields || {})
      .flat()
      .filter((f) => f.role === "approver" && f.required);

    const hasEmpty = approverFields.some(
      (field) =>
        !userFieldData[currentDocument.id]?.[currentUserId]?.[field.id] ||
        String(
          userFieldData[currentDocument.id][currentUserId][field.id]
        ).trim() === ""
    );

    if (hasEmpty) {
      alert("Please fill all required approver fields.");
      return;
    }

    updateUserStatus(currentDocument.id, currentUserId, "approver-submitted", {
      role: "approver",
      submittedAt: new Date().toISOString(),
    });
    alert("Approver data saved and document approved!");
    setView("table");
    setCurrentDocument(null);
    setCurrentUserId("");
    setCurrentUserRole("");
  };

  const handleCloneDocument = (doc) => {
    const clonedDoc = {
      ...doc,
      id: Date.now().toString(),
      referenceId: `DOC-${Date.now()}`,
      documentName: `${doc.documentName} (Copy)`,
      createdOn: new Date().toISOString(),
    };
    const originalIndex = documents.findIndex((d) => d.id === doc.id);
    setDocuments((prev) => {
      const newDocs = [...prev];
      newDocs.splice(originalIndex + 1, 0, clonedDoc);
      return newDocs;
    });
  };

  const handleDownloadDocument = async (doc) => {
    const { downloadPDF } = await import("../utils/pdfGenerator");
    const docUsers = Object.keys(userFieldData[doc.id] || {});
    const combinedFieldValues = {};
    for (const userId of docUsers) {
      const statusObj = userFieldData[doc.id][userId];
      const { status, role, ...fields } = statusObj;
      if (!fields) continue;
      for (const [fieldId, value] of Object.entries(fields)) {
        combinedFieldValues[fieldId] = value;
      }
    }
    const mergedUserDataForDownload = {
      [doc.id]: {
        merged: combinedFieldValues,
      },
    };
    await downloadPDF(doc, mergedUserDataForDownload, "merged");
  };

  const handleSaveFromEditor = (updatedDocument) => {
    if (updatedDocument.id) {
      updateDocument(updatedDocument.id, updatedDocument);
    } else {
      const newDoc = {
        ...updatedDocument,
        id: Date.now().toString(),
        referenceId: `DOC-${Date.now()}`,
        createdBy: `Current User_${Date.now()}`,
        createdOn: new Date().toISOString(),
        status: "active",
      };
      addDocument(newDoc);
    }
    setView("table");
    setCurrentDocument(null);
  };

  const handleDeleteDocument = (docId) => {
    if (!window.confirm("Delete document?")) return;
    deleteDocumentLocal(docId);
  };

  const handleApplicantFill = (doc) => {
    const userId = prompt("Enter your email/name:");
    if (!userId || !userId.trim()) return;
    const workflowApplicants =
      doc.workflows?.map((w) => w.applicant?.trim()).filter(Boolean) || [];
    const sharedUsers = doc.sharedWith || [];
    const isAuthorized =
      workflowApplicants.includes(userId.trim()) ||
      sharedUsers.includes(userId.trim());
    if (!isAuthorized) {
      alert(
        "Access denied. You are not authorized to fill this document.\n\n" +
          "This document can only be filled by:\n" +
          "- Applicants listed in the workflow\n" +
          "- Users with whom the document has been shared"
      );
      return;
    }
    setCurrentUserId(userId.trim());
    setCurrentUserRole("applicant");
    setCurrentDocument(doc);
    setView("applicant-fill");
  };

  const handleApproverReview = (doc) => {
    const approverId = prompt("Enter your approver email/name:");
    if (!approverId || !approverId.trim()) return;
    const hasWorkflows = doc.workflows && doc.workflows.length > 0;
    if (hasWorkflows) {
      const workflowApprovers =
        doc.workflows.flatMap(
          (w) =>
            w.approvers
              ?.split(",")
              .map((a) => a.trim())
              .filter(Boolean) || []
        ) || [];
      const isAuthorized = workflowApprovers.includes(approverId.trim());
      if (!isAuthorized) {
        alert(
          "Access denied. You are not listed as an approver for this document.\n\n" +
            "Authorized approvers:\n" +
            workflowApprovers.map((a) => `- ${a}`).join("\n")
        );
        return;
      }
    }
    const applicants = getSubmittedApplicants(doc.id);
    if (applicants.length === 0) {
      alert("No applicants have submitted data for this document yet.");
      return;
    }
    setCurrentUserId(approverId.trim());
    setCurrentUserRole("approver");
    setSelectedApplicant(applicants[0]);
    setCurrentDocument(doc);
    setView("approver-review");
  };

  const handleInitiatorFill = (doc) => {
    const initiatorId = prompt("Enter your initiator email/name:");
    if (!initiatorId || !initiatorId.trim()) return;
    setCurrentUserId(initiatorId.trim());
    setCurrentUserRole("initiator");
    setCurrentDocument(doc);
    setView("initiator-fill");
  };

  const handleShareDocument = (doc) => {
    const userId = prompt("Enter user email/name to share with:");
    if (!userId || !userId.trim()) return;
    const existingData = userFieldData[doc.id]?.[userId];
    if (existingData && Object.keys(existingData).length > 0) {
      if (
        !window.confirm(
          "This user already has data for this document. Create new entry?"
        )
      ) {
        return;
      }
    }
    updateUserStatus(doc.id, userId, "pending", {
      role: "applicant",
      createdAt: new Date().toISOString(),
    });
    updateDocument(doc.id, {
      sharedWith: [...(doc.sharedWith || []), userId],
    });
    alert(
      `Document shared with ${userId}. They can now fill the applicant fields.`
    );
  };

  const handleConfigureWorkflow = () => {
    setDrawerOpen(true);
    setDrawerStep("workflow");
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4" />
          <p>Loading documents...</p>
        </div>
      </div>
    );
  }

  const getInitiatorId = () => {
    if (!currentDocument) return null;
    const initiators = currentDocument.workflows
      ?.map((w) => w.initiator?.trim())
      .filter(Boolean);
    return initiators?.length > 0 ? initiators[0] : null;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {view === "table" && (
        <DocumentTable
          documents={documents}
          onView={handleViewDocument}
          onEdit={handleEditDocument}
          onDelete={handleDeleteDocument}
          onClone={handleCloneDocument}
          onShare={handleShareDocument}
          onApplicantFill={handleApplicantFill}
          onApproverReview={handleApproverReview}
          onInitiatorFill={handleInitiatorFill}
          onDownload={handleDownloadDocument}
          onAddNew={() => setDrawerOpen(true)}
          onConfigure={handleConfigureWorkflow}
        />
      )}

      {view === "preview" && currentDocument && (
        <DocumentPreview
          document={currentDocument}
          onBack={() => {
            setView("table");
            setCurrentDocument(null);
          }}
          onEdit={() => setView("editor")}
        />
      )}

      {view === "editor" && currentDocument && (
        <DocumentEditor
          document={currentDocument}
          onSave={handleSaveFromEditor}
          onBack={() => {
            setView("table");
            setCurrentDocument(null);
          }}
        />
      )}

      {view === "initiator-fill" && currentDocument && (
        <InitiatorFillView
          document={currentDocument}
          userId={currentUserId}
          userFieldData={
            userFieldData[currentDocument.id]?.[currentUserId] || {}
          }
          onUpdateField={handleUpdateField}
          onSave={handleSaveInitiatorData}
          onBack={() => {
            setView("table");
            setCurrentDocument(null);
            setCurrentUserId("");
            setCurrentUserRole("");
          }}
        />
      )}

      {view === "applicant-fill" && currentDocument && (
        <ApplicantFillView
          document={currentDocument}
          userId={currentUserId}
          userFieldData={
            userFieldData[currentDocument.id]?.[currentUserId] || {}
          }
          initiatorData={
            userFieldData[currentDocument.id]?.[getInitiatorId()] || {}
          }
          onUpdateField={handleUpdateField}
          onSave={handleSaveApplicantData}
          onBack={() => {
            setView("table");
            setCurrentDocument(null);
            setCurrentUserId("");
            setCurrentUserRole("");
          }}
        />
      )}

      {view === "approver-review" && currentDocument && (
        <ApproverReviewView
          document={currentDocument}
          approverId={currentUserId}
          selectedApplicant={selectedApplicant}
          onSelectApplicant={setSelectedApplicant}
          applicants={getSubmittedApplicants(currentDocument.id)}
          userFieldData={
            userFieldData[currentDocument.id]?.[currentUserId] || {}
          }
          initiatorData={
            userFieldData[currentDocument.id]?.[getInitiatorId()] || {}
          }
          applicantData={
            userFieldData[currentDocument.id]?.[selectedApplicant] || {}
          }
          onUpdateField={handleUpdateField}
          onApprove={(applicantId) =>
            handleApproverDecision("approved", applicantId)
          }
          onReject={(applicantId) =>
            handleApproverDecision("rejected", applicantId)
          }
          onSave={handleSaveApproverData}
          onBack={() => {
            setView("table");
            setCurrentDocument(null);
            setCurrentUserId("");
            setCurrentUserRole("");
            setSelectedApplicant("");
          }}
        />
      )}

      <DocumentDrawer
        open={drawerOpen}
        step={drawerStep}
        documentForm={documentForm}
        workflows={workflows}
        isProcessing={isProcessing}
        fileInputRef={fileInputRef}
        onClose={handleDrawerClose}
        onStepChange={setDrawerStep}
        onDocumentFormChange={setDocumentForm}
        onWorkflowsChange={setWorkflows}
        onFileProcess={handleFileProcess}
        onProceed={handleDrawerProceed}
        onSkipWorkflow={handleSkipWorkflow}
        setIsProcessing={setIsProcessing}
      />
    </div>
  );
};

export default DocumentManagementSystem;
