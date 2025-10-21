// Backend API calls for documents - currently commented for local storage use only

// const API_BASE_URL = "https://your-backend/api/documents";

/*
export const fetchDocuments = async () => {
  const response = await fetch(API_BASE_URL);
  if (!response.ok) throw new Error("Failed to fetch documents");
  return await response.json();
};

export const saveDocument = async (doc) => {
  const response = await fetch(API_BASE_URL + (doc.id ? `/${doc.id}` : ""), {
    method: doc.id ? "PUT" : "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(doc),
  });
  if (!response.ok) throw new Error("Failed to save document");
  return await response.json();
};

export const deleteDocument = async (id) => {
  const response = await fetch(API_BASE_URL + `/${id}`, { method: "DELETE" });
  if (!response.ok) throw new Error("Failed to delete document");
};
*/
