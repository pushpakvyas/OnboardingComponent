import { useState, useEffect } from "react";

const STORAGE_KEY = "userFieldData";

export const useUserFieldData = () => {
  const [userFieldData, setUserFieldData] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? JSON.parse(saved) : {};
    } catch (err) {
      console.error("Error parsing user field data:", err);
      return {};
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(userFieldData));
    } catch (err) {
      console.error("Error saving user field data:", err);
    }
  }, [userFieldData]);

  const updateFieldValue = (documentId, userId, fieldId, value) => {
    setUserFieldData((prev) => ({
      ...prev,
      [documentId]: {
        ...prev[documentId],
        [userId]: {
          ...prev[documentId]?.[userId],
          [fieldId]: value,
        },
      },
    }));
  };

  const updateUserStatus = (
    documentId,
    userId,
    status,
    additionalData = {}
  ) => {
    setUserFieldData((prev) => ({
      ...prev,
      [documentId]: {
        ...prev[documentId],
        [userId]: {
          ...prev[documentId]?.[userId],
          status,
          ...additionalData,
        },
      },
    }));
  };

  const getUserData = (documentId, userId) => {
    return userFieldData[documentId]?.[userId] || {};
  };

  const getFieldValue = (documentId, userId, fieldId) => {
    return userFieldData[documentId]?.[userId]?.[fieldId];
  };

  const deleteDocumentData = (documentId) => {
    setUserFieldData((prev) => {
      const updated = { ...prev };
      delete updated[documentId];
      return updated;
    });
  };

  const getSubmittedApplicants = (documentId) => {
    return Object.keys(userFieldData[documentId] || {}).filter(
      (userId) => userFieldData[documentId][userId].status === "submitted"
    );
  };

  return {
    userFieldData,
    updateFieldValue,
    updateUserStatus,
    getUserData,
    getFieldValue,
    deleteDocumentData,
    getSubmittedApplicants,
  };
};
