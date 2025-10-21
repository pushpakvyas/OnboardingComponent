// Constants for document management

export const A4_WIDTH = 816;
export const A4_HEIGHT = 1056;

export const STANDARD_FIELDS = [
  { id: "text", type: "text", label: "Text Field", icon: "✏️" },
  { id: "signature", type: "signature", label: "Signature Field", icon: "✍️" },
  { id: "name", type: "name", label: "Name Field", icon: "👤" },
  { id: "date", type: "date", label: "Date Field", icon: "📅" },
  { id: "checkbox", type: "checkbox", label: "Checkbox Field", icon: "☑️" },
  { id: "email", type: "email", label: "Email Field", icon: "✉️" },
  { id: "phone", type: "phone", label: "Phone Field", icon: "📞" },
  { id: "select", type: "select", label: "Dropdown", icon: "▾" },
  { id: "image", type: "image", label: "Image Field", icon: "🖼️" },
];

export const DOCUMENT_CATEGORIES = [
  "Legal",
  "Financial",
  "HR",
  "Compliance",
  "General",
];

export const DOCUMENT_TYPES = [
  "Contract",
  "Agreement",
  "Form",
  "Report",
  "Other",
];
