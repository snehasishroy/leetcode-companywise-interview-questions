import React, { useMemo } from "react";
import ProblemCard from "./ProblemCard";
import "../../styles/components/ProblemGrid.css";

const ProblemGrid = ({ problems, filters }) => {
  const filteredProblems = useMemo(() => {
    if (!filters.company && !filters.timePeriod && !filters.difficulty) {
      return problems;
    }

    return problems.filter((problem) => {
      // Company filter
      if (
        filters.company &&
        (!problem.companies || !problem.companies[filters.company])
      ) {
        return false;
      }

      // Time period filter - only apply if both company and time period are selected
      if (filters.company && filters.timePeriod) {
        if (
          !problem.companies?.[filters.company]?.includes(filters.timePeriod)
        ) {
          return false;
        }
      }

      // Difficulty filter
      if (
        filters.difficulty &&
        problem.difficulty !== Number(filters.difficulty)
      ) {
        return false;
      }

      return true;
    });
  }, [problems, filters]);

  if (filteredProblems.length === 0) {
    return (
      <div className="no-problems">
        <p>No problems found matching your criteria.</p>
      </div>
    );
  }

  return (
    <div className="problem-grid">
      {filteredProblems.map((problem) => (
        <ProblemCard key={problem.id} problem={problem} />
      ))}
    </div>
  );
};

export default ProblemGrid;
