import React from "react";
import ProblemCard from "./ProblemCard";
import "../../styles/components/ProblemGrid.css";

const ProblemGrid = ({ problems, hasActiveFilters }) => {

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
    <div className="problem-grid">
      {problems.map((problem) => (
        <ProblemCard key={problem.id} problem={problem} />
      ))}
    </div>
  );
};

export default ProblemGrid;