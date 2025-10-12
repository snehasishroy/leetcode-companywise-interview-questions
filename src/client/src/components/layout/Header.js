import React from "react";
import "../../styles/layout/Header.css";
import { Link } from "react-router-dom";

const Header = () => {
  return (
    <header className="header">
      <div className="header-content">
        <Link to="/" className="header-link">
          <h1>LeetCode Problem Tracker</h1>
        </Link>
      </div>
    </header>
  );
};

export default Header;
