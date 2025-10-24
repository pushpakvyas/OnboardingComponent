export const STANDARD_FIELDS = [
  { id: "demo-text-1", type: "text", label: "Text Field", icon: "✏️" },
  {
    id: "demo-text-2",
    type: "signature",
    label: "Signature Field",
    icon: "✍️",
  },
  { id: "demo-text-3", type: "name", label: "Name Field", icon: "👤" },
  { id: "demo-text-4", type: "date", label: "Date Field", icon: "📅" },
  { id: "demo-text-5", type: "checkbox", label: "Checkbox Field", icon: "☑️" },
  { id: "demo-text-6", type: "email", label: "Email Field", icon: "✉️" },
  { id: "demo-text-7", type: "phone", label: "Phone Field", icon: "📞" },
  { id: "demo-select-1", type: "select", label: "Dropdown", icon: "▾" },
  { id: "demo-image-1", type: "image", label: "Image Field", icon: "🖼️" },
];

export const FIELD_DEFAULTS = {
  width: 200,
  fontSize: 14,
  fontColor: "#000000",
  fontFamily: "Arial",
  showLabel: false,
  labelPosition: "top",
  role: "applicant",
  required: false,
};

export const FIELD_TYPE_CONFIG = {
  text: { placeholder: "Text input", height: 30 },
  name: { placeholder: "Name", height: 30 },
  email: { placeholder: "Email address", height: 30 },
  phone: { placeholder: "Phone number", height: 30 },
  date: { placeholder: "DD/MM/YYYY", height: 30 },
  signature: { placeholder: "Signature", height: 30, fontFamily: "cursive" },
  checkbox: { width: 20, height: 20 },
  select: {
    placeholder: "Select...",
    height: 30,
    options: ["Option 1", "Option 2"],
  },
  image: { width: 150, height: 100, placeholder: "No image" },
};
