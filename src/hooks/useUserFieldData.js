import { useState, useEffect } from "react";
import { dataService } from "../services/dataService";

export const useUserFieldData = () => {
  const [userFieldData, setUserFieldData] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Load user field data on mount
  useEffect(() => {
    const loadUserFieldData = async () => {
      try {
        setLoading(true);
        const data = await dataService.getUserFieldData();
        setUserFieldData(data);
        setError(null);
      } catch (err) {
        console.error("Error loading user field data:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    loadUserFieldData();
  }, []);

  // Save user field data whenever it changes
  useEffect(() => {
    if (!loading) {
      const saveUserFieldData = async () => {
        try {
          await dataService.saveUserFieldData(userFieldData);
        } catch (err) {
          console.error("Error saving user field data:", err);
          setError(err.message);
        }
      };
      saveUserFieldData();
    }
  }, [userFieldData, loading]);

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
    loading,
    error,
    updateFieldValue,
    updateUserStatus,
    getUserData,
    getFieldValue,
    deleteDocumentData,
    getSubmittedApplicants,
  };
};
