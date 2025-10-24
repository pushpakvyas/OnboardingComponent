import React from "react";
import {
  DOCUMENT_CATEGORIES,
  DOCUMENT_TYPES,
} from "../../constants/documentConstants";

export const DrawerDetailsStep = ({ documentForm, setDocumentForm }) => {
  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2">
          To Be Filled By *
        </label>
        <div className="flex gap-4">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              name="toBeFilledBy"
              value="applicant"
              checked={documentForm.toBeFilledBy === "applicant"}
              onChange={(e) =>
                setDocumentForm({
                  ...documentForm,
                  toBeFilledBy: e.target.value,
                })
              }
              className="w-4 h-4"
            />
            <span className="text-sm">Applicant</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              name="toBeFilledBy"
              value="vendor"
              checked={documentForm.toBeFilledBy === "vendor"}
              onChange={(e) =>
                setDocumentForm({
                  ...documentForm,
                  toBeFilledBy: e.target.value,
                })
              }
              className="w-4 h-4"
            />
            <span className="text-sm">Vendor</span>
          </label>
        </div>
      </div>

      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2">
          Document Name *
        </label>
        <input
          type="text"
          value={documentForm.documentName}
          onChange={(e) =>
            setDocumentForm({
              ...documentForm,
              documentName: e.target.value,
            })
          }
          className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder="Enter document name"
        />
      </div>

      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2">
          Document Category *
        </label>
        <select
          value={documentForm.category}
          onChange={(e) =>
            setDocumentForm({
              ...documentForm,
              category: e.target.value,
            })
          }
          className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="">Select category</option>
          {DOCUMENT_CATEGORIES.map((cat) => (
            <option key={cat} value={cat}>
              {cat}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2">
          Document Type *
        </label>
        <select
          value={documentForm.type}
          onChange={(e) =>
            setDocumentForm({
              ...documentForm,
              type: e.target.value,
            })
          }
          className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="">Select type</option>
          {DOCUMENT_TYPES.map((type) => (
            <option key={type} value={type}>
              {type}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2">
          Description
        </label>
        <textarea
          value={documentForm.description}
          onChange={(e) =>
            setDocumentForm({
              ...documentForm,
              description: e.target.value,
            })
          }
          className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          rows="4"
          placeholder="Enter description (optional)"
        />
      </div>
    </div>
  );
};
