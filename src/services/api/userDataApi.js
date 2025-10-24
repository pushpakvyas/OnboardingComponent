import { apiClient } from "./apiClient";
import { API_ENDPOINTS } from "../../constants/apiEndpoints";

export const userDataApi = {
  get: async (docId, userId) => {
    return await apiClient.get(API_ENDPOINTS.USER_DATA.GET(docId, userId));
  },

  update: async (docId, userId, data) => {
    return await apiClient.put(
      API_ENDPOINTS.USER_DATA.UPDATE(docId, userId),
      data
    );
  },
};
