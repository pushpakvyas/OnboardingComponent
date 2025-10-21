import React from "react";

const PageView = ({ page }) => {
  if (!page) return null;

  return (
    <div
      style={{
        border: "1px solid #ccc",
        display: "inline-block",
        width: page.width,
        height: page.height,
      }}
    >
      <img
        src={page.image}
        alt={`Page ${page.number}`}
        style={{ width: "100%", height: "100%" }}
      />
    </div>
  );
};

export default PageView;
