import React from "react";
import {
  getDifficultyText,
  getDifficultyClass,
} from "../../constants/difficulty";
import "../../styles/components/ProblemCard.css";
import { Link } from "react-router-dom";

const TIME_PERIOD_LABELS = {
  "thirty-days": "Last 30 Days",
  "three-months": "Last 3 Months",
  "six-months": "Last 6 Months",
  "one-year": "Last Year",
  all: "All Time",
};

const ProblemCard = ({ problem }) => {
  const difficultyText = getDifficultyText(problem.difficulty);
  const difficultyClass = getDifficultyClass(problem.difficulty);

  const getTopCompanies = (companies) => {
    if (!companies) return [];

    return Object.entries(companies)
      .map(([name, periods]) => ({
        name,
        timePeriods: periods.sort((a, b) => {
          const order = [
            "thirty-days",
            "three-months",
            "six-months",
            "one-year",
            "all",
          ];
          return order.indexOf(a) - order.indexOf(b);
        }),
      }))
      .slice(0, 5);
  };

  const topCompanies = getTopCompanies(problem.companies);

  return (
    <div className="problem-card">
      <div className="problem-header">
        <h3>
          <Link to={`/problems/${problem.id}`}>{problem.title}</Link>
        </h3>
        <span className={`difficulty ${difficultyClass}`}>
          {difficultyText}
        </span>
      </div>

      <div className="problem-stats">
        <span className="acceptance">Acceptance: {problem.acceptance}%</span>
        <span className="frequency">Frequency: {problem.frequency}%</span>
      </div>

      {topCompanies.length > 0 && (
        <div className="problem-companies">
          <small>Top Companies:</small>
          <div className="company-tags">
            {topCompanies.map((company, index) => (
              <div
                key={index}
                className="company-tag"
                title={company.timePeriods
                  .map((p) => TIME_PERIOD_LABELS[p])
                  .join(", ")}
              >
                <span className="company-name">
                  {company.name
                    .split("-")
                    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
                    .join(" ")}
                </span>
                {company.timePeriods.includes("thirty-days") && (
                  <span
                    className="recent-indicator"
                    title="Asked in last 30 days"
                  >
                    🔥
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ProblemCard;
