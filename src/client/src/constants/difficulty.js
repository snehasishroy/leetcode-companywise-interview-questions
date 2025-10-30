/**
 * Enum for LeetCode problem difficulty levels
 * @readonly
 * @enum {number}
 */
export const DifficultyLevel = {
  EASY: 1,
  MEDIUM: 2,
  HARD: 3,
};

/**
 * Configuration for difficulty levels including display text and styling
 * @readonly
 * @type {Object.<number, {text: string, className: string}>}
 */
export const DifficultyConfig = {
  [DifficultyLevel.EASY]: { text: "Easy", className: "easy" },
  [DifficultyLevel.MEDIUM]: { text: "Medium", className: "medium" },
  [DifficultyLevel.HARD]: { text: "Hard", className: "hard" },
};

/**
 * Get the display text for a difficulty level
 * @param {DifficultyLevel} level
 * @returns {string}
 */
export const getDifficultyText = (level) =>
  DifficultyConfig[level]?.text ?? "Unknown";

/**
 * Get the CSS class name for a difficulty level
 * @param {DifficultyLevel} level
 * @returns {string}
 */
export const getDifficultyClass = (level) =>
  DifficultyConfig[level]?.className ?? "";
