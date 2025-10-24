import React, { useState } from "react";
import { Plus } from "lucide-react";
import { DocumentTableRow } from "./DocumentTableRow";
import { DocumentFilters } from "./DocumentFilters";

export const DocumentTable = ({
  documents,
  onView,
  onEdit,
  onDelete,
  onClone,
  onShare,
  onApplicantFill,
  onApproverReview,
  onDownload,
  onAddNew,
}) => {
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    documentName: "",
    referenceId: "",
    category: "",
    type: "",
    createdBy: "",
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage] = useState(25);

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

  return (
    <div className="flex-1 flex flex-col p-6">
      <div className="flex items-center justify-end mb-4 gap-4">
        <button
          onClick={onAddNew}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
        >
          <Plus className="w-4 h-4" />
          Add New Document
        </button>
      </div>

      {showFilters && (
        <DocumentFilters filters={filters} setFilters={setFilters} />
      )}

      <div className="flex-1 bg-white border rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-100 border-b">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                  Document Name
                </th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                  Reference ID
                </th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                  Category
                </th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                  Type
                </th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                  Created By
                </th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                  Created On
                </th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {paginatedDocuments.map((doc, index) => (
                <DocumentTableRow
                  key={doc.id}
                  doc={doc}
                  index={index}
                  onView={onView}
                  onEdit={onEdit}
                  onDelete={onDelete}
                  onClone={onClone}
                  onShare={onShare}
                  onApplicantFill={onApplicantFill}
                  onApproverReview={onApproverReview}
                  onDownload={onDownload}
                />
              ))}
              {paginatedDocuments.length === 0 && (
                <tr>
                  <td
                    colSpan="7"
                    className="px-4 py-8 text-center text-gray-500"
                  >
                    No documents found. Click "Add New Document" to create one.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
