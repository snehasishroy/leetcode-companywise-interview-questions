import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { getProblemById } from "../../services/api";
import "../../styles/components/ProblemPage.css";

const tagOrder = ["thirty-days", "three-months", "six-months", "one-year", "all"];

const ProblemPage = () => {
  const { id } = useParams();
  const [problem, setProblem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [tagMap, setTagMap] = useState({});

  useEffect(() => {
    const fetchProblem = async () => {
      try {
        const response = await getProblemById(id);
        setProblem(response);
        setTagMap(groupCompaniesByTag(response.companies));
      } catch (err) {
        setError("Problem not found or failed to fetch.");
      } finally {
        setLoading(false);
      }
    };
    fetchProblem();
  }, [id]);

  if (loading) return <div className="lcw-loading">Loading...</div>;
  if (error) return <div className="lcw-error">{error}</div>;
  if (!problem) return <div className="lcw-error">No problem found</div>;

  return (
    <div className="lcw-problem-page">
      <div className="lcw-header">
        <h2>{problem.title}</h2>
        <a
          href={problem.url}
          target="_blank"
          rel="noopener noreferrer"
          className="lcw-link"
        >
          View on LeetCode
        </a>
      </div>
      <div className="lcw-meta">
        <span className={`lcw-difficulty lcw-difficulty-${difficultyClass(problem.difficulty)}`}>
          {difficultyLabel(problem.difficulty)}
        </span>
        <span className="lcw-meta-item">
          <strong>Acceptance:</strong> {problem.acceptance}%
        </span>
        <span className="lcw-meta-item">
          <strong>Frequency:</strong> {problem.frequency}%
        </span>
        <span className="lcw-meta-item">
          <strong>ID:</strong> {problem.id}
        </span>
      </div>
      <h3 className="lcw-section-title">Companies by Tag</h3>
      <table className="lcw-table">
        <thead>
          <tr>
            <th>Tag</th>
            <th>Companies</th>
          </tr>
        </thead>
        <tbody>
          {tagOrder
            .filter(tag => tagMap[tag])
            .map(tag => (
              <tr key={tag}>
                <td>
                  <span className="lcw-tag">{tag}</span>
                </td>
                <td>
                  {tagMap[tag].map(company => (
                    <span key={company} className="lcw-company">
                      {company}
                    </span>
                  ))}
                </td>
              </tr>
            ))}
        </tbody>
      </table>
    </div>
  );
};

function groupCompaniesByTag(companies) {
  const tagMap = {};
  Object.entries(companies).forEach(([company, tags]) => {
    tags.forEach(tag => {
      if (!tagMap[tag]) tagMap[tag] = [];
      tagMap[tag].push(company);
    });
  });
  return tagMap;
}

function difficultyLabel(diff) {
  if (diff === 1) return "Easy";
  if (diff === 2) return "Medium";
  if (diff === 3) return "Hard";
  return "Unknown";
}

function difficultyClass(diff) {
  if (diff === 1) return "easy";
  if (diff === 2) return "medium";
  if (diff === 3) return "hard";
  return "unknown";
}

export default ProblemPage;