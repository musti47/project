const API_URL = import.meta.env.VITE_API_URL;

export const apiFetch = (url, options = {}) => {
  return fetch(`${API_URL}${url}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
      Authorization: `Bearer ${localStorage.getItem("token")}`,
    },
  });
};