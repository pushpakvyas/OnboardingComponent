import React from "react";

const DocumentFilters = ({ filters, setFilters, categories, types }) => {
  return (
    <div
      style={{
        display: "flex",
        gap: "10px",
        flexWrap: "wrap",
        marginBottom: 10,
      }}
    >
      <input
        type="text"
        placeholder="Document Name"
        value={filters.documentName}
        onChange={(e) =>
          setFilters((f) => ({ ...f, documentName: e.target.value }))
        }
      />
      <input
        type="text"
        placeholder="Reference ID"
        value={filters.referenceId}
        onChange={(e) =>
          setFilters((f) => ({ ...f, referenceId: e.target.value }))
        }
      />
      <select
        value={filters.category}
        onChange={(e) =>
          setFilters((f) => ({ ...f, category: e.target.value }))
        }
      >
        <option value="">All Categories</option>
        {categories.map((cat) => (
          <option key={cat} value={cat}>
            {cat}
          </option>
        ))}
      </select>
      <select
        value={filters.type}
        onChange={(e) => setFilters((f) => ({ ...f, type: e.target.value }))}
      >
        <option value="">All Types</option>
        {types.map((type) => (
          <option key={type} value={type}>
            {type}
          </option>
        ))}
      </select>
      <input
        type="text"
        placeholder="Created By"
        value={filters.createdBy}
        onChange={(e) =>
          setFilters((f) => ({ ...f, createdBy: e.target.value }))
        }
      />
    </div>
  );
};

export default DocumentFilters;
