const API_URL = import.meta.env.VITE_API_URL;

export const apiFetch = (url, options = {}) => {
  const token = localStorage.getItem('token');

  return fetch(`${API_URL}${url}`, {
    ...options,
    headers: {
      ...(options.body ? { 'Content-Type': 'application/json' } : {}),
      ...(options.headers || {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });
};
