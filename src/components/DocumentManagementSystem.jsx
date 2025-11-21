// src/components/DocumentManagementSystem.jsx
import React, { useState, useEffect } from "react";
import { DocumentTable } from "../components/document/DocumentTable";
import { DocumentPreview } from "../components/document/DocumentPreview";
import { DocumentEditor } from "../components/document/DocumentEditor";
import { ApplicantFillView } from "../components/workflow/ApplicantFillView";
import { ApproverReviewView } from "../components/workflow/ApproverReviewView";
import DocumentDrawer from "../components/drawer/DocumentDrawer";
import { pdfBufferStore } from "../utils/pdfBufferStore";
import { useUserFieldData } from "../hooks/useUserFieldData";
import { dataService } from "../services/dataService";

const DocumentManagementSystem = () => {
  const [view, setView] = useState("table");
  const [currentDocument, setCurrentDocument] = useState(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
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

  // Load documents from localStorage on mount
  useEffect(() => {
    const loadDocuments = async () => {
      try {
        setLoading(true);
        const docs = await dataService.getDocuments();
        setDocuments(docs);
      } catch (error) {
        console.error("Error loading documents:", error);
        setDocuments([]);
      } finally {
        setLoading(false);
      }
    };

    loadDocuments();
  }, []);

  // Save documents to localStorage whenever they change
  useEffect(() => {
    if (!loading && documents.length >= 0) {
      const saveDocuments = async () => {
        try {
          await dataService.saveDocuments(documents);
        } catch (error) {
          console.error("Error saving documents:", error);
        }
      };

      const timer = setTimeout(saveDocuments, 500); // Debounce saves
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

    // If tempDocumentData had no arrayBuffer but pdfBufferStore has one under tempId, ensure it's available
    if (!newDoc.arrayBuffer && tempDocumentData?.tempId) {
      const stored = pdfBufferStore.get(tempDocumentData.tempId);
      if (stored) {
        newDoc.arrayBuffer = stored;
      }
    }

    // If tempId was used as doc id, buffer is already in pdfBufferStore under that key.
    // If we generated a new id, move the buffer to new id
    if (tempDocumentData?.tempId && tempDocumentData.tempId !== docId) {
      const buf = pdfBufferStore.get(tempDocumentData.tempId);
      if (buf) {
        pdfBufferStore.set(docId, buf);
        pdfBufferStore.delete(tempDocumentData.tempId);
      }
    }

    addDocument(newDoc);
    setDrawerOpen(false);
    setTempDocumentData(null);
    setView("table");
  };

  const handleViewDocument = (doc) => {
    setCurrentDocument(doc);
    setView("preview");
  };

  const handleEditDocument = (doc) => {
    setCurrentDocument(doc);
    setView("editor");
  };

  const handleUpdateApplicantField = (fieldId, value) => {
    updateFieldValue(currentDocument.id, currentUserId, fieldId, value);
  };

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

  const handleCloneDocument = (doc) => {
    const clonedDoc = {
      ...doc,
      id: Date.now().toString(),
      referenceId: `DOC-${Date.now()}`,
      documentName: `${doc.documentName} (Copy)`,
      createdOn: new Date().toISOString(),
    };
    addDocument(clonedDoc);
  };

  const handleDownloadDocument = async (doc, userId = null) => {
    const { downloadPDF } = await import("../utils/pdfGenerator");
    await downloadPDF(doc, userFieldData, userId);
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

  const handleUpdateApproverField = (fieldId, value, applicantId) => {
    updateFieldValue(currentDocument.id, applicantId, fieldId, value);
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

    const applicants = getSubmittedApplicants(doc.id);

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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p>Loading documents...</p>
        </div>
      </div>
    );
  }

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
            setView("table");
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
        }}
        onSave={handleSaveFromDrawer}
        onFileProcess={handleFileProcess}
      />
    </div>
  );
};

export default DocumentManagementSystem;
