import { useState, useEffect } from "react";
import { dataService } from "../services/dataService";

export const useDocuments = () => {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Load documents on mount
  useEffect(() => {
    const loadDocuments = async () => {
      try {
        setLoading(true);
        const docs = await dataService.getDocuments();
        setDocuments(docs);
        setError(null);
      } catch (err) {
        console.error("Error loading documents:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    loadDocuments();
  }, []);

  // Save documents whenever they change
  useEffect(() => {
    if (!loading && documents.length >= 0) {
      const saveDocuments = async () => {
        try {
          await dataService.saveDocuments(documents);
        } catch (err) {
          console.error("Error saving documents:", err);
          setError(err.message);
        }
      };
      saveDocuments();
    }
  }, [documents, loading]);

  const addDocument = async (document) => {
    try {
      await dataService.addDocument(document);
      setDocuments((prev) => [...prev, document]);
      return document;
    } catch (err) {
      console.error("Error adding document:", err);
      setError(err.message);
      throw err;
    }
  };

  const updateDocument = async (id, updates) => {
    try {
      await dataService.updateDocument(id, updates);
      setDocuments((prev) =>
        prev.map((doc) => (doc.id === id ? { ...doc, ...updates } : doc))
      );
    } catch (err) {
      console.error("Error updating document:", err);
      setError(err.message);
      throw err;
    }
  };

  const deleteDocument = async (id) => {
    try {
      await dataService.deleteDocument(id);
      setDocuments((prev) => prev.filter((doc) => doc.id !== id));
    } catch (err) {
      console.error("Error deleting document:", err);
      setError(err.message);
      throw err;
    }
  };

  const cloneDocument = async (doc) => {
    const clonedDoc = {
      ...doc,
      id: Date.now().toString(),
      referenceId: `DOC-${Date.now()}`,
      documentName: `${doc.documentName} (Copy)`,
      createdOn: new Date().toISOString(),
    };
    await addDocument(clonedDoc);
    return clonedDoc;
  };

  const toggleArchive = async (id) => {
    const doc = documents.find((d) => d.id === id);
    if (doc) {
      const newStatus = doc.status === "archived" ? "active" : "archived";
      await updateDocument(id, { status: newStatus });
    }
  };

  const getDocumentById = (id) => {
    return documents.find((doc) => doc.id === id);
  };

  return {
    documents,
    loading,
    error,
    addDocument,
    updateDocument,
    deleteDocument,
    cloneDocument,
    toggleArchive,
    getDocumentById,
  };
};
