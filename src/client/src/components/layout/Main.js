import React, { useState, useEffect, useMemo } from "react";
import { fetchProblems } from "../../services/api";
import Nav from "./Nav";
import Body from "./Body";
import "../../styles/layout/Main.css";

const Main = () => {
  const [problems, setProblems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    company: "",
    timePeriod: "",
    difficulty: "",
  });

  useEffect(() => {
    const loadProblems = async () => {
      setLoading(true);
      try {
        const data = await fetchProblems();
        setProblems(data);
        setError(null);
      } catch (err) {
        setError("Failed to fetch problems. Please try again later.");
        setProblems([]);
      } finally {
        setLoading(false);
      }
    };

    loadProblems();
  }, []);

  // Extract unique company names from problems
  const companies = useMemo(() => {
    const companySet = new Set();
    problems.forEach((problem) => {
      if (problem.companies) {
        Object.keys(problem.companies).forEach((company) =>
          companySet.add(company)
        );
      }
    });
    return Array.from(companySet).sort();
  }, [problems]);

  const handleFilterChange = (newFilters) => {
    setFilters(newFilters);
  };

  return (
    <div className="main-container">
      <Nav
        filters={filters}
        onFilterChange={handleFilterChange}
        companies={companies}
      />
      <Body
        problems={problems}
        loading={loading}
        error={error}
        filters={filters}
      />
    </div>
  );
};

export default Main;
