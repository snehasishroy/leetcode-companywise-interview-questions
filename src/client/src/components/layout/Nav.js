import React from "react";
import FilterOptions from "../filters/FilterOptions";
import "../../styles/layout/Nav.css";

const Nav = ({ filters, onFilterChange, companies }) => {
  return (
    <nav className="nav">
      <div className="nav-content">
        <FilterOptions
          currentFilters={filters}
          onFilterChange={onFilterChange}
          companies={companies}
        />
      </div>
    </nav>
  );
};

export default Nav;
