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
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const PROBLEMS_PER_PAGE = 50;

  useEffect(() => {
    const loadProblems = async () => {
      setLoading(true);
      try {
        const data = await fetchProblems(currentPage, PROBLEMS_PER_PAGE, filters);
        setProblems(data);
        setError(null);
        
        // Estimate total pages based on response
        if (data.length < PROBLEMS_PER_PAGE) {
          setTotalPages(currentPage);
        } else {
          setTotalPages(currentPage + 1);
        }
      } catch (err) {
        setError("Failed to fetch problems. Please try again later.");
        setProblems([]);
      } finally {
        setLoading(false);
      }
    };

    loadProblems();
  }, [currentPage, filters]);

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
    setCurrentPage(1); // Reset to first page when filters change
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
    // Scroll to top when page changes
    window.scrollTo({ top: 0, behavior: 'smooth' });
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
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={handlePageChange}
      />
    </div>
  );
};

export default Main;