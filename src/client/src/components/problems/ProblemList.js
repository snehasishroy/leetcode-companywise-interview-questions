import React from "react";
import { Link } from "react-router-dom";
import {
  getDifficultyText,
  getDifficultyClass,
} from "../../constants/difficulty";
import "../../styles/components/ProblemList.css";

const ProblemList = ({ problems }) => {
  if (problems.length === 0) {
    return (
      <div className="no-problems">
        <p>No problems found matching your criteria.</p>
      </div>
    );
  }

  return (
    <div className="problem-list">
      <div className="list-header">
        <span className="header-id">ID</span>
        <span className="header-title">Problem Name</span>
        <span className="header-difficulty">Difficulty</span>
        <span className="header-acceptance">Acceptance</span>
      </div>
      <div className="list-content">
        {problems.map((problem, index) => (
          <ProblemListItem key={problem.id} problem={problem} index={index} />
        ))}
      </div>
    </div>
  );
};

const ProblemListItem = ({ problem, index }) => {
  const difficultyText = getDifficultyText(problem.difficulty);
  const difficultyClass = getDifficultyClass(problem.difficulty);

  return (
    <div className="problem-list-item" data-index={index}>
      <div className="problem-id">{problem.id}</div>
      <div className="problem-title">
        <Link to={`/problems/${problem.id}`}>{problem.title}</Link>
      </div>
      <div className={`problem-difficulty ${difficultyClass}`}>
        {difficultyText}
      </div>
      <div className="problem-acceptance">{problem.acceptance}%</div>
    </div>
  );
};

export default ProblemList;