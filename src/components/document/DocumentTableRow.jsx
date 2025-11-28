import React from "react";
import {
  Eye,
  Edit2,
  Edit3,
  Download,
  Copy,
  Trash2,
  Send,
  CheckCircle,
  UserPlus,
  Settings,
} from "lucide-react";

export const DocumentTableRow = ({
  doc,
  index,
  onView,
  onEdit,
  onDelete,
  onClone,
  onShare,
  onApplicantFill,
  onApproverReview,
  onInitiatorFill,
  onDownload,
  onConfigApprovers,
}) => {
  return (
    <tr
      className={`border-b hover:bg-gray-50 ${
        index % 2 === 0 ? "bg-white" : "bg-gray-50"
      }`}
    >
      <td className="px-4 py-3 text-sm">{doc.documentName}</td>
      <td className="px-4 py-3 text-sm">{doc.referenceId}</td>
      <td className="px-4 py-3 text-sm">{doc.category}</td>
      <td className="px-4 py-3 text-sm">{doc.type}</td>
      <td className="px-4 py-3 text-sm">{doc.createdBy}</td>
      <td className="px-4 py-3 text-sm">
        {doc.createdOn ? new Date(doc.createdOn).toLocaleDateString() : "-"}
      </td>
      <td className="px-4 py-3 text-sm">
        <div className="flex items-center gap-2">
          {/* View */}
          <button
            onClick={() => onView(doc)}
            className="p-1 hover:bg-gray-200 rounded transition"
            title="View"
          >
            <Eye className="w-4 h-4 text-blue-600" />
          </button>

          {/* Edit */}
          <button
            onClick={() => onEdit(doc)}
            className="p-1 hover:bg-gray-200 rounded transition"
            title="Edit"
          >
            <Edit2 className="w-4 h-4 text-green-600" />
          </button>
          <button
            onClick={() => onInitiatorFill(doc)}
            className="p-1 hover:bg-gray-200 rounded transition"
            title="Fill as Initiator"
          >
            <UserPlus className="w-4 h-4 text-teal-600" />
          </button>

          <button
            onClick={() => onConfigApprovers(doc)}
            className="p-1 hover:bg-yellow-200 rounded transition"
            title="Configure Approvers"
          >
            <Settings className="w-4 h-4 text-yellow-700" />
          </button>

          {/* Share with Applicant */}
          <button
            onClick={() => onShare(doc)}
            className="p-1 hover:bg-gray-200 rounded transition"
            title="Share with Applicant"
          >
            <Send className="w-4 h-4 text-indigo-600" />
          </button>

          {/* Fill as Applicant */}
          <button
            onClick={() => onApplicantFill(doc)}
            className="p-1 hover:bg-gray-200 rounded transition"
            title="Fill as Applicant"
          >
            <Edit3 className="w-4 h-4 text-orange-600" />
          </button>

          {/* Review as Approver */}
          <button
            onClick={() => onApproverReview(doc)}
            className="p-1 hover:bg-gray-200 rounded transition"
            title="Review as Approver"
          >
            <CheckCircle className="w-4 h-4 text-purple-600" />
          </button>

          {/* NEW: Fill as Initiator */}

          {/* Download */}
          <button
            onClick={() => onDownload(doc)}
            className="p-1 hover:bg-gray-200 rounded transition"
            title="Download"
          >
            <Download className="w-4 h-4 text-purple-600" />
          </button>

          {/* Clone */}
          <button
            onClick={() => onClone(doc)}
            className="p-1 hover:bg-gray-200 rounded transition"
            title="Clone"
          >
            <Copy className="w-4 h-4 text-indigo-600" />
          </button>

          {/* Delete */}
          <button
            onClick={() => onDelete(doc.id)}
            className="p-1 hover:bg-gray-200 rounded transition"
            title="Delete"
          >
            <Trash2 className="w-4 h-4 text-red-600" />
          </button>
        </div>
      </td>
    </tr>
  );
};
