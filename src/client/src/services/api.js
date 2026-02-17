// services/api.js
const API_BASE_URL =
  process.env.REACT_APP_API_BASE_URL || "http://default-fallback.com/api";

export const fetchProblems = async (
  page = 1,
  limit = 50,
  filters = {},
  shuffle = -1
) => {
  const skip = (page - 1) * limit;
  const params = new URLSearchParams({
    skip: skip.toString(),
    limit: limit.toString(),
  });

  // Add filter parameters if they exist
  if (filters.company) {
    params.append("company", filters.company);
  }
  if (filters.difficulty) {
    params.append("difficulty", filters.difficulty);
  }
  if (filters.timePeriod) {
    params.append("tag", filters.timePeriod);
  }

  if (shuffle !== -1) {
    params.append("shuffle", shuffle.toString());
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

export const fetchCompanies = async () => {
  const response = await fetch(`${API_BASE_URL}/problems-metadata`);
  if (!response.ok) {
    throw new Error(`Failed to fetch companies`);
  }
  return await response.json();
};
