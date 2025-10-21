// Service to handle localStorage operations for documents

const STORAGE_KEY = "documentManagementData";

export const loadDocuments = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const data = JSON.parse(raw);
    return Array.isArray(data.documents) ? data.documents : [];
  } catch (error) {
    console.error("Error loading documents from localStorage", error);
    return [];
  }
};

export const saveDocuments = (documents) => {
  try {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ documents, lastUpdated: new Date().toISOString() })
    );
  } catch (error) {
    console.error("Error saving documents to localStorage", error);
  }
};
