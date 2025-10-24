export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:3000/api";

export const API_ENDPOINTS = {
  DOCUMENTS: {
    LIST: "/documents",
    GET: (id) => `/documents/${id}`,
    CREATE: "/documents",
    UPDATE: (id) => `/documents/${id}`,
    DELETE: (id) => `/documents/${id}`,
  },
  USER_DATA: {
    GET: (docId, userId) => `/documents/${docId}/users/${userId}`,
    UPDATE: (docId, userId) => `/documents/${docId}/users/${userId}`,
  },
  UPLOAD: {
    PROCESS: "/upload/process",
  },
};
