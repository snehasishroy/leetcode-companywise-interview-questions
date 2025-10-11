import React from "react";
import { DifficultyLevel } from "../../constants/difficulty";
import "../../styles/components/FilterOptions.css";

const TIME_PERIODS = [
  { value: "thirty-days", label: "Last 30 Days" },
  { value: "three-months", label: "Last 3 Months" },
  { value: "six-months", label: "Last 6 Months" },
  { value: "one-year", label: "Last Year" },
  { value: "all", label: "All Time" },
];

const DIFFICULTIES = [
  { value: DifficultyLevel.EASY, label: "Easy" },
  { value: DifficultyLevel.MEDIUM, label: "Medium" },
  { value: DifficultyLevel.HARD, label: "Hard" },
];

const FilterOptions = ({ currentFilters, onFilterChange, companies = [] }) => {
  const handleCompanyChange = (e) => {
    onFilterChange({ ...currentFilters, company: e.target.value });
  };

  const handleTimePeriodChange = (e) => {
    onFilterChange({ ...currentFilters, timePeriod: e.target.value });
  };

  const handleDifficultyChange = (e) => {
    onFilterChange({ ...currentFilters, difficulty: e.target.value });
  };

  const handleClearFilters = () => {
    onFilterChange({
      company: "",
      timePeriod: "",
      difficulty: "",
    });
  };


  return (
    <div className="filter-options">
      <div className="filter-group">
        <label htmlFor="company">Company:</label>
        <select
          id="company"
          value={currentFilters.company}
          onChange={handleCompanyChange}
        >
          <option value="">All Companies</option>
          {companies.map((company) => (
            <option key={company} value={company}>
              {company}
            </option>
          ))}
        </select>
      </div>

      <div className="filter-group">
        <label htmlFor="timePeriod">Time Period:</label>
        <select
          id="timePeriod"
          value={currentFilters.timePeriod}
          onChange={handleTimePeriodChange}
          disabled={!currentFilters.company}
        >
          <option value="">All Time Periods</option>
          {TIME_PERIODS.map((period) => (
            <option key={period.value} value={period.value}>
              {period.label}
            </option>
          ))}
        </select>
      </div>

      <div className="filter-group">
        <label htmlFor="difficulty">Difficulty:</label>
        <select
          id="difficulty"
          value={currentFilters.difficulty}
          onChange={handleDifficultyChange}
        >
          <option value="">All Difficulties</option>
          {DIFFICULTIES.map((difficulty) => (
            <option key={difficulty.value} value={difficulty.value}>
              {difficulty.label}
            </option>
          ))}
        </select>
      </div>

      <button
        className="clear-filters"
        onClick={handleClearFilters}
        disabled={
          !currentFilters.company &&
          !currentFilters.timePeriod &&
          !currentFilters.difficulty
        }
      >
        Clear Filters
      </button>
    </div>
  );
};

export default FilterOptions;
