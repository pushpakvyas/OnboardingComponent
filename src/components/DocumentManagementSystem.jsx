// import React, { useState } from "react";
// import { useDocuments } from "../hooks/useDocuments";
// import { useUserFieldData } from "../hooks/useUserFieldData";
// import { DocumentTable } from "../components/document/DocumentTable";
// import DocumentPreview from "../components/document/DocumentPreview";
// import { DocumentEditor } from "../components/document/DocumentEditor";
// import { ApplicantFillView } from "../components/workflow/ApplicantFillView";
// import { ApproverReviewView } from "../components/workflow/ApproverReviewView";
// import { DocumentDrawer } from "../components/drawer/DocumentDrawer";
// import { processPDF } from "../utils/pdfProcessor";
// import { pdfBufferStore } from "../utils/pdfBufferStore";
// import { downloadPDF } from "../utils/pdfGenerator";

// const DocumentManagementSystem = () => {
//   const [view, setView] = useState("table");
//   const [currentDocument, setCurrentDocument] = useState(null);
//   const [drawerOpen, setDrawerOpen] = useState(false);
//   const [currentUserId, setCurrentUserId] = useState("");
//   const [currentUserRole, setCurrentUserRole] = useState("");
//   const [selectedApplicant, setSelectedApplicant] = useState("");
//   const [tempDocumentData, setTempDocumentData] = useState(null);

//   const {
//     documents,
//     addDocument,
//     updateDocument,
//     deleteDocument,
//     cloneDocument,
//   } = useDocuments();

//   const {
//     userFieldData,
//     updateFieldValue,
//     updateUserStatus,
//     deleteDocumentData,
//     getSubmittedApplicants,
//   } = useUserFieldData();

//   // Document Actions
//   const handleViewDocument = (doc) => {
//     setCurrentDocument(doc);
//     setView("preview");
//   };

//   const handleEditDocument = (doc) => {
//     setCurrentDocument(doc);
//     setView("editor");
//   };

//   const handleDeleteDocument = (docId) => {
//     if (window.confirm("Are you sure you want to delete this document?")) {
//       deleteDocument(docId);
//       deleteDocumentData(docId);
//       pdfBufferStore.delete(docId);
//     }
//   };

//   const handleCloneDocument = (doc) => {
//     cloneDocument(doc);
//   };

//   const handleShareDocument = (doc) => {
//     const userId = prompt("Enter user email/name to share with:");
//     if (!userId || !userId.trim()) return;

//     const existingData = userFieldData[doc.id]?.[userId];
//     if (existingData && Object.keys(existingData).length > 0) {
//       if (
//         !window.confirm(
//           "This user already has data for this document. Create new entry?"
//         )
//       ) {
//         return;
//       }
//     }

//     updateUserStatus(doc.id, userId, "pending", {
//       role: "applicant",
//       createdAt: new Date().toISOString(),
//     });

//     updateDocument(doc.id, {
//       sharedWith: [...(doc.sharedWith || []), userId],
//     });

//     alert(
//       `Document shared with ${userId}. They can now fill the applicant fields.`
//     );
//   };

//   const handleApplicantFill = (doc) => {
//     const userId = prompt("Enter your email/name:");
//     if (!userId || !userId.trim()) return;

//     const workflowApplicants =
//       doc.workflows?.map((w) => w.applicant?.trim()).filter(Boolean) || [];
//     const sharedUsers = doc.sharedWith || [];

//     const isAuthorized =
//       workflowApplicants.includes(userId.trim()) ||
//       sharedUsers.includes(userId.trim());

//     if (!isAuthorized) {
//       alert(
//         "Access denied. You are not authorized to fill this document.\n\n" +
//           "This document can only be filled by:\n" +
//           "- Applicants listed in the workflow\n" +
//           "- Users with whom the document has been shared"
//       );
//       return;
//     }

//     setCurrentUserId(userId);
//     setCurrentUserRole("applicant");
//     setCurrentDocument(doc);
//     setView("applicant-fill");
//   };

//   const handleApproverReview = (doc) => {
//     const approverId = prompt("Enter your approver email/name:");
//     if (!approverId || !approverId.trim()) return;

//     const hasWorkflows = doc.workflows && doc.workflows.length > 0;

//     if (hasWorkflows) {
//       const workflowApprovers = doc.workflows.flatMap(
//         (w) =>
//           w.approvers
//             ?.split(",")
//             .map((a) => a.trim())
//             .filter(Boolean) || []
//       );

//       const isAuthorized = workflowApprovers.includes(approverId.trim());

//       if (!isAuthorized) {
//         alert(
//           "Access denied. You are not listed as an approver for this document.\n\n" +
//             "Authorized approvers:\n" +
//             workflowApprovers.map((a) => `- ${a}`).join("\n")
//         );
//         return;
//       }
//     }

//     const applicants = getSubmittedApplicants(doc.id);

//     if (applicants.length === 0) {
//       alert("No applicants have submitted data for this document yet.");
//       return;
//     }

