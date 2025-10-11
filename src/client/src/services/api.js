// services/api.js
const API_BASE_URL = "http://localhost:5164/api";

export const fetchProblems = async (page = 1, limit = 50, filters = {}) => {
  const skip = (page - 1) * limit;
  const params = new URLSearchParams({
    skip: skip.toString(),
    limit: limit.toString()
  });

  // Add filter parameters if they exist
  if (filters.company) {
    params.append('companies', filters.company);
  }
  if (filters.difficulty) {
    params.append('difficulties', filters.difficulty);
  }
  if (filters.timePeriod) {
    params.append('tags', filters.timePeriod);
  }

  const response = await fetch(`${API_BASE_URL}/problems?${params}`);
  if (!response.ok) {
    throw new Error(`Network response was not ok: ${response.status}`);
  }
  return await response.json();
};

export const getProblemById = async (id) => {
  const response = await fetch(`${API_BASE_URL}/problems/${id}`);
  if (!response.ok) {
    throw new Error(`Failed to fetch problem #${id}`);
  }
  return await response.json();
};