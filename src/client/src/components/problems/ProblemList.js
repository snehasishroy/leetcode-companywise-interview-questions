import React from "react";
import { Link } from "react-router-dom";
import {
  getDifficultyText,
  getDifficultyClass,
} from "../../constants/difficulty";
import "../../styles/components/ProblemList.css";

const ProblemList = ({ problems, solvedProblems }) => {
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
        <span className="header-solved">Solved</span>
        <span className="header-id">ID</span>
        <span className="header-title">Problem Name</span>
        <span className="header-difficulty">Difficulty</span>
        <span className="header-acceptance">Acceptance</span>
      </div>
      <div className="list-content">
        {problems.map((problem, index) => (
          <ProblemListItem 
            key={problem.id} 
            problem={problem} 
            index={index}
            solvedProblems={solvedProblems}
          />
        ))}
      </div>
    </div>
  );
};

const ProblemListItem = ({ problem, index, solvedProblems }) => {
  const difficultyText = getDifficultyText(problem.difficulty);
  const difficultyClass = getDifficultyClass(problem.difficulty);
  const isSolved = solvedProblems.isSolved(problem.id);

  const handleCheckboxChange = () => {
    solvedProblems.toggleSolved(problem.id);
  };

  return (
    <div className={`problem-list-item ${isSolved ? 'solved' : ''}`} data-index={index}>
      <div className="problem-solved">
        <input
          type="checkbox"
          checked={isSolved}
          onChange={handleCheckboxChange}
          className="solved-checkbox"
        />
      </div>
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