import React from "react";
import ShuffleToggle from "./ShuffleToggle";
import "../../styles/layout/ViewToggle.css";

const ViewToggle = ({
  currentView,
  onViewChange,
  solvedProblems,
  shuffleState,
}) => {
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
      <div className="left-controls">
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
      </div>

      <div className="right-controls">
        {shuffleState && (
          <div className="shuffle-control">
            <ShuffleToggle shuffleState={shuffleState} />
          </div>
        )}

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
    </div>
  );
};

export default ViewToggle;
