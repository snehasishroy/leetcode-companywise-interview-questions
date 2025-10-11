import React from "react";
import ProblemGrid from "../problems/ProblemGrid";
import Pagination from "./Pagination"; // Add this import
import "../../styles/layout/Body.css";

const Body = ({ 
  problems, 
  loading, 
  error, 
  filters, 
  currentPage, 
  totalPages, 
  onPageChange 
}) => {
  if (loading) {
    return (
      <div className="body loading">
        <div className="loading-spinner">Loading problems...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="body error">
        <div className="error-message">
          {error}
          <button onClick={() => window.location.reload()}>Retry</button>
        </div>
      </div>
    );
  }

  return (
    <main className="body">
      <div className="body-content">
        <ProblemGrid problems={problems} filters={filters} />
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={onPageChange}
        />
      </div>
    </main>
  );
};

export default Body;