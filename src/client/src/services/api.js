const API_BASE_URL = "http://localhost:5164/api";

export const fetchProblems = async () => {
  const response = await fetch(`${API_BASE_URL}/problems`);
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
