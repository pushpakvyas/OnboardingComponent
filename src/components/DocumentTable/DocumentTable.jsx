import React, { useState } from "react";
import DocumentFilters from "./DocumentFilters";
import DocumentRow from "./DocumentRow";
import { DOCUMENT_CATEGORIES, DOCUMENT_TYPES } from "../../utils/constants";

const DocumentTable = ({
  documents,
  onView,
  onEdit,
  onDelete,
  onClone,
  rowsPerPageOptions = [25, 50, 100],
}) => {
  const [filters, setFilters] = useState({
    documentName: "",
    referenceId: "",
    category: "",
    type: "",
    createdBy: "",
  });
  const [rowsPerPage, setRowsPerPage] = useState(rowsPerPageOptions[0]);
  const [currentPage, setCurrentPage] = useState(1);

  const filteredDocuments = documents.filter((doc) => {
    return (
      (!filters.documentName ||
        doc.documentName
          .toLowerCase()
          .includes(filters.documentName.toLowerCase())) &&
      (!filters.referenceId ||
        doc.referenceId
          .toLowerCase()
          .includes(filters.referenceId.toLowerCase())) &&
      (!filters.category || doc.category === filters.category) &&
      (!filters.type || doc.type === filters.type) &&
      (!filters.createdBy ||
        doc.createdBy.toLowerCase().includes(filters.createdBy.toLowerCase()))
    );
  });

  const totalPages = Math.ceil(filteredDocuments.length / rowsPerPage);

  const paginatedDocuments = filteredDocuments.slice(
    (currentPage - 1) * rowsPerPage,
    currentPage * rowsPerPage
  );

  const handleRowsPerPageChange = (e) => {
    setRowsPerPage(Number(e.target.value));
    setCurrentPage(1);
  };

  return (
    <div>
      <DocumentFilters
        filters={filters}
        setFilters={setFilters}
        categories={DOCUMENT_CATEGORIES}
        types={DOCUMENT_TYPES}
      />
      <div>
        <label>Rows per page:</label>
        <select value={rowsPerPage} onChange={handleRowsPerPageChange}>
          {rowsPerPageOptions.map((r) => (
            <option key={r} value={r}>
              {r}
            </option>
          ))}
        </select>
      </div>
      <table>
        <thead>
          <tr>
            <th>Document Name</th>
            <th>Reference ID</th>
            <th>Category</th>
            <th>Type</th>
            <th>Created By</th>
            <th>Created On</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {paginatedDocuments.length === 0 && (
            <tr>
              <td colSpan="7" style={{ textAlign: "center" }}>
                No documents found.
              </td>
            </tr>
          )}
          {paginatedDocuments.map((doc) => (
            <DocumentRow
              key={doc.id}
              doc={doc}
              onView={onView}
              onEdit={onEdit}
              onDelete={onDelete}
              onClone={onClone}
            />
          ))}
        </tbody>
      </table>
      <div>
        <button
          disabled={currentPage <= 1}
          onClick={() => setCurrentPage((p) => p - 1)}
        >
          Previous
        </button>
        <span>
          Page {currentPage} of {totalPages || 1}
        </span>
        <button
          disabled={currentPage >= totalPages}
          onClick={() => setCurrentPage((p) => p + 1)}
        >
          Next
        </button>
      </div>
    </div>
  );
};

export default DocumentTable;
