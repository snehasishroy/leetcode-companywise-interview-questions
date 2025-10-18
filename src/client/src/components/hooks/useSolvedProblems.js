import { useState, useEffect } from 'react';

const useSolvedProblems = () => {
  // Initialize state directly from localStorage using lazy initial state
  const [solvedProblems, setSolvedProblems] = useState(() => {
    try {
      const stored = localStorage.getItem('leetcode-solved-problems');
      if (stored) {
        const parsed = JSON.parse(stored);
        return new Set(parsed);
      }
    } catch (error) {
      console.error('Error loading solved problems from localStorage:', error);
    }
    return new Set();
  });

  // Single useEffect for saving to localStorage
  useEffect(() => {
    try {
      const array = Array.from(solvedProblems);
      localStorage.setItem('leetcode-solved-problems', JSON.stringify(array));
    } catch (error) {
      console.error('Error saving solved problems to localStorage:', error);
    }
  }, [solvedProblems]);

  const toggleSolved = (problemId) => {
    setSolvedProblems(prev => {
      const newSet = new Set(prev);
      if (newSet.has(problemId)) {
        newSet.delete(problemId);
      } else {
        newSet.add(problemId);
      }
      return newSet;
    });
  };

  const isSolved = (problemId) => {
    return solvedProblems.has(problemId);
  };

  const markSolved = (problemId) => {
    setSolvedProblems(prev => {
      const newSet = new Set(prev);
      newSet.add(problemId);
      return newSet;
    });
  };

  const markUnsolved = (problemId) => {
    setSolvedProblems(prev => {
      const newSet = new Set(prev);
      newSet.delete(problemId);
      return newSet;
    });
  };

  const clearAllSolved = () => {
    setSolvedProblems(new Set());
  };

  return {
    solvedProblems,
    toggleSolved,
    isSolved,
    markSolved,
    markUnsolved,
    clearAllSolved
  };
};

export default useSolvedProblems;