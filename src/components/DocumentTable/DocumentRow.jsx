import React from "react";

const DocumentRow = ({ doc, onView, onEdit, onDelete, onClone }) => {
  return (
    <tr>
      <td>{doc.documentName}</td>
      <td>{doc.referenceId}</td>
      <td>{doc.category}</td>
      <td>{doc.type}</td>
      <td>{doc.createdBy}</td>
      <td>{new Date(doc.createdOn).toLocaleDateString()}</td>
      <td>
        <button onClick={() => onView(doc)}>View</button>
        <button onClick={() => onEdit(doc)}>Edit</button>
        <button onClick={() => onClone(doc)}>Clone</button>
        <button onClick={() => onDelete(doc.id)}>Delete</button>
      </td>
    </tr>
  );
};

export default DocumentRow;
