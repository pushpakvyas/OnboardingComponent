// src/services/dataService.js
import { pdfBufferStore } from "../utils/pdfBufferStore";

const BACKEND = false;

const localStorageAdapter = {
  DOCUMENTS_KEY: "documentManagementData",
  USER_DATA_KEY: "userFieldData",

  getDocuments: async () => {
    try {
      const saved = localStorage.getItem(localStorageAdapter.DOCUMENTS_KEY);
      if (!saved) return [];
      const data = JSON.parse(saved);
      
      // Restore buffers to pdfBufferStore
      const restored = data.documents.map((doc) => {
        if (doc.bufferBytes && Array.isArray(doc.bufferBytes)) {
          const buffer = new Uint8Array(doc.bufferBytes).buffer;
          pdfBufferStore.set(doc.id, buffer);
          // Keep arrayBuffer in document object for compatibility
          doc.arrayBuffer = buffer;
        }
        return doc;
      });

      console.log('📁 Loaded documents:', restored.length);
      console.log('🗂️ Buffer store has keys:', Array.from(pdfBufferStore.keys()));
      
      return restored;
    } catch (err) {
      console.error("Error loading documents:", err);
      return [];
    }
  },

  saveDocuments: async (documents) => {
    try {
      // Convert ArrayBuffers to arrays for storage
      const safeDocs = documents.map((doc) => {
        const safeDoc = { ...doc };
        
        // Check if buffer exists in pdfBufferStore
        const buffer = pdfBufferStore.get(doc.id);
        
        if (buffer instanceof ArrayBuffer && buffer.byteLength > 0) {
          safeDoc.bufferBytes = Array.from(new Uint8Array(buffer));
          console.log(`💾 Saving buffer for doc ${doc.id}: ${buffer.byteLength} bytes`);
        } else if (doc.arrayBuffer instanceof ArrayBuffer && doc.arrayBuffer.byteLength > 0) {
          // Fallback to doc.arrayBuffer if not in store
          safeDoc.bufferBytes = Array.from(new Uint8Array(doc.arrayBuffer));
          pdfBufferStore.set(doc.id, doc.arrayBuffer); // Store it
          console.log(`💾 Saving buffer from doc.arrayBuffer ${doc.id}: ${doc.arrayBuffer.byteLength} bytes`);
        }
        
        // Remove arrayBuffer to avoid storage issues
        delete safeDoc.arrayBuffer;
        
        return safeDoc;
      });

      const dataToSave = {
        documents: safeDocs,
        lastUpdated: new Date().toISOString()
      };

      localStorage.setItem(
        localStorageAdapter.DOCUMENTS_KEY,
        JSON.stringify(dataToSave)
      );
      
      console.log('✅ Saved documents to localStorage');
      return { success: true };
    } catch (err) {
      console.error("Error saving documents:", err);
      throw err;
    }
  },

  getUserFieldData: async () => {
    try {
      const saved = localStorage.getItem(localStorageAdapter.USER_DATA_KEY);
      const data = saved ? JSON.parse(saved) : {};
      console.log('📋 Loaded user field data:', Object.keys(data).length, 'documents');
      return data;
    } catch (err) {
      console.error("Error loading user field data:", err);
      return {};
    }
  },

  saveUserFieldData: async (data) => {
    try {
      localStorage.setItem(
        localStorageAdapter.USER_DATA_KEY,
        JSON.stringify(data)
      );
      console.log('✅ Saved user field data');
      return { success: true };
    } catch (err) {
      console.error("Error saving user field data:", err);
      throw err;
    }
  },

  deleteDocument: async (id) => {
    const documents = await localStorageAdapter.getDocuments();
    const filtered = documents.filter((doc) => doc.id !== id);
    
    // Remove from buffer store
    pdfBufferStore.delete(id);
    
    await localStorageAdapter.saveDocuments(filtered);
    return { success: true };
  },

  updateDocument: async (id, updates) => {
    const documents = await localStorageAdapter.getDocuments();
    
    // If updates contain arrayBuffer, store it
    if (updates.arrayBuffer instanceof ArrayBuffer) {
      pdfBufferStore.set(id, updates.arrayBuffer);
    }
    
    const updated = documents.map((doc) =>
      doc.id === id ? { ...doc, ...updates } : doc
    );
    
    await localStorageAdapter.saveDocuments(updated);
    return { success: true };
  },

  addDocument: async (document) => {
    const documents = await localStorageAdapter.getDocuments();
    
    // Store buffer if present
    if (document.arrayBuffer instanceof ArrayBuffer) {
      pdfBufferStore.set(document.id, document.arrayBuffer);
    }
    
    await localStorageAdapter.saveDocuments([...documents, document]);
    return { success: true, document };
  },

  clearAll: async () => {
    try {
      localStorage.removeItem(localStorageAdapter.DOCUMENTS_KEY);
      localStorage.removeItem(localStorageAdapter.USER_DATA_KEY);
      
      // Clear buffer store
      pdfBufferStore.clear();
      
      return { success: true };
    } catch (err) {
      return { success: false, error: err.message };
    }
  },
};

