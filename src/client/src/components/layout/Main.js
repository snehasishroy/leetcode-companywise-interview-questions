import React, { useState, useEffect, useMemo } from "react";
import { fetchProblems, fetchCompanies } from "../../services/api";
import Nav from "./Nav";
import Body from "./Body";
import useSolvedProblems from "../hooks/useSolvedProblems";
import "../../styles/layout/Main.css";

const Main = () => {
  const [problems, setProblems] = useState([]);
  const [companies, setCompanies] = useState([]);
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
  const [shuffle, setShuffle] = useState(-1); // -1 means shuffle is off
  const [isShuffleEnabled, setIsShuffleEnabled] = useState(false);

  const solvedProblems = useSolvedProblems();
  const PROBLEMS_PER_PAGE = 50;

  const hasActiveFilters = useMemo(() => {
    return !!(filters.company || filters.timePeriod || filters.difficulty);
  }, [filters]);

  const generateShuffleNumber = () => {
    return Math.floor(Math.random() * 10000) + 1;
  };

  // Toggle shuffle on/off
  const toggleShuffle = () => {
    if (isShuffleEnabled) {
      // Turning shuffle off
      setIsShuffleEnabled(false);
      setShuffle(-1);
    } else {
      // Turning shuffle on - generate new number if none exists
      setIsShuffleEnabled(true);
      if (shuffle === -1) {
        setShuffle(generateShuffleNumber());
      }
    }
  };

  // Regenerate shuffle number
  const regenerateShuffle = () => {
    const newShuffle = generateShuffleNumber();
    setShuffle(newShuffle);
    setCurrentPage(1); // Reset to first page when regenerating shuffle
  };

  useEffect(() => {
    const loadProblems = async () => {
      setLoading(true);
      try {
        const data = await fetchProblems(
          currentPage, 
          PROBLEMS_PER_PAGE, 
          filters,
          isShuffleEnabled ? shuffle : -1 // Only pass shuffle if enabled
        );
        setProblems(data);
        setError(null);
        
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
  }, [currentPage, filters, shuffle, isShuffleEnabled]);

  useEffect(() => {
    const loadCompanies = async () => {
      try {
        const companyData = await fetchCompanies();
        setCompanies(companyData.sort());
      } catch (err) {
        console.error("Failed to fetch companies:", err);
      }
    };

    loadCompanies();
  }, []);

  const handleFilterChange = (newFilters) => {
    setFilters(newFilters);
    setCurrentPage(1);
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
        shuffleState={{
          isShuffleEnabled,
          shuffle,
          toggleShuffle,
          regenerateShuffle
        }}
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
        shuffleState={{
          isShuffleEnabled,
          shuffle,
          toggleShuffle,
          regenerateShuffle
        }}
      />
    </div>
  );
};

export default Main;