//     setCurrentUserId(approverId);
//     setCurrentUserRole("approver");
//     setSelectedApplicant(applicants[0]);
//     setCurrentDocument(doc);
//     setView("approver-review");
//   };

//   const handleDownloadDocument = async (doc, userId = null) => {
//     await downloadPDF(doc, userFieldData, userId);
//   };

//   // Applicant Actions
//   const handleSaveApplicantData = () => {
//     updateUserStatus(currentDocument.id, currentUserId, "submitted", {
//       submittedAt: new Date().toISOString(),
//     });
//     alert(
//       "Your data has been saved! The document is now ready for approver review."
//     );
//     setView("table");
//     setCurrentDocument(null);
//     setCurrentUserId("");
//     setCurrentUserRole("");
//   };

//   const handleUpdateApplicantField = (fieldId, value) => {
//     updateFieldValue(currentDocument.id, currentUserId, fieldId, value);
//   };

//   // Approver Actions
//   const handleApproverDecision = (decision, applicantId) => {
//     updateUserStatus(currentDocument.id, applicantId, decision, {
//       approver: currentUserId,
//       approvedAt: new Date().toISOString(),
//     });
//     alert(`Application ${decision}!`);
//     setView("table");
//     setCurrentDocument(null);
//     setCurrentUserId("");
//     setCurrentUserRole("");
//   };

//   const handleUpdateApproverField = (fieldId, value, applicantId) => {
//     updateFieldValue(currentDocument.id, applicantId, fieldId, value);
//   };

//   // Editor Actions
//   const handleSaveFromEditor = (updatedDocument) => {
//     if (updatedDocument.id) {
//       updateDocument(updatedDocument.id, updatedDocument);
//     } else {
//       const newDoc = {
//         ...updatedDocument,
//         id: Date.now().toString(),
//         referenceId: `DOC-${Date.now()}`,
//         createdBy: `Current User_${Date.now()}`,
//         createdOn: new Date().toISOString(),
//         status: "active",
//       };
//       addDocument(newDoc);
//     }
//     setView("table");
//     setCurrentDocument(null);
//   };

//   // Drawer Actions
//   const handleFileProcess = async (file, pdfData = null, isDesign = false) => {
//     console.log("handleFileProcess called", { file, isDesign });

//     if (pdfData && pdfData.isBlankDocument) {
//       console.log("Setting blank document data");
//       setTempDocumentData(pdfData);
//       return;
//     }

//     if (!file) {
//       console.warn("No file provided");
//       return;
//     }

//     const fileType = file.name.split(".").pop().toLowerCase();

//     if (fileType !== "pdf") {
//       alert("Only PDF files are supported for upload.");
//       return;
//     }

//     try {
//       console.log("Processing PDF file...");
//       const processedData = await processPDF(file);

//       console.log("PDF processed successfully:", processedData);

//       setTempDocumentData(processedData);
//     } catch (error) {
//       console.error("Error processing file:", error);
//       alert("Failed to process PDF file. Please try again.");
//     }
//   };
//   // console.log("test", processedData);

//   const handleSaveFromDrawer = (documentForm, workflows) => {
//     console.log(
//       "Saving document from drawer, tempDocumentData:",
//       tempDocumentData
//     );

//     const newDoc = {
//       id: Date.now().toString(),
//       referenceId: `DOC-${Date.now()}`,
//       documentName: documentForm.documentName || "Untitled",
//       category: documentForm.category || "General",
//       type: documentForm.type || "Other",
//       description: documentForm.description || "",
//       toBeFilledBy: documentForm.toBeFilledBy || "applicant",
//       createdBy: `Current User_${Date.now()}`,
//       createdOn: new Date().toISOString(),
//       workflows: workflows || [],
//       arrayBuffer: null,
//       pages: tempDocumentData?.pages || [],
//       droppedFields: {},
//       status: "active",
//       isBlankDocument: tempDocumentData?.isBlankDocument || false,
//     };
//     console.log("temp", tempDocumentData);

//     // Store raw ArrayBuffer in in-memory store keyed by document id
//     if (tempDocumentData?.arrayBuffer) {
//       pdfBufferStore.set(newDoc.id, tempDocumentData.arrayBuffer);
//       console.log("pushpak vyas", pdfBufferStore);
//     }

//     console.log("New document object:", newDoc);

//     addDocument(newDoc);
//     setDrawerOpen(false);
//     setTempDocumentData(null);
//     setView("table");
//   };

//   return (
//     <div className="min-h-screen bg-gray-50">
//       {view === "table" && (
//         <DocumentTable
//           documents={documents}
//           onView={handleViewDocument}
//           onEdit={handleEditDocument}
//           onDelete={handleDeleteDocument}
//           onClone={handleCloneDocument}
//           onShare={handleShareDocument}
//           onApplicantFill={handleApplicantFill}
//           onApproverReview={handleApproverReview}
//           onDownload={handleDownloadDocument}
//           onAddNew={() => setDrawerOpen(true)}
//         />
//       )}

