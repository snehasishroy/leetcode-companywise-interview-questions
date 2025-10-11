const API_BASE_URL = "http://localhost:5164";

export const fetchProblems = async () => {
  const response = await fetch(`${API_BASE_URL}/api/problems`);
  if (!response.ok) {
    throw new Error(`Network response was not ok: ${response.status}`);
  }
  return await response.json();
};

export const getProblemById = async (id) => {
  const response = await fetch(`${API_BASE_URL}/api/problems/${id}`);
  if (!response.ok) {
    throw new Error(`Failed to fetch problem #${id}`);
  }
  return await response.json();
};
