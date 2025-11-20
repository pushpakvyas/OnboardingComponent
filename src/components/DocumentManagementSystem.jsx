// src/pages/DocumentManagementSystem.jsx
import React, { useState } from "react";
import { useDocuments } from "../hooks/useDocuments";
import { useUserFieldData } from "../hooks/useUserFieldData";
import { DocumentTable } from "../components/document/DocumentTable";
import DocumentPreview from "../components/document/DocumentPreview";
import { DocumentEditor } from "../components/document/DocumentEditor";
import { ApplicantFillView } from "../components/workflow/ApplicantFillView";
import { ApproverReviewView } from "../components/workflow/ApproverReviewView";
import { DocumentDrawer } from "../components/drawer/DocumentDrawer";
import { processPDF, pdfBufferStore } from "../utils/pdfProcessor";
import { downloadPDF } from "../utils/pdfGenerator";

const DocumentManagementSystem = () => {
  const [view, setView] = useState("table");
  const [currentDocument, setCurrentDocument] = useState(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [currentUserId, setCurrentUserId] = useState("");
  const [currentUserRole, setCurrentUserRole] = useState("");
  const [selectedApplicant, setSelectedApplicant] = useState("");
  const [tempDocumentData, setTempDocumentData] = useState(null);
  const [isDesignMode, setIsDesignMode] = useState(false);

  const {
    documents,
    addDocument,
    updateDocument,
    deleteDocument,
    cloneDocument,
  } = useDocuments();

  const {
    userFieldData,
    updateFieldValue,
    updateUserStatus,
    deleteDocumentData,
    getSubmittedApplicants,
  } = useUserFieldData();

  // Document Actions
  const handleViewDocument = (doc) => {
    setCurrentDocument(doc);
    setView("preview");
  };

  const handleEditDocument = (doc) => {
    setCurrentDocument(doc);
    setView("editor");
  };

  const handleDeleteDocument = (docId) => {
    if (window.confirm("Are you sure you want to delete this document?")) {
      deleteDocument(docId);
      deleteDocumentData(docId);
      // also remove buffer from in-memory store
      pdfBufferStore.delete(docId);
    }
  };

  const handleCloneDocument = (doc) => {
    cloneDocument(doc);
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

    setCurrentUserId(userId);
    setCurrentUserRole("applicant");
    setCurrentDocument(doc);
    setView("applicant-fill");
  };

  const handleApproverReview = (doc) => {
    const approverId = prompt("Enter your approver email/name:");
    if (!approverId || !approverId.trim()) return;

    const hasWorkflows = doc.workflows && doc.workflows.length > 0;

    if (hasWorkflows) {
      const workflowApprovers = doc.workflows.flatMap(
        (w) =>
          w.approvers
            ?.split(",")
            .map((a) => a.trim())
            .filter(Boolean) || []
      );

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

    const applicants = Object.keys(userFieldData[doc.id] || {}).filter(
      (userId) => userFieldData[doc.id][userId].status === "submitted"
    );

    if (applicants.length === 0) {
      alert("No applicants have submitted data for this document yet.");
      return;
    }

    setCurrentUserId(approverId);
    setCurrentUserRole("approver");
    setSelectedApplicant(applicants[0]);
    setCurrentDocument(doc);
    setView("approver-review");
  };

  const handleDownloadDocument = async (doc, userId = null) => {
    await downloadPDF(doc, userFieldData, userId);
  };

  // Applicant Actions
  const handleSaveApplicantData = () => {
    updateUserStatus(currentDocument.id, currentUserId, "submitted", {
      submittedAt: new Date().toISOString(),
    });
    alert(
      "Your data has been saved! The document is now ready for approver review."
    );
    setView("table");
    setCurrentDocument(null);
    setCurrentUserId("");
    setCurrentUserRole("");
  };

  const handleUpdateApplicantField = (fieldId, value) => {
    updateFieldValue(currentDocument.id, currentUserId, fieldId, value);
  };

  // Approver Actions
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
  };

  const handleUpdateApproverField = (fieldId, value, applicantId) => {
    updateFieldValue(currentDocument.id, applicantId, fieldId, value);
  };

  // Editor Actions
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

  // Drawer Actions
  const handleFileProcess = async (file, pdfData = null, isDesign = false) => {
    console.log("handleFileProcess called", { file, pdfData, isDesign });

    // For design mode with blank pages
    if (pdfData && pdfData.isBlankDocument) {
      console.log("Setting blank document data");
      setTempDocumentData(pdfData);
      setIsDesignMode(true);
      return;
    }

    if (!file) {
      console.warn("No file provided");
      return;
    }

    const fileType = file.name.split(".").pop().toLowerCase();

    if (fileType !== "pdf") {
      alert("Only PDF files are supported for upload.");
      return;
    }

    try {
      console.log("Processing PDF file...");
      const processedData = await processPDF(file);
      console.log("PDF processed successfully:", processedData);

      setTempDocumentData(processedData);
      setIsDesignMode(false);
    } catch (error) {
      console.error("Error processing file:", error);
      alert("Failed to process PDF file. Please try again.");
    }
  };

  const handleSaveFromDrawer = (documentForm, workflows) => {
    console.log(
      "Saving document from drawer, tempDocumentData:",
      tempDocumentData
    );

    const newDoc = {
      id: Date.now().toString(),
      referenceId: `DOC-${Date.now()}`,
      documentName: documentForm.documentName || "Untitled",
      category: documentForm.category || "General",
      type: documentForm.type || "Other",
      description: documentForm.description || "",
      toBeFilledBy: documentForm.toBeFilledBy || "applicant",
      createdBy: `Current User_${Date.now()}`,
      createdOn: new Date().toISOString(),
      workflows: workflows || [],
      // do NOT persist raw ArrayBuffer here
      // keep a base64 fallback only if you plan to persist to backend/localstorage
      arrayBufferBase64: tempDocumentData?.arrayBufferBase64 || null,
      pages: tempDocumentData?.pages || [],
      droppedFields: {},
      status: "active",
      isBlankDocument: tempDocumentData?.isBlankDocument || false,
    };

    // Store raw ArrayBuffer in in-memory store keyed by document id
    if (tempDocumentData?.arrayBuffer) {
      pdfBufferStore.set(newDoc.id, tempDocumentData.arrayBuffer);
    }

    console.log("New document object:", newDoc);

    if (isDesignMode) {
      setCurrentDocument(newDoc);
      setDrawerOpen(false);
      setTempDocumentData(null);
      setView("editor");
      setIsDesignMode(false);
    } else {
      addDocument(newDoc);
      setDrawerOpen(false);
      setTempDocumentData(null);
      setIsDesignMode(false);
      setView("table");
    }
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
          onDownload={handleDownloadDocument}
          onAddNew={() => setDrawerOpen(true)}
        />
      )}

      {view === "preview" && (
        <DocumentPreview
          document={currentDocument}
          onBack={() => {
            setView("table");
            setCurrentDocument(null);
          }}
          onEdit={() => {
            setView("editor");
          }}
        />
      )}

      {view === "editor" && (
        <DocumentEditor
          document={currentDocument}
          onSave={handleSaveFromEditor}
          onBack={() => {
            setView(currentDocument?.id ? "table" : "table");
            setCurrentDocument(null);
          }}
        />
      )}

      {view === "applicant-fill" && (
        <ApplicantFillView
          document={currentDocument}
          userId={currentUserId}
          userFieldData={userFieldData[currentDocument?.id]?.[currentUserId]}
          onUpdateField={handleUpdateApplicantField}
          onSave={handleSaveApplicantData}
          onBack={() => {
            setView("table");
            setCurrentDocument(null);
            setCurrentUserId("");
            setCurrentUserRole("");
          }}
        />
      )}

      {view === "approver-review" && (
        <ApproverReviewView
          document={currentDocument}
          approverId={currentUserId}
          selectedApplicant={selectedApplicant}
          onSelectApplicant={setSelectedApplicant}
          applicants={getSubmittedApplicants(currentDocument?.id)}
          userFieldData={
            userFieldData[currentDocument?.id]?.[selectedApplicant]
          }
          onUpdateField={handleUpdateApproverField}
          onApprove={(applicantId) =>
            handleApproverDecision("approved", applicantId)
          }
          onReject={(applicantId) =>
            handleApproverDecision("rejected", applicantId)
          }
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
        onClose={() => {
          setDrawerOpen(false);
          setTempDocumentData(null);
          setIsDesignMode(false);
        }}
        onSave={handleSaveFromDrawer}
        onFileProcess={handleFileProcess}
      />
    </div>
  );
};

export default DocumentManagementSystem;