//       {view === "preview" && (
//         <DocumentPreview
//           document={currentDocument}
//           onBack={() => {
//             setView("table");
//             setCurrentDocument(null);
//           }}
//           onEdit={() => {
//             setView("editor");
//           }}
//         />
//       )}

//       {view === "editor" && (
//         <DocumentEditor
//           document={currentDocument}
//           onSave={handleSaveFromEditor}
//           onBack={() => {
//             setView("table");
//             setCurrentDocument(null);
//           }}
//         />
//       )}

//       {view === "applicant-fill" && (
//         <ApplicantFillView
//           document={currentDocument}
//           userId={currentUserId}
//           userFieldData={userFieldData[currentDocument?.id]?.[currentUserId]}
//           onUpdateField={handleUpdateApplicantField}
//           onSave={handleSaveApplicantData}
//           onBack={() => {
//             setView("table");
//             setCurrentDocument(null);
//             setCurrentUserId("");
//             setCurrentUserRole("");
//           }}
//         />
//       )}

//       {view === "approver-review" && (
//         <ApproverReviewView
//           document={currentDocument}
//           approverId={currentUserId}
//           selectedApplicant={selectedApplicant}
//           onSelectApplicant={setSelectedApplicant}
//           applicants={getSubmittedApplicants(currentDocument?.id)}
//           userFieldData={
//             userFieldData[currentDocument?.id]?.[selectedApplicant]
//           }
//           onUpdateField={handleUpdateApproverField}
//           onApprove={(applicantId) =>
//             handleApproverDecision("approved", applicantId)
//           }
//           onReject={(applicantId) =>
//             handleApproverDecision("rejected", applicantId)
//           }
//           onBack={() => {
//             setView("table");
//             setCurrentDocument(null);
//             setCurrentUserId("");
//             setCurrentUserRole("");
//             setSelectedApplicant("");
//           }}
//         />
//       )}

//       <DocumentDrawer
//         open={drawerOpen}
//         onClose={() => {
//           setDrawerOpen(false);
//           setTempDocumentData(null);
//         }}
//         onSave={handleSaveFromDrawer}
//         onFileProcess={handleFileProcess}
//       />
//     </div>
//   );
// };

// export default DocumentManagementSystem;
// src/pages/DocumentManagementSystem.jsx
import React, { useState } from "react";
import { DocumentTable } from "../components/document/DocumentTable";
import { DocumentPreview } from "../components/document/DocumentPreview";
import { DocumentEditor } from "../components/document/DocumentEditor";
import { ApplicantFillView } from "../components/workflow/ApplicantFillView";
import { ApproverReviewView } from "../components/workflow/ApproverReviewView";
import DocumentDrawer from "../components/drawer/DocumentDrawer";
import { pdfBufferStore } from "../utils/pdfBufferStore";
import { useUserFieldData } from "../hooks/useUserFieldData";

const DocumentManagementSystem = () => {
  const [view, setView] = useState("table");
  const [currentDocument, setCurrentDocument] = useState(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [currentUserId, setCurrentUserId] = useState("");
  const [currentUserRole, setCurrentUserRole] = useState("");
  const [selectedApplicant, setSelectedApplicant] = useState("");
  const [tempDocumentData, setTempDocumentData] = useState(null);

  const [documents, setDocuments] = useState([]);

  const {
    userFieldData,
    updateFieldValue,
    updateUserStatus,
    deleteDocumentData,
    getSubmittedApplicants,
  } = useUserFieldData();

  const addDocument = (doc) => setDocuments((prev) => [doc, ...prev]);
  const updateDocument = (id, updated) =>
    setDocuments((prev) =>
      prev.map((d) => (d.id === id ? { ...d, ...updated } : d))
    );
  const deleteDocumentLocal = (id) =>
    setDocuments((prev) => prev.filter((d) => d.id !== id));

  const handleFileProcess = (file, pdfData = null) => {
    // Called by drawer. pdfData already contains tempId when file was processed
    if (pdfData && pdfData.isBlankDocument) {
      setTempDocumentData(pdfData);
      return;
    }

    if (!file && !pdfData) return;

    // pdfData should be returned from DocumentDrawer after processPDF
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
      arrayBuffer: tempDocumentData?.arrayBuffer || null, // optional store on doc
      pages: tempDocumentData?.pages || [],
      droppedFields: {},
      status: "active",
      isBlankDocument: tempDocumentData?.isBlankDocument || false,
    };

    // If tempDocumentData had no arrayBuffer but pdfBufferStore has one under tempId, ensure it's available
    if (!newDoc.arrayBuffer && tempDocumentData?.tempId) {
      const stored = pdfBufferStore.get(tempDocumentData.tempId);
      if (stored) {
        // store arrayBuffer on doc object too (useful for recovery)
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
    cloneDocument(doc);
  };
  const handleDownloadDocument = async (doc, userId = null) => {
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
    pdfBufferStore.delete(docId);
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
        onClose={() => setDrawerOpen(false)}
        onSave={handleSaveFromDrawer}
        onFileProcess={handleFileProcess}
      />
    </div>
  );
};

export default DocumentManagementSystem;
