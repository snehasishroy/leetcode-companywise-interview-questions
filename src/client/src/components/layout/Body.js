import React from "react";
import ProblemGrid from "../problems/ProblemGrid";
import "../../styles/layout/Body.css";

const Body = ({ problems, loading, error, filters }) => {
  if (loading) {
    return (
      <div className="body loading">
        <div className="loading-spinner">Loading problems...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="body error">
        <div className="error-message">
          {error}
          <button onClick={() => window.location.reload()}>Retry</button>
        </div>
      </div>
    );
  }

  return (
    <main className="body">
      <div className="body-content">
        <ProblemGrid problems={problems} filters={filters} />
      </div>
    </main>
  );
};

export default Body;
