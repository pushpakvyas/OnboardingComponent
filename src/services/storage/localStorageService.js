const STORAGE_KEYS = {
  DOCUMENTS: "documentManagementData",
  USER_FIELD_DATA: "userFieldData",
};

export const localStorageService = {
  // Documents
  getDocuments: () => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.DOCUMENTS);
      if (!saved) return [];
      const data = JSON.parse(saved);
      return Array.isArray(data.documents) ? data.documents : [];
    } catch (err) {
      console.error("Error loading documents:", err);
      return [];
    }
  },

  saveDocuments: (documents) => {
    try {
      const data = {
        documents,
        // lastUpdated: new Date().toISOString(),
      };
      localStorage.setItem(STORAGE_KEYS.DOCUMENTS, JSON.stringify(data));
      return { success: true };
    } catch (err) {
      console.error("Error saving documents:", err);
      return { success: false, error: err.message };
    }
  },

  // User Field Data
  getUserFieldData: () => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.USER_FIELD_DATA);
      return saved ? JSON.parse(saved) : {};
    } catch (err) {
      console.error("Error loading user field data:", err);
      return {};
    }
  },

  saveUserFieldData: (data) => {
    try {
      localStorage.setItem(STORAGE_KEYS.USER_FIELD_DATA, JSON.stringify(data));
      return { success: true };
    } catch (err) {
      console.error("Error saving user field data:", err);
      return { success: false, error: err.message };
    }
  },

  clearAll: () => {
    try {
      localStorage.removeItem(STORAGE_KEYS.DOCUMENTS);
      localStorage.removeItem(STORAGE_KEYS.USER_FIELD_DATA);
      return { success: true };
    } catch (err) {
      return { success: false, error: err.message };
    }
  },
};
