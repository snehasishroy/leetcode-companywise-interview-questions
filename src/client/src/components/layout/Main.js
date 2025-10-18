import React, { useState, useEffect, useMemo } from "react";
import { fetchProblems } from "../../services/api";
import Nav from "./Nav";
import Body from "./Body";
import useSolvedProblems from "../hooks/useSolvedProblems";
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
  const [currentView, setCurrentView] = useState('list');
  // Use the solved problems hook
  const solvedProblems = useSolvedProblems();

  const PROBLEMS_PER_PAGE = 50;

  // Check if any filters are active
  const hasActiveFilters = useMemo(() => {
    return !!(filters.company || filters.timePeriod || filters.difficulty);
  }, [filters]);

  useEffect(() => {
    const loadProblems = async () => {
      setLoading(true);
      try {
        // ALWAYS pass filters to API - backend will ignore empty ones
        const data = await fetchProblems(currentPage, PROBLEMS_PER_PAGE, filters);
        setProblems(data);
        setError(null);
        
        // Estimate total pages based on response
        if (data.length < PROBLEMS_PER_PAGE) {
          setTotalPages(currentPage); // This is the last page
        } else {
          setTotalPages(currentPage + 1); // There might be more pages
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

  // Extract unique company names from ALL problems (initial load for dropdown)
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
        hasActiveFilters={hasActiveFilters}
        currentView={currentView}
        onViewChange={setCurrentView}
        solvedProblems={solvedProblems}
      />
    </div>
  );
};

export default Main;