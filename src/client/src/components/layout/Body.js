import React from "react";
import ProblemGrid from "../problems/ProblemGrid";
import Pagination from "./Pagination";
import "../../styles/layout/Body.css";

const Body = ({
  problems,
  loading,
  error,
  filters,
  currentPage,
  totalPages,
  onPageChange,
  hasActiveFilters,
  currentView,
  onViewChange
}) => {
  if (loading) {
    return (
      <div className="body loading">
        <div className="loading-spinner">
          {hasActiveFilters
            ? "Loading filtered problems..."
            : "Loading problems..."}
        </div>
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
        <ProblemGrid 
          problems={problems} 
          hasActiveFilters={hasActiveFilters}
          currentView={currentView}
          onViewChange={onViewChange}
        />
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