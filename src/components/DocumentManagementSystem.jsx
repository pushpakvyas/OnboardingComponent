import React, { useState } from "react";
import { useDocuments } from "../hooks/useDocuments";
import { useUserFieldData } from "../hooks/useUserFieldData";
import { DocumentTable } from "../components/document/DocumentTable";
import { DocumentPreview } from "../components/document/DocumentPreview";
import { DocumentEditor } from "../components/document/DocumentEditor";
import { ApplicantFillView } from "../components/workflow/ApplicantFillView";
import { ApproverReviewView } from "../components/workflow/ApproverReviewView";
import { DocumentDrawer } from "../components/drawer/DocumentDrawer";
import { processPDF } from "../utils/document/pdfProcessor";
import { processWord } from "../utils/document/wordProcessor";
import { downloadPDF } from "../utils/document/pdfGenerator";

const DocumentManagementSystem = () => {
  const [view, setView] = useState("table");
  const [currentDocument, setCurrentDocument] = useState(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [currentUserId, setCurrentUserId] = useState("");
  const [currentUserRole, setCurrentUserRole] = useState("");
  const [selectedApplicant, setSelectedApplicant] = useState("");
  const [tempPages, setTempPages] = useState([]);
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

  // const handleApplicantFill = (doc) => {
  //   const userId = prompt("Enter your email/name:");
  //   if (!userId || !userId.trim()) return;

  //   setCurrentUserId(userId);
  //   setCurrentUserRole("applicant");
  //   setCurrentDocument(doc);
  //   setView("applicant-fill");
  // };

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
    // setPages(doc.pages || []);
    // setDroppedFields(doc.droppedFields || {});
    // setCurrentPageNum(1);
    setView("applicant-fill");
  };

  // const handleApproverReview = (doc) => {
  //   const approverId = prompt("Enter your approver email/name:");
  //   if (!approverId || !approverId.trim()) return;

  //   const applicants = getSubmittedApplicants(doc.id);

  //   if (applicants.length === 0) {
  //     alert("No applicants have submitted data for this document yet.");
  //     return;
  //   }

  //   setCurrentUserId(approverId);
  //   setCurrentUserRole("approver");
  //   setSelectedApplicant(applicants[0]);
  //   setCurrentDocument(doc);
  //   setView("approver-review");
  // };
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
    } else {
      console.log(
        "No workflow configured - allowing access to approver:",
        approverId
      );
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
    // setPages(doc.pages || []);
    // setDroppedFields(doc.droppedFields || {});
    // setCurrentPageNum(1);
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
  const handleFileProcess = async (file, pages = null, isDesign = false) => {
    if (pages) {
      setTempPages(pages);
      setIsDesignMode(isDesign);
      return;
    }

    if (!file) return;

    const fileType = file.name.split(".").pop().toLowerCase();

    try {
      let pageImages;
      if (fileType === "pdf") {
        pageImages = await processPDF(file);
      } else {
        pageImages = await processWord(file);
      }

      setTempPages(pageImages);
      setIsDesignMode(false);
    } catch (error) {
      console.error("Error processing file:", error);
      alert("Failed to process file. Please try again.");
    }
  };

  const handleSaveFromDrawer = (documentForm, workflows) => {
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
      pages: tempPages,
      droppedFields: {},
      status: "active",
    };

    if (isDesignMode) {
      // For design mode, go to editor
      setCurrentDocument(newDoc);
      setDrawerOpen(false);
      setTempPages([]);
      setView("editor");
      setIsDesignMode(false);
    } else {
      // For upload mode, save and go to table
      addDocument(newDoc);
      setDrawerOpen(false);
      setTempPages([]);
      setIsDesignMode(false);
      setView("table");
    }
  };

  return (
    <div className="w-screen h-screen flex flex-col bg-gray-50">
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

      {view === "preview" && currentDocument && (
        <DocumentPreview
          document={currentDocument}
          onBack={() => {
            setView("table");
            setCurrentDocument(null);
          }}
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

      {view === "applicant-fill" && currentDocument && (
        <ApplicantFillView
          document={currentDocument}
          userId={currentUserId}
          userFieldData={userFieldData}
          onUpdateFieldValue={handleUpdateApplicantField}
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
          applicants={getSubmittedApplicants(currentDocument.id)}
          userFieldData={userFieldData}
          onUpdateFieldValue={handleUpdateApproverField}
          onDecision={handleApproverDecision}
          onBack={() => {
            setView("table");
            setCurrentDocument(null);
            setCurrentUserId("");
            setCurrentUserRole("");
          }}
        />
      )}

      <DocumentDrawer
        open={drawerOpen}
        onClose={() => {
          setDrawerOpen(false);
          setTempPages([]);
          setIsDesignMode(false);
        }}
        onSave={handleSaveFromDrawer}
        onFileProcess={handleFileProcess}
      />
    </div>
  );
};

export default DocumentManagementSystem;
