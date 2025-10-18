import React from "react";
import "../../styles/layout/ViewToggle.css";

const ViewToggle = ({ currentView, onViewChange, solvedProblems }) => {
  const handleClearAll = () => {
    if (
      window.confirm(
        "Are you sure you want to clear all solved problems? This action cannot be undone."
      )
    ) {
      solvedProblems.clearAllSolved();
    }
  };

  const hasSolvedProblems = solvedProblems.solvedProblems.size > 0;

  return (
    <div className="view-toggle-container">
      <div className="view-toggle">
        <button
          className={`toggle-btn ${currentView === "grid" ? "active" : ""}`}
          onClick={() => onViewChange("grid")}
          title="Grid View"
        >
          ⏹️ Grid
        </button>
        <button
          className={`toggle-btn ${currentView === "list" ? "active" : ""}`}
          onClick={() => onViewChange("list")}
          title="List View"
        >
          📋 List
        </button>
      </div>

      {hasSolvedProblems && (
        <button
          className="clear-all-btn"
          onClick={handleClearAll}
          title="Clear all solved problems"
        >
          🗑️ Clear Solved
        </button>
      )}
    </div>
  );
};

export default ViewToggle;
