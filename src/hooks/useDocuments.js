import { useState, useEffect } from "react";

const STORAGE_KEY = "documentManagementData";

export const useDocuments = () => {
  const [documents, setDocuments] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (!saved) return [];
      const data = JSON.parse(saved);
      return Array.isArray(data.documents) ? data.documents : [];
    } catch (err) {
      console.error("Error parsing saved documents:", err);
      return [];
    }
  });

  useEffect(() => {
    const data = {
      documents,
      // lastUpdated: new Date().toISOString(),
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  }, [documents]);

  const addDocument = (document) => {
    setDocuments((prev) => [...prev, document]);
    return document;
  };

  const updateDocument = (id, updates) => {
    setDocuments((prev) =>
      prev.map((doc) => (doc.id === id ? { ...doc, ...updates } : doc))
    );
  };

  const deleteDocument = (id) => {
    setDocuments((prev) => prev.filter((doc) => doc.id !== id));
  };

  const cloneDocument = (doc) => {
    const clonedDoc = {
      ...doc,
      id: Date.now().toString(),
      referenceId: `DOC-${Date.now()}`,
      documentName: `${doc.documentName} (Copy)`,
      createdOn: new Date().toISOString(),
    };
    addDocument(clonedDoc);
    return clonedDoc;
  };

  const toggleArchive = (id) => {
    setDocuments((prev) =>
      prev.map((doc) =>
        doc.id === id
          ? {
              ...doc,
              status: doc.status === "archived" ? "active" : "archived",
            }
          : doc
      )
    );
  };

  const getDocumentById = (id) => {
    return documents.find((doc) => doc.id === id);
  };

  return {
    documents,
    addDocument,
    updateDocument,
    deleteDocument,
    cloneDocument,
    toggleArchive,
    getDocumentById,
  };
};
