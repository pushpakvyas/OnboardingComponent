import React from "react";
import { motion } from "framer-motion";
import {
  DOCUMENT_CATEGORIES,
  DOCUMENT_TYPES,
} from "../../constants/documentConstants";

export const DocumentFilters = ({ filters, setFilters }) => {
  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: "auto" }}
      exit={{ opacity: 0, height: 0 }}
      className="bg-white border rounded-lg p-4 mb-4 grid grid-cols-5 gap-4"
    >
      <input
        type="text"
        placeholder="Document Name"
        value={filters.documentName}
        onChange={(e) =>
          setFilters({ ...filters, documentName: e.target.value })
        }
        className="border rounded px-3 py-2 text-sm"
      />
      <input
        type="text"
        placeholder="Reference ID"
        value={filters.referenceId}
        onChange={(e) =>
          setFilters({ ...filters, referenceId: e.target.value })
        }
        className="border rounded px-3 py-2 text-sm"
      />
      <select
        value={filters.category}
        onChange={(e) => setFilters({ ...filters, category: e.target.value })}
        className="border rounded px-3 py-2 text-sm"
      >
        <option value="">All Categories</option>
        {DOCUMENT_CATEGORIES.map((cat) => (
          <option key={cat} value={cat}>
            {cat}
          </option>
        ))}
      </select>
      <select
        value={filters.type}
        onChange={(e) => setFilters({ ...filters, type: e.target.value })}
        className="border rounded px-3 py-2 text-sm"
      >
        <option value="">All Types</option>
        {DOCUMENT_TYPES.map((type) => (
          <option key={type} value={type}>
            {type}
          </option>
        ))}
      </select>
      <input
        type="text"
        placeholder="Created By"
        value={filters.createdBy}
        onChange={(e) => setFilters({ ...filters, createdBy: e.target.value })}
        className="border rounded px-3 py-2 text-sm"
      />
    </motion.div>
  );
};
