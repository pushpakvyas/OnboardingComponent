import React, { useState } from "react";
import PageView from "./PageView";

const DocumentPreview = ({ pages }) => {
  const [currentPageNum, setCurrentPageNum] = useState(1);

  const totalPages = pages.length;

  const handlePageChange = (delta) => {
    setCurrentPageNum((prev) => {
      const next = prev + delta;
      if (next < 1) return 1;
      if (next > totalPages) return totalPages;
      return next;
    });
  };

  if (totalPages === 0) return <div>No preview available.</div>;

  return (
    <div style={{ textAlign: "center" }}>
      <PageView page={pages[currentPageNum - 1]} />
      <div style={{ marginTop: 10 }}>
        <button
          disabled={currentPageNum <= 1}
          onClick={() => handlePageChange(-1)}
        >
          Previous
        </button>
        <span style={{ margin: "0 15px" }}>
          Page {currentPageNum} of {totalPages}
        </span>
        <button
          disabled={currentPageNum >= totalPages}
          onClick={() => handlePageChange(1)}
        >
          Next
        </button>
      </div>
    </div>
  );
};

export default DocumentPreview;
