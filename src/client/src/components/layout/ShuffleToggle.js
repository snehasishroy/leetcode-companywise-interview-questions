import React from "react";
import "../../styles/layout/ShuffleToggle.css";

const ShuffleToggle = ({ shuffleState }) => {
  const { isShuffleEnabled, toggleShuffle } = shuffleState;

  return (
    <div className="shuffle-toggle-container">
      <div className="shuffle-toggle">
        <label className="shuffle-label">
          <input
            type="checkbox"
            checked={isShuffleEnabled}
            onChange={toggleShuffle}
            className="shuffle-checkbox"
          />
          <span className="shuffle-slider"></span>
          <span className="shuffle-text">Shuffle</span>
        </label>
      </div>
    </div>
  );
};

export default ShuffleToggle;