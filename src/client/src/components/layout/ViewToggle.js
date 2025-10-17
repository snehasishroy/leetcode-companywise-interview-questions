import React from "react";
import "../../styles/layout/ViewToggle.css";

const ViewToggle = ({ currentView, onViewChange }) => {
  return (
    <div className="view-toggle">
      <button
        className={`toggle-btn ${currentView === 'grid' ? 'active' : ''}`}
        onClick={() => onViewChange('grid')}
        title="Grid View"
      >
        ⏹️ Grid
      </button>
      <button
        className={`toggle-btn ${currentView === 'list' ? 'active' : ''}`}
        onClick={() => onViewChange('list')}
        title="List View"
      >
        📋 List
      </button>
    </div>
  );
};

export default ViewToggle;