import { apiClient } from "./apiClient";
import { API_ENDPOINTS } from "../../constants/apiEndpoints";

export const documentApi = {
  getAll: async () => {
    return await apiClient.get(API_ENDPOINTS.DOCUMENTS.LIST);
  },

  getById: async (id) => {
    return await apiClient.get(API_ENDPOINTS.DOCUMENTS.GET(id));
  },

  create: async (document) => {
    return await apiClient.post(API_ENDPOINTS.DOCUMENTS.CREATE, document);
  },

  update: async (id, document) => {
    return await apiClient.put(API_ENDPOINTS.DOCUMENTS.UPDATE(id), document);
  },

  delete: async (id) => {
    return await apiClient.delete(API_ENDPOINTS.DOCUMENTS.DELETE(id));
  },
};
