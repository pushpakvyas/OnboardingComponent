import { useState, useMemo } from "react";

export const usePagination = (items, initialRowsPerPage = 25) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(initialRowsPerPage);

  const totalPages = Math.ceil(items.length / rowsPerPage);

  const paginatedItems = useMemo(() => {
    const start = (currentPage - 1) * rowsPerPage;
    const end = start + rowsPerPage;
    return items.slice(start, end);
  }, [items, currentPage, rowsPerPage]);

  const goToPage = (page) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)));
  };

  const nextPage = () => {
    goToPage(currentPage + 1);
  };

  const prevPage = () => {
    goToPage(currentPage - 1);
  };

  return {
    currentPage,
    rowsPerPage,
    totalPages,
    paginatedItems,
    setCurrentPage: goToPage,
    setRowsPerPage,
    nextPage,
    prevPage,
  };
};
