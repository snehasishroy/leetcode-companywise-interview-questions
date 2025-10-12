// components/Pagination.js
import React from "react";
import "../../styles/layout/Pagination.css";

const Pagination = ({ currentPage, totalPages, onPageChange }) => {
  const getPageNumbers = () => {
    const pages = [];
    const maxVisiblePages = 5;
    
    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
    
    // Adjust start page if we're near the end
    if (endPage - startPage + 1 < maxVisiblePages) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }
    
    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }
    
    return pages;
  };

  if (totalPages <= 1) return null;

  return (
    <div className="pagination">
      {/* First Page Button */}
      <button
        className="pagination-btn pagination-first"
        disabled={currentPage === 1}
        onClick={() => onPageChange(1)}
        title="First Page"
      >
        &laquo;
      </button>
      
      {/* Previous Page Button */}
      <button
        className="pagination-btn pagination-prev"
        disabled={currentPage === 1}
        onClick={() => onPageChange(currentPage - 1)}
        title="Previous Page"
      >
        &lsaquo;
      </button>
      
      {/* Page Numbers */}
      <div className="pagination-pages">
        {getPageNumbers().map(page => (
          <button
            key={page}
            className={`pagination-btn ${currentPage === page ? 'active' : ''}`}
            onClick={() => onPageChange(page)}
          >
            {page}
          </button>
        ))}
      </div>
      
      {/* Next Page Button */}
      <button
        className="pagination-btn pagination-next"
        disabled={currentPage === totalPages}
        onClick={() => onPageChange(currentPage + 1)}
        title="Next Page"
      >
        &rsaquo;
      </button>
    </div>
  );
};

export default Pagination;