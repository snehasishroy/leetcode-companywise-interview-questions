import React from "react";
import ProblemCard from "./ProblemCard";
import ProblemList from "./ProblemList";
import ViewToggle from "../layout/ViewToggle";
import "../../styles/components/ProblemGrid.css";

const ProblemGrid = ({ problems, hasActiveFilters, currentView, onViewChange }) => {
  if (problems.length === 0) {
    return (
      <div className="no-problems">
        <p>No problems found matching your criteria.</p>
        {hasActiveFilters && (
          <p>Try adjusting your filters or clearing them to see all problems.</p>
        )}
      </div>
    );
  }

  return (
    <div className="problem-container">
      <ViewToggle currentView={currentView} onViewChange={onViewChange} />
      
      {currentView === 'grid' ? (
        <div className="problem-grid">
          {problems.map((problem) => (
            <ProblemCard key={problem.id} problem={problem} />
          ))}
        </div>
      ) : (
        <div className="problem-list-container">
          <ProblemList problems={problems} />
        </div>
      )}
    </div>
  );
};

export default ProblemGrid;