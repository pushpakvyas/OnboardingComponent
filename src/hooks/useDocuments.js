import { useState, useEffect } from "react";
import * as storage from "../services/localStorageService";
// import * as api from "../services/documentApi"; // Uncomment to use backend api

export const useDocuments = () => {
  const [documents, setDocuments] = useState([]);

  useEffect(() => {
    // Load documents from localStorage on mount
    const docs = storage.loadDocuments();
    setDocuments(docs);

    // Optionally load from backend API and sync
    /*
    api.fetchDocuments()
      .then(fetchedDocs => {
        setDocuments(fetchedDocs);
        storage.saveDocuments(fetchedDocs); // sync local storage
      })
      .catch(console.error);
    */
  }, []);

  const saveDocs = (newDocs) => {
    setDocuments(newDocs);
    storage.saveDocuments(newDocs);
    // Optionally sync with backend
    /*
    newDocs.forEach(doc => {
      api.saveDocument(doc).catch(console.error);
    });
    */
  };

  const addOrUpdateDocument = (doc) => {
    setDocuments((prev) => {
      const index = prev.findIndex((d) => d.id === doc.id);
      let newDocs;
      if (index >= 0) {
        newDocs = [...prev];
        newDocs[index] = doc;
      } else {
        newDocs = [...prev, doc];
      }
      saveDocs(newDocs);
      return newDocs;
    });
  };

  const deleteDocument = (id) => {
    setDocuments((prev) => {
      const newDocs = prev.filter((d) => d.id !== id);
      saveDocs(newDocs);
      // Optionally delete from backend
      /*
      api.deleteDocument(id).catch(console.error);
      */
      return newDocs;
    });
  };

  return {
    documents,
    addOrUpdateDocument,
    deleteDocument,
    setDocuments,
  };
};
