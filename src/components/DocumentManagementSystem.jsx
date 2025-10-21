import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import mammoth from "mammoth";
import { PDFDocument } from "pdf-lib";
import {
  Eye,
  Edit2,
  Download,
  Copy,
  Archive,
  Trash2,
  Filter,
  Plus,
  X,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

const DPI = 300;
const A4_WIDTH = Math.round(8.27 * DPI); // ~2480
const A4_HEIGHT = Math.round(11.69 * DPI); // ~3508

const STANDARD_FIELDS = [
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

const DOCUMENT_CATEGORIES = [
  "Legal",
  "Financial",
  "HR",
  "Compliance",
  "General",
];
const DOCUMENT_TYPES = ["Contract", "Agreement", "Form", "Report", "Other"];

const DocumentManagementSystem = () => {
  // Main state
  const [view, setView] = useState("table"); // table, editor, preview

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerStep, setDrawerStep] = useState("initial"); // initial, upload, workflow, editor

  // Table state
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(25);
  const [filters, setFilters] = useState({
    documentName: "",
    referenceId: "",
    category: "",
    type: "",
    createdBy: "",
  });
  const [showFilters, setShowFilters] = useState(false);

  // Document state
  const [currentDocument, setCurrentDocument] = useState(null);
  const [documentForm, setDocumentForm] = useState({
    toBeFilledBy: "applicant",
    documentName: "",
    category: "",
    type: "",
    description: "",
  });

  // Workflow state
  const [workflows, setWorkflows] = useState([
    { initiator: "", applicant: "", approvers: "" },
  ]);

  // Editor state
  const [pages, setPages] = useState([]);
  const [currentPageNum, setCurrentPageNum] = useState(1);
  const [droppedFields, setDroppedFields] = useState({});
  const [selectedField, setSelectedField] = useState(null);
  const [draggedFieldType, setDraggedFieldType] = useState(null);
  const [isDraggingExistingField, setIsDraggingExistingField] = useState(false);
  const [draggedExistingField, setDraggedExistingField] = useState(null);

  const fileInputRef = useRef(null);
  const previewRef = useRef(null);

  /// Load documents from localStorage on startup
  const [documents, setDocuments] = useState(() => {
    try {
      const saved = localStorage.getItem("documentManagementData");
      if (!saved) return [];
      const data = JSON.parse(saved);
      return Array.isArray(data.documents) ? data.documents : [];
    } catch (err) {
      console.error("Error parsing saved documents:", err);
      return [];
    }
  });

  // Save changes to localStorage whenever documents change
  useEffect(() => {
    const data = {
      documents,
      lastUpdated: new Date().toISOString(),
    };
    localStorage.setItem("documentManagementData", JSON.stringify(data));
  }, [documents]);

  // Process PDF
  const processPDF = async (file) => {
    const pdfjsLib = window["pdfjs-dist/build/pdf"];
    pdfjsLib.GlobalWorkerOptions.workerSrc =
      "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";

    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    const pageCount = pdf.numPages;
    const pageImages = [];

    for (let i = 1; i <= pageCount; i++) {
      const page = await pdf.getPage(i);

      // CHANGE THIS LINE:
      // Instead of scale: 1, use scale: 1.43 to match your UI preview size
      const scale = 1.43; // ← This matches 1024/712

      const viewport = page.getViewport({ scale: scale });
      const canvas = document.createElement("canvas");
      canvas.width = viewport.width;
      canvas.height = viewport.height;

      await page.render({
        canvasContext: canvas.getContext("2d"),
        viewport: viewport,
      }).promise;

      pageImages.push({
        number: i,
        image: canvas.toDataURL("image/png"),
        width: canvas.width,
        height: canvas.height,
      });
    }

    return pageImages;
  };

  // Process Word
  const processWord = async (file) => {
    const arrayBuffer = await file.arrayBuffer();
    const result = await mammoth.convertToHtml({ arrayBuffer });
    const html = result.value;

    const tempDiv = document.createElement("div");
    tempDiv.innerHTML = html;
    tempDiv.style.width = `${A4_WIDTH}px`;
    tempDiv.style.padding = "40px";
    tempDiv.style.backgroundColor = "white";
    tempDiv.style.fontFamily = "Arial, sans-serif";
    tempDiv.style.fontSize = "14px";
    tempDiv.style.lineHeight = "1.6";
    document.body.appendChild(tempDiv);

    const lines = tempDiv.innerText.split("\n").filter((l) => l.trim() !== "");
    document.body.removeChild(tempDiv);

    const linesPerPage = 45;
    const pageImages = [];

    for (let pageIdx = 0; pageIdx * linesPerPage < lines.length; pageIdx++) {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      canvas.width = A4_WIDTH;
      canvas.height = A4_HEIGHT;

      ctx.fillStyle = "white";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = "black";
      ctx.font = "14px Arial";

      let y = 40;
      const pageLines = lines.slice(
        pageIdx * linesPerPage,
        (pageIdx + 1) * linesPerPage
      );
      for (const line of pageLines) {
        if (y < canvas.height - 40) {
          ctx.fillText(line, 40, y);
          y += 20;
        }
      }

      pageImages.push({
        number: pageIdx + 1,
        image: canvas.toDataURL(),
        width: A4_WIDTH,
        height: A4_HEIGHT,
      });
    }

    return pageImages;
  };

  // Handle file upload
  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const fileType = file.name.split(".").pop().toLowerCase();
    if (!["pdf", "doc", "docx"].includes(fileType)) {
      alert("Please upload only PDF, DOC, or DOCX files");
      return;
    }

    try {
      let pageImages;
      if (fileType === "pdf") {
        const pdfjsLib = window["pdfjs-dist/build/pdf"];
        if (!pdfjsLib) {
          const script = document.createElement("script");
          script.src =
            "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js";
          await new Promise((resolve, reject) => {
            script.onload = resolve;
            script.onerror = reject;
            document.head.appendChild(script);
          });
        }
        pageImages = await processPDF(file);
      } else {
        pageImages = await processWord(file);
      }

      setPages(pageImages);
      setCurrentDocument({
        ...currentDocument,
        file,
        fileName: file.name,
        pages: pageImages,
      });
      setDrawerStep("upload");
    } catch (error) {
      console.error("Error processing file:", error);
      alert("Failed to process file. Please try again.");
    }
  };

  // Save document
  const saveDocument = (skipWorkflow = false, isEditorSave = false) => {
    // Validation only if not from editor save
    if (!isEditorSave) {
      if (
        !documentForm.documentName ||
        !documentForm.category ||
        !documentForm.type
      ) {
        alert("Please fill all required fields");
        return;
      }
    }

    const docId = currentDocument?.id || Date.now().toString();

    const newDoc = {
      id: docId,
      referenceId: currentDocument?.referenceId || `DOC-${Date.now()}`,
      documentName: documentForm.documentName || "Untitled",
      category: documentForm.category || "General",
      type: documentForm.type || "Other",
      description: documentForm.description || "",
      toBeFilledBy: documentForm.toBeFilledBy || "",
      createdBy: `Current User_${Date.now().toString()}`,
      createdOn: currentDocument?.createdOn || new Date().toISOString(),
      workflows: skipWorkflow ? [] : workflows,
      pages,
      droppedFields,
      status: "active",
    };

    setDocuments((prev) => {
      const index = prev.findIndex((d) => d.id === docId);
      let updatedDocs;
      if (index !== -1) {
        // Replace existing document
        updatedDocs = [...prev];
        updatedDocs[index] = newDoc;
      } else {
        // Append new document if not found
        updatedDocs = [...prev, newDoc];
      }

      localStorage.setItem(
        "documentManagementData",
        JSON.stringify({
          documents: updatedDocs,
          lastUpdated: new Date().toISOString(),
        })
      );
      return updatedDocs;
    });

    setCurrentDocument(newDoc);
    // After saving, switch to table view
    setView("table");
  };

  // Reset drawer state
  const resetDrawerState = () => {
    setDrawerStep("initial");
    setDocumentForm({
      toBeFilledBy: "applicant",
      documentName: "",
      category: "",
      type: "",
      description: "",
    });
    setWorkflows([{ initiator: "", applicant: "", approvers: "" }]);
    setPages([]);
    setDroppedFields({});
    setCurrentDocument(null);
    setCurrentPageNum(1);
    setSelectedField(null);
  };

  // View document
  const handleViewDocument = (doc) => {
    setCurrentDocument(doc);
    setPages(doc.pages || []);
    setDroppedFields(doc.droppedFields || {});
    setCurrentPageNum(1);
    setView("preview");
  };

  // Edit document
  const handleEditDocument = (doc) => {
    setCurrentDocument(doc);
    setPages(doc.pages || []);
    setDroppedFields(doc.droppedFields || {});
    setDocumentForm({
      toBeFilledBy: doc.toBeFilledBy,
      documentName: doc.documentName,
      category: doc.category,
      type: doc.type,
      description: doc.description,
    });
    setWorkflows(
      doc.workflows?.length > 0
        ? doc.workflows
        : [{ initiator: "", applicant: "", approvers: "" }]
    );
    setCurrentPageNum(1);
    setView("editor");
  };

  // Delete document
  const handleDeleteDocument = (docId) => {
    if (window.confirm("Are you sure you want to delete this document?")) {
      setDocuments((prev) => prev.filter((doc) => doc.id !== docId));
    }
  };

  // Clone document
  const handleCloneDocument = (doc) => {
    const clonedDoc = {
      ...doc,
      id: Date.now().toString(),
      referenceId: `DOC-${Date.now()}`,
      documentName: `${doc.documentName} (Copy)`,
      createdOn: new Date().toISOString(),
    };
    setDocuments((prev) => [...prev, clonedDoc]);
  };

  // Archive document
  const handleArchiveDocument = (docId) => {
    setDocuments((prev) =>
      prev.map((doc) =>
        doc.id === docId
          ? {
              ...doc,
              status: doc.status === "archived" ? "active" : "archived",
            }
          : doc
      )
    );
  };

  // Download document (simplified)
  const handleDownloadDocument = async (doc) => {
    if (!doc.pages || doc.pages.length === 0) {
      alert("No pages to download");
      return;
    }
    try {
      const pdfDoc = await PDFDocument.create();

      for (const page of doc.pages) {
        const imageBytes = await fetch(page.image).then((res) =>
          res.arrayBuffer()
        );
        let image;
        if (page.image.includes("image/png")) {
          image = await pdfDoc.embedPng(imageBytes);
        } else {
          image = await pdfDoc.embedJpg(imageBytes);
        }
        const pdfPage = pdfDoc.addPage([page.width, page.height]); // real size
        pdfPage.drawImage(image, {
          x: 0,
          y: 0,
          width: page.width,
          height: page.height, // embed at 1:1 size
        });
      }

      const pdfBytes = await pdfDoc.save();
      const blob = new Blob([pdfBytes], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download =
        doc.documentName.replace(/\s/g, "") + `_${Date.now()}.pdf`;
      link.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error creating PDF", error);
      alert("Failed to download PDF. Falling back to image download.");
      const link = document.createElement("a");
      link.href = doc.pages[0].image;
      link.download = doc.documentName + ".png";
      link.click();
    }
  };

  // Drag and drop functions
  const handleDragStart = (e, field) => {
    try {
      const transparent = document.createElement("canvas");
      transparent.width = transparent.height = 1;
      e.dataTransfer.setDragImage(transparent, 0, 0);
    } catch (err) {
      console.log("Drag image error:", err);
    }
    setDraggedFieldType(field);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (!draggedFieldType || !currentPageNum) return;

    const rect = previewRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(e.clientX - rect.left, A4_WIDTH));
    const y = Math.max(0, Math.min(e.clientY - rect.top, A4_HEIGHT));

    const newField = {
      id: `${draggedFieldType.type}-${Date.now()}`,
      type: draggedFieldType.type,
      label: draggedFieldType.label,
      icon: draggedFieldType.icon,
      x,
      y,
      page: currentPageNum,
      value: "",
      required: false,
      width: 200,
      fontSize: 14,
      fontColor: "#000000",
      fontFamily: "Arial",
      showLabel: true,
      labelPosition: "top",
      ...(draggedFieldType.type === "select" && {
        options: ["Option 1", "Option 2"],
        defaultOptionIndex: 0,
      }),
      ...(draggedFieldType.type === "image" && {
        imageSrc: null,
        alt: "",
        height: 100,
      }),
    };

    setDroppedFields((prev) => ({
      ...prev,
      [currentPageNum]: [...(prev[currentPageNum] || []), newField],
    }));
    setDraggedFieldType(null);
    setTimeout(() => setSelectedField(newField.id), 50);
  };

  const handleFieldMouseDown = (e, field) => {
    e.stopPropagation();
    if (e.target.classList.contains("drag-handle")) {
      setIsDraggingExistingField(true);
      setDraggedExistingField(field);
    }
  };

  const handleFieldMouseMove = (e) => {
    if (!isDraggingExistingField || !draggedExistingField) return;

    const rect = previewRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(e.clientX - rect.left, A4_WIDTH));
    const y = Math.max(0, Math.min(e.clientY - rect.top, A4_HEIGHT));

    setDroppedFields((prev) => ({
      ...prev,
      [currentPageNum]: prev[currentPageNum].map((f) =>
        f.id === draggedExistingField.id ? { ...f, x, y } : f
      ),
    }));
  };

  const handleFieldMouseUp = () => {
    setIsDraggingExistingField(false);
    setDraggedExistingField(null);
  };

  const handleProceedClick = () => {
    if (drawerStep === "upload") {
      if (
        !documentForm.documentName ||
        !documentForm.category ||
        !documentForm.type
      ) {
        alert("Please fill all required fields");
        return;
      }
      // Move to workflow step after upload details are filled
      setDrawerStep("workflow");
    } else if (drawerStep === "workflow") {
      const isDesignMode =
        !currentDocument?.file &&
        pages.length > 0 &&
        pages[0]?.width === A4_WIDTH;

      if (isDesignMode) {
        // DESIGN MODE: Open editor WITHOUT saving to localStorage
        // Set currentDocument to a new unsaved document object
        setCurrentDocument({
          id: Date.now().toString(),
          referenceId: `DOC-${Date.now()}`,
          documentName: documentForm.documentName || "Untitled Document",
          category: documentForm.category || "General",
          type: documentForm.type || "Other",
          description: documentForm.description || "",
          toBeFilledBy: documentForm.toBeFilledBy,
          createdBy: `Current User_${Date.now().toString()}`,
          createdOn: new Date().toISOString(),
          workflows: workflows,
          pages: pages,
          droppedFields: {},
          status: "active",
        });

        setDrawerOpen(false);
        setView("editor");
      } else {
        // UPLOAD MODE: Save document to localStorage and go to table view
        const docId = currentDocument?.id || Date.now().toString();

        const newDoc = {
          id: docId,
          referenceId: currentDocument?.referenceId || `DOC-${Date.now()}`,
          documentName: documentForm.documentName || "Untitled",
          category: documentForm.category || "General",
          type: documentForm.type || "Other",
          description: documentForm.description || "",
          toBeFilledBy: documentForm.toBeFilledBy || "",
          createdBy: `Current User_${Date.now().toString()}`,
          createdOn: currentDocument?.createdOn || new Date().toISOString(),
          workflows: workflows,
          pages,
          droppedFields: {},
          status: "active",
        };

        setDocuments((prev) => {
          const index = prev.findIndex((d) => d.id === docId);
          let updatedDocs;
          if (index !== -1) {
            updatedDocs = [...prev];
            updatedDocs[index] = newDoc;
          } else {
            updatedDocs = [...prev, newDoc];
          }

          localStorage.setItem(
            "documentManagementData",
            JSON.stringify({
              documents: updatedDocs,
              lastUpdated: new Date().toISOString(),
            })
          );
          return updatedDocs;
        });

        setCurrentDocument(newDoc);
        setDrawerOpen(false);
        resetDrawerState();
        setView("table");
      }
    }
  };

  const handleDeleteField = (fieldId) => {
    setDroppedFields((prev) => ({
      ...prev,
      [currentPageNum]: prev[currentPageNum].filter((f) => f.id !== fieldId),
    }));
    setSelectedField(null);
  };

  const handleUpdateFieldAttribute = (fieldId, attr, value) => {
    setDroppedFields((prev) => ({
      ...prev,
      [currentPageNum]: (prev[currentPageNum] || []).map((f) =>
        f.id === fieldId ? { ...f, [attr]: value } : f
      ),
    }));
  };

  // Add new blank page
  const addBlankPage = () => {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    canvas.width = A4_WIDTH;
    canvas.height = A4_HEIGHT;
    ctx.fillStyle = "white";
    ctx.fillRect(0, 0, A4_WIDTH, A4_HEIGHT);

    const newPage = {
      number: pages.length + 1,
      image: canvas.toDataURL(),
      width: A4_WIDTH,
      height: A4_HEIGHT,
    };

    setPages((prev) => [...prev, newPage]);
  };

  // Filter documents
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

  // Pagination
  const totalPages = Math.ceil(filteredDocuments.length / rowsPerPage);
  const paginatedDocuments = filteredDocuments.slice(
    (currentPage - 1) * rowsPerPage,
    currentPage * rowsPerPage
  );

  // Render field display
  const renderFieldDisplay = (field) => {
    const isSelected = selectedField === field.id;

    return (
      <motion.div
        key={field.id}
        className={`absolute ${
          isSelected
            ? "ring-2 ring-blue-500"
            : "hover:ring-2 hover:ring-gray-300"
        } rounded`}
        style={{ left: field.x, top: field.y, zIndex: isSelected ? 40 : 20 }}
        onMouseDown={(e) => {
          if (!e.target.classList.contains("delete-btn")) {
            handleFieldMouseDown(e, field);
          }
        }}
        onClick={(e) => {
          e.stopPropagation();
          if (!e.target.classList.contains("delete-btn")) {
            setSelectedField(field.id);
          }
        }}
      >
        <div className="flex gap-1 items-start">
          <div
            className="drag-handle cursor-move text-lg select-none"
            title="Drag to move"
          >
            ⠿
          </div>
          <div className="bg-transparent rounded p-2 min-w-max group relative">
            {field.showLabel !== false && field.labelPosition === "top" && (
              <div className="text-xs font-semibold mb-1">
                {field.label}
                {field.required && (
                  <span className="text-red-500 ml-0.5">*</span>
                )}
              </div>
            )}
            <div className="flex items-center gap-2">
              {field.showLabel !== false && field.labelPosition === "left" && (
                <div className="text-xs font-semibold whitespace-nowrap">
                  {field.label}
                  {field.required && (
                    <span className="text-red-500 ml-0.5">*</span>
                  )}
                  :
                </div>
              )}
              <div>
                {field.type === "checkbox" && (
                  <input type="checkbox" className="w-4 h-4" readOnly />
                )}
                {(field.type === "text" ||
                  field.type === "name" ||
                  field.type === "email" ||
                  field.type === "phone") && (
                  <input
                    type="text"
                    className="border rounded px-2 py-1 text-sm"
                    style={{ width: field.width || 200 }}
                    readOnly
                  />
                )}
                {field.type === "date" && (
                  <input
                    type="date"
                    className="border rounded px-2 py-1 text-sm"
                    style={{ width: field.width || 200 }}
                    readOnly
                  />
                )}
                {field.type === "select" && (
                  <select
                    className="border rounded px-2 py-1 text-sm"
                    style={{ width: field.width || 200 }}
                  >
                    {(field.options || []).map((opt, i) => (
                      <option key={i}>{opt}</option>
                    ))}
                  </select>
                )}
                {field.type === "signature" && (
                  <input
                    type="text"
                    className="border rounded px-2 py-1 text-sm"
                    style={{ width: field.width || 200, fontFamily: "cursive" }}
                    readOnly
                  />
                )}
                {field.type === "image" && (
                  <div
                    className="border rounded p-2 text-xs"
                    style={{
                      width: field.width || 150,
                      height: field.height || 100,
                    }}
                  >
                    {field.imageSrc ? (
                      <img
                        src={field.imageSrc}
                        alt={field.alt}
                        className="w-full h-full object-contain"
                      />
                    ) : (
                      "No image"
                    )}
                  </div>
                )}
              </div>
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                e.preventDefault();
                handleDeleteField(field.id);
              }}
              className="delete-btn absolute -top-2 -right-2 w-5 h-5 bg-red-500 text-white rounded-full text-xs opacity-0 group-hover:opacity-100 transition flex items-center justify-center font-bold"
            >
              ×
            </button>
          </div>
        </div>
      </motion.div>
    );
  };

  return (
    <div className="w-screen h-screen flex flex-col bg-gray-50">
      {/* Table View */}
      {view === "table" && (
        <div className="flex-1 flex flex-col p-6">
          {/* Filters and Actions Row */}
          <div className="flex items-center justify-end mb-4 gap-4">
            {/* <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">Rows per page:</span>
              <select
                value={rowsPerPage}
                onChange={(e) => {
                  setRowsPerPage(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="border rounded px-2 py-1 text-sm"
              >
                <option value={25}>25</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
              <div className="flex items-center gap-1 ml-4">
                <button
                  onClick={() =>
                    setCurrentPage((prev) => Math.max(1, prev - 1))
                  }
                  disabled={currentPage === 1}
                  className="p-1 rounded hover:bg-gray-200 disabled:opacity-30"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="text-sm text-gray-600 px-2">
                  Page {currentPage} of {totalPages || 1}
                </span>
                <button
                  onClick={() =>
                    setCurrentPage((prev) => Math.min(totalPages, prev + 1))
                  }
                  disabled={currentPage === totalPages || totalPages === 0}
                  className="p-1 rounded hover:bg-gray-200 disabled:opacity-30"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div> */}

            {/* Right: Filters and Add Button */}
            <div className="flex items-center gap-3">
              {/* <button
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-100 transition"
              >
                <Filter className="w-4 h-4" />
                Filters
              </button> */}
              <button
                onClick={() => {
                  resetDrawerState();
                  setDrawerOpen(true);
                }}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
              >
                <Plus className="w-4 h-4" />
                Add New Document
              </button>
            </div>
          </div>

          {/* Filters Panel */}
          {showFilters && (
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
                onChange={(e) =>
                  setFilters({ ...filters, category: e.target.value })
                }
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
                onChange={(e) =>
                  setFilters({ ...filters, type: e.target.value })
                }
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
                onChange={(e) =>
                  setFilters({ ...filters, createdBy: e.target.value })
                }
                className="border rounded px-3 py-2 text-sm"
              />
            </motion.div>
          )}

          {/* Table */}
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
                    <tr
                      key={doc.id}
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
                        {new Date(doc.createdOn).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleViewDocument(doc)}
                            className="p-1 hover:bg-gray-200 rounded transition"
                            title="View"
                          >
                            <Eye className="w-4 h-4 text-blue-600" />
                          </button>
                          <button
                            onClick={() => handleEditDocument(doc)}
                            className="p-1 hover:bg-gray-200 rounded transition"
                            title="Edit"
                          >
                            <Edit2 className="w-4 h-4 text-green-600" />
                          </button>
                          <button
                            onClick={() => handleDownloadDocument(doc)}
                            className="p-1 hover:bg-gray-200 rounded transition"
                            title="Download"
                          >
                            <Download className="w-4 h-4 text-purple-600" />
                          </button>
                          <button
                            onClick={() => handleCloneDocument(doc)}
                            className="p-1 hover:bg-gray-200 rounded transition"
                            title="Clone"
                          >
                            <Copy className="w-4 h-4 text-indigo-600" />
                          </button>
                          {/* <button
                            onClick={() => handleArchiveDocument(doc.id)}
                            className="p-1 hover:bg-gray-200 rounded transition"
                            title={
                              doc.status === "archived"
                                ? "Unarchive"
                                : "Archive"
                            }
                          >
                            <Archive
                              className={`w-4 h-4 ${
                                doc.status === "archived"
                                  ? "text-yellow-600"
                                  : "text-orange-600"
                              }`}
                            />
                          </button> */}
                          <button
                            onClick={() => handleDeleteDocument(doc.id)}
                            className="p-1 hover:bg-gray-200 rounded transition"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4 text-red-600" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {paginatedDocuments.length === 0 && (
                    <tr>
                      <td
                        colSpan="7"
                        className="px-4 py-8 text-center text-gray-500"
                      >
                        No documents found. Click "Add New Document" to create
                        one.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Preview View */}
      {view === "preview" && currentDocument && (
        <div className="flex-1 flex flex-col">
          <div className="bg-white border-b px-6 py-3 flex items-center justify-between">
            <button
              onClick={() => {
                setView("table");
                setCurrentDocument(null);
              }}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
            >
              <ChevronLeft className="w-5 h-5" />
              Back to Documents
            </button>
            <h2 className="text-xl font-semibold">
              {currentDocument.documentName}
            </h2>
            <div className="w-32"></div>
          </div>
          <div className="flex-1 overflow-auto bg-gray-100 p-6">
            <div className="max-w-5xl mx-auto space-y-6">
              {pages.map((page) => (
                <div
                  key={page.number}
                  className="bg-white shadow-lg"
                  // style={{ width: A4_WIDTH, height: A4_HEIGHT }}
                >
                  <div
                    className="relative"
                    // style={{ width: A4_WIDTH, height: A4_HEIGHT }}
                  >
                    <img
                      src={page.image}
                      alt={`Page ${page.number}`}
                      className="w-full h-full"
                    />
                    {(droppedFields[page.number] || []).map((field) => (
                      <div
                        key={field.id}
                        className="absolute bg-white border border-gray-400 rounded p-2"
                        style={{ left: field.x, top: field.y }}
                      >
                        <div className="text-xs font-semibold mb-1">
                          {field.label}
                        </div>
                        {field.type === "checkbox" && (
                          <input type="checkbox" className="w-4 h-4" readOnly />
                        )}
                        {(field.type === "text" ||
                          field.type === "name" ||
                          field.type === "email" ||
                          field.type === "phone") && (
                          <input
                            type="text"
                            className="border rounded px-2 py-1 text-sm"
                            style={{ width: field.width || 200 }}
                            readOnly
                          />
                        )}
                        {field.type === "date" && (
                          <input
                            type="date"
                            className="border rounded px-2 py-1 text-sm"
                            style={{ width: field.width || 200 }}
                            readOnly
                          />
                        )}
                        {field.type === "select" && (
                          <select
                            className="border rounded px-2 py-1 text-sm"
                            style={{ width: field.width || 200 }}
                          >
                            {(field.options || []).map((opt, i) => (
                              <option key={i}>{opt}</option>
                            ))}
                          </select>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Editor View */}
      {view === "editor" && (
        <div className="flex-1 flex overflow-hidden">
          {/* Left Sidebar - Fields */}
          <div className="w-64 bg-white border-r overflow-y-auto">
            <div className="p-4">
              <h3 className="font-semibold text-gray-900 mb-4">Drag Fields</h3>
              <div className="space-y-2">
                {STANDARD_FIELDS.map((field) => (
                  <div
                    key={field.id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, field)}
                    onDragEnd={() => setDraggedFieldType(null)}
                    className="flex items-center gap-2 p-2 bg-blue-50 border border-blue-200 rounded cursor-move hover:bg-blue-100 transition"
                  >
                    <span className="text-sm">{field.icon}</span>
                    <span className="text-xs text-gray-700">{field.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Center - Preview */}
          <div className="flex-1 flex flex-col">
            <div className="bg-gray-200 border-b px-4 py-2 flex items-center justify-between">
              <button
                onClick={() => {
                  if (window.confirm("Save changes before leaving?")) {
                    saveDocument(false, true);
                    setView("table");
                  } else {
                    setCurrentDocument(null);
                  }
                }}
                className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
              >
                <ChevronLeft className="w-5 h-5" />
                Back
              </button>
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">
                  Page {currentPageNum} of {pages.length}
                </span>
                <button
                  onClick={() =>
                    setCurrentPageNum((prev) => Math.max(1, prev - 1))
                  }
                  disabled={currentPageNum === 1}
                  className="p-1 rounded hover:bg-gray-300 disabled:opacity-30"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={() =>
                    setCurrentPageNum((prev) =>
                      Math.min(pages.length, prev + 1)
                    )
                  }
                  disabled={currentPageNum === pages.length}
                  className="p-1 rounded hover:bg-gray-300 disabled:opacity-30"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={addBlankPage}
                  className="flex items-center gap-1 px-3 py-1 bg-white border rounded hover:bg-gray-100 text-sm"
                >
                  <Plus className="w-4 h-4" />
                  Add Page
                </button>
                {view === "editor" && (
                  <button
                    onClick={() => saveDocument(false, true)}
                    className="px-4 py-1 bg-green-600 text-white rounded hover:bg-green-700 text-sm"
                  >
                    Save Document
                  </button>
                )}
              </div>
            </div>
            <div
              className="flex-1 overflow-auto bg-gray-100 p-6 flex justify-center items-start"
              onMouseMove={handleFieldMouseMove}
              onMouseUp={handleFieldMouseUp}
            >
              {pages[currentPageNum - 1] && (
                <div
                  ref={previewRef}
                  className="relative bg-white shadow-lg"
                  style={{
                    width: pages[currentPageNum - 1]?.width || A4_WIDTH,
                    height: pages[currentPageNum - 1]?.height || A4_HEIGHT,
                    minWidth: pages[currentPageNum - 1]?.width || A4_WIDTH,
                    minHeight: pages[currentPageNum - 1]?.height || A4_HEIGHT,
                  }}
                >
                  <img
                    src={pages[currentPageNum - 1].image}
                    alt={`Page ${currentPageNum}`}
                    style={{
                      width: pages[currentPageNum - 1]?.width || A4_WIDTH,
                      height: pages[currentPageNum - 1]?.height || A4_HEIGHT,
                      display: "block",
                    }}
                  />
                </div>
              )}
            </div>
          </div>

          {/* Right Sidebar - Field Config */}
          {selectedField && (
            <div className="w-80 bg-white border-l overflow-y-auto">
              <div className="sticky top-0 bg-white border-b px-4 py-3 flex items-center justify-between">
                <h3 className="text-sm font-semibold">Field Configuration</h3>
                <button
                  onClick={() => setSelectedField(null)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="p-4 space-y-4">
                {(() => {
                  const field = (droppedFields[currentPageNum] || []).find(
                    (f) => f.id === selectedField
                  );
                  if (!field) return null;

                  return (
                    <>
                      <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1">
                          Label
                        </label>
                        <input
                          type="text"
                          value={field.label}
                          onChange={(e) =>
                            handleUpdateFieldAttribute(
                              field.id,
                              "label",
                              e.target.value
                            )
                          }
                          className="w-full px-2 py-1 border rounded text-sm"
                        />
                      </div>

                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={field.showLabel !== false}
                          onChange={(e) =>
                            handleUpdateFieldAttribute(
                              field.id,
                              "showLabel",
                              e.target.checked
                            )
                          }
                          className="w-4 h-4"
                          id="showLabelCheck"
                        />
                        <label
                          htmlFor="showLabelCheck"
                          className="text-xs font-semibold text-gray-700"
                        >
                          Show Label
                        </label>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1">
                          Label Position
                        </label>
                        <select
                          value={field.labelPosition || "top"}
                          onChange={(e) =>
                            handleUpdateFieldAttribute(
                              field.id,
                              "labelPosition",
                              e.target.value
                            )
                          }
                          className="w-full px-2 py-1 border rounded text-sm"
                        >
                          <option value="top">Top</option>
                          <option value="left">Left (Inline)</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1">
                          Width (px)
                        </label>
                        <input
                          type="number"
                          value={field.width || 200}
                          onChange={(e) =>
                            handleUpdateFieldAttribute(
                              field.id,
                              "width",
                              parseInt(e.target.value)
                            )
                          }
                          className="w-full px-2 py-1 border rounded text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1">
                          Font Size
                        </label>
                        <input
                          type="number"
                          value={field.fontSize || 14}
                          onChange={(e) =>
                            handleUpdateFieldAttribute(
                              field.id,
                              "fontSize",
                              parseInt(e.target.value)
                            )
                          }
                          className="w-full px-2 py-1 border rounded text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1">
                          Font Family
                        </label>
                        <select
                          value={field.fontFamily || "Arial"}
                          onChange={(e) =>
                            handleUpdateFieldAttribute(
                              field.id,
                              "fontFamily",
                              e.target.value
                            )
                          }
                          className="w-full px-2 py-1 border rounded text-sm"
                        >
                          <option value="Arial">Arial</option>
                          <option value="Times New Roman">
                            Times New Roman
                          </option>
                          <option value="Courier New">Courier New</option>
                          <option value="cursive">Cursive</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1">
                          Font Color
                        </label>
                        <input
                          type="color"
                          value={field.fontColor || "#000000"}
                          onChange={(e) =>
                            handleUpdateFieldAttribute(
                              field.id,
                              "fontColor",
                              e.target.value
                            )
                          }
                          className="w-full h-10"
                        />
                      </div>
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={field.required || false}
                          onChange={(e) =>
                            handleUpdateFieldAttribute(
                              field.id,
                              "required",
                              e.target.checked
                            )
                          }
                          className="w-4 h-4"
                        />
                        <label className="text-xs font-semibold text-gray-700">
                          Required Field
                        </label>
                      </div>
                      {field.type === "select" && (
                        <div>
                          <label className="block text-xs font-semibold text-gray-700 mb-1">
                            Options
                          </label>
                          {(field.options || []).map((opt, idx) => (
                            <div key={idx} className="flex gap-2 mb-2">
                              <input
                                type="text"
                                value={opt}
                                onChange={(e) => {
                                  const newOptions = [...field.options];
                                  newOptions[idx] = e.target.value;
                                  handleUpdateFieldAttribute(
                                    field.id,
                                    "options",
                                    newOptions
                                  );
                                }}
                                className="flex-1 px-2 py-1 border rounded text-sm"
                              />
                              <button
                                onClick={() => {
                                  const newOptions = field.options.filter(
                                    (_, i) => i !== idx
                                  );
                                  handleUpdateFieldAttribute(
                                    field.id,
                                    "options",
                                    newOptions
                                  );
                                }}
                                className="px-2 py-1 bg-red-500 text-white rounded text-xs"
                              >
                                Remove
                              </button>
                            </div>
                          ))}
                          <button
                            onClick={() => {
                              handleUpdateFieldAttribute(field.id, "options", [
                                ...field.options,
                                `Option ${field.options.length + 1}`,
                              ]);
                            }}
                            className="px-3 py-1 bg-blue-600 text-white rounded text-sm"
                          >
                            Add Option
                          </button>
                        </div>
                      )}
                    </>
                  );
                })()}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Drawer */}
      <AnimatePresence>
        {drawerOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black z-40"
              onClick={() => {
                if (window.confirm("Close without saving?")) {
                  setDrawerOpen(false);
                  resetDrawerState();
                }
              }}
            />
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "tween", duration: 0.3 }}
              className="fixed right-0 top-0 bottom-0 w-[500px] bg-white shadow-2xl z-50 flex flex-col"
            >
              {/* Drawer Header */}
              <div className="border-b px-6 py-4 flex items-center justify-between">
                <h2 className="text-xl font-semibold">
                  {drawerStep === "initial" && "Add Document"}
                  {drawerStep === "upload" && "Document Details"}
                  {drawerStep === "workflow" && "Configure Workflow"}
                </h2>
                <button
                  onClick={() => {
                    if (window.confirm("Close without saving?")) {
                      setDrawerOpen(false);
                      resetDrawerState();
                    }
                  }}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              {/* Drawer Content */}
              <div className="flex-1 overflow-y-auto p-6">
                {/* Initial Step */}
                {drawerStep === "initial" && (
                  <div className="space-y-4">
                    <button
                      onClick={() => {
                        // Create blank page for design
                        const canvas = document.createElement("canvas");
                        const ctx = canvas.getContext("2d");
                        canvas.width = A4_WIDTH;
                        canvas.height = A4_HEIGHT;
                        ctx.fillStyle = "white";
                        ctx.fillRect(0, 0, A4_WIDTH, A4_HEIGHT);

                        setPages([
                          {
                            number: 1,
                            image: canvas.toDataURL(),
                            width: A4_WIDTH,
                            height: A4_HEIGHT,
                          },
                        ]);
                        setDrawerStep("upload");
                      }}
                      className="w-full p-6 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition text-center"
                    >
                      <div className="text-4xl mb-2">📝</div>
                      <div className="font-semibold text-gray-700">
                        Design Document
                      </div>
                      <div className="text-sm text-gray-500">
                        Start with a blank page
                      </div>
                    </button>

                    <button
                      onClick={() => fileInputRef.current.click()}
                      className="w-full p-6 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition text-center"
                    >
                      <div className="text-4xl mb-2">📤</div>
                      <div className="font-semibold text-gray-700">
                        Upload Document
                      </div>
                      <div className="text-sm text-gray-500">
                        PDF or Word files
                      </div>
                    </button>

                    <button
                      className="w-full p-6 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition text-center"
                      onClick={() =>
                        alert("Void document functionality coming soon")
                      }
                    >
                      <div className="text-4xl mb-2">🚫</div>
                      <div className="font-semibold text-gray-700">
                        Void Document
                      </div>
                      <div className="text-sm text-gray-500">Mark as void</div>
                    </button>

                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".pdf,.doc,.docx"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                  </div>
                )}

                {/* Upload/Details Step */}
                {drawerStep === "upload" && (
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
                )}

                {/* Workflow Step */}
                {drawerStep === "workflow" && (
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-gray-800">
                      Configure Approvers
                    </h3>

                    {workflows.map((workflow, index) => (
                      <div
                        key={index}
                        className="p-4 border rounded-lg bg-gray-50"
                      >
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="font-semibold text-sm">
                            Workflow {index + 1}
                          </h4>
                          {workflows.length > 1 && (
                            <button
                              onClick={() =>
                                setWorkflows(
                                  workflows.filter((_, i) => i !== index)
                                )
                              }
                              className="text-red-600 hover:text-red-800 text-sm"
                            >
                              Remove
                            </button>
                          )}
                        </div>

                        <div className="space-y-3">
                          <div>
                            <label className="block text-xs font-semibold text-gray-700 mb-1">
                              Initiator Data
                            </label>
                            <input
                              type="text"
                              value={workflow.initiator}
                              onChange={(e) => {
                                const newWorkflows = [...workflows];
                                newWorkflows[index].initiator = e.target.value;
                                setWorkflows(newWorkflows);
                              }}
                              className="w-full px-3 py-2 border rounded text-sm"
                              placeholder="Enter initiator name/email"
                            />
                          </div>

                          <div>
                            <label className="block text-xs font-semibold text-gray-700 mb-1">
                              Applicant Data
                            </label>
                            <input
                              type="text"
                              value={workflow.applicant}
                              onChange={(e) => {
                                const newWorkflows = [...workflows];
                                newWorkflows[index].applicant = e.target.value;
                                setWorkflows(newWorkflows);
                              }}
                              className="w-full px-3 py-2 border rounded text-sm"
                              placeholder="Enter applicant name/email"
                            />
                          </div>

                          <div>
                            <label className="block text-xs font-semibold text-gray-700 mb-1">
                              Approvers Data
                            </label>
                            <input
                              type="text"
                              value={workflow.approvers}
                              onChange={(e) => {
                                const newWorkflows = [...workflows];
                                newWorkflows[index].approvers = e.target.value;
                                setWorkflows(newWorkflows);
                              }}
                              className="w-full px-3 py-2 border rounded text-sm"
                              placeholder="Enter approver names/emails (comma separated)"
                            />
                          </div>
                        </div>
                      </div>
                    ))}

                    {workflows.length < 3 && (
                      <button
                        onClick={() =>
                          setWorkflows([
                            ...workflows,
                            { initiator: "", applicant: "", approvers: "" },
                          ])
                        }
                        className="w-full py-2 border-2 border-dashed border-gray-300 rounded-lg text-sm text-gray-600 hover:border-blue-500 hover:text-blue-600 transition"
                      >
                        + Add Workflow
                      </button>
                    )}
                  </div>
                )}
              </div>

              {/* Drawer Footer */}
              <div className="border-t px-6 py-4 flex items-center justify-between bg-gray-50">
                <button
                  onClick={() => {
                    if (window.confirm("Cancel and discard changes?")) {
                      setDrawerOpen(false);
                      resetDrawerState();
                    }
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-100 transition"
                >
                  Cancel
                </button>

                <div className="flex items-center gap-2">
                  {drawerStep === "workflow" && (
                    <button
                      onClick={() => {
                        handleProceedClick();
                      }}
                      className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-100 transition"
                    >
                      Skip Workflow
                    </button>
                  )}

                  <button
                    onClick={handleProceedClick}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                  >
                    Proceed
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};
export default DocumentManagementSystem;