const apiAdapter = {
  baseURL: "http://localhost:3000/api",

  request: async (endpoint, options = {}) => {
    const url = `${apiAdapter.baseURL}${endpoint}`;
    const config = {
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
      ...options,
    };

    try {
      const response = await fetch(url, config);
      if (!response.ok) {
        throw new Error(`API Error: ${response.status} ${response.statusText}`);
      }
      return await response.json();
    } catch (error) {
      console.error("API Request failed:", error);
      throw error;
    }
  },

  getDocuments: async () => {
    return await apiAdapter.request("/documents");
  },

  saveDocuments: async (documents) => {
    return await apiAdapter.request("/documents/batch", {
      method: "POST",
      body: JSON.stringify({ documents }),
    });
  },

  getUserFieldData: async () => {
    return await apiAdapter.request("/user-field-data");
  },

  saveUserFieldData: async (data) => {
    return await apiAdapter.request("/user-field-data", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  deleteDocument: async (id) => {
    return await apiAdapter.request(`/documents/${id}`, {
      method: "DELETE",
    });
  },

  updateDocument: async (id, updates) => {
    if (updates.arrayBuffer instanceof ArrayBuffer) {
      updates = {
        ...updates,
        bufferBytes: Array.from(new Uint8Array(updates.arrayBuffer)),
        arrayBuffer: undefined,
      };
    }

    return await apiAdapter.request(`/documents/${id}`, {
      method: "PUT",
      body: JSON.stringify(updates),
    });
  },

  addDocument: async (document) => {
    return await apiAdapter.request("/documents", {
      method: "POST",
      body: JSON.stringify(document),
    });
  },

  clearAll: async () => {
    return await apiAdapter.request("/clear-all", {
      method: "DELETE",
    });
  },
};

export const dataService = {
  getDocuments: async () => {
    return BACKEND
      ? await apiAdapter.getDocuments()
      : await localStorageAdapter.getDocuments();
  },

  saveDocuments: async (documents) => {
    return BACKEND
      ? await apiAdapter.saveDocuments(documents)
      : await localStorageAdapter.saveDocuments(documents);
  },

  getUserFieldData: async () => {
    return BACKEND
      ? await apiAdapter.getUserFieldData()
      : await localStorageAdapter.getUserFieldData();
  },

  saveUserFieldData: async (data) => {
    return BACKEND
      ? await apiAdapter.saveUserFieldData(data)
      : await localStorageAdapter.saveUserFieldData(data);
  },

  deleteDocument: async (id) => {
    return BACKEND
      ? await apiAdapter.deleteDocument(id)
      : await localStorageAdapter.deleteDocument(id);
  },

  updateDocument: async (id, updates) => {
    return BACKEND
      ? await apiAdapter.updateDocument(id, updates)
      : await localStorageAdapter.updateDocument(id, updates);
  },

  addDocument: async (document) => {
    return BACKEND
      ? await apiAdapter.addDocument(document)
      : await localStorageAdapter.addDocument(document);
  },

  clearAll: async () => {
    return BACKEND
      ? await apiAdapter.clearAll()
      : await localStorageAdapter.clearAll();
  },
};

export { localStorageAdapter, apiAdapter, BACKEND };

