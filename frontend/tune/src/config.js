const configuredApiUrl = import.meta.env.VITE_API_URL?.trim();

const getLocalBackendUrl = () => {
  const hostname =
    typeof window !== 'undefined' && window.location
      ? window.location.hostname || 'localhost'
      : 'localhost';

  return `http://${hostname}:5000`;
};

if (!configuredApiUrl && import.meta.env.PROD) {
  throw new Error('VITE_API_URL must be configured for production builds.');
}

export const API_BASE_URL = (configuredApiUrl || getLocalBackendUrl()).replace(/\/+$/, '');

export const API_ENDPOINTS = {
  SEARCH: `${API_BASE_URL}/api/search`,
  GET_URL: `${API_BASE_URL}/api/url`,
  HEALTH: `${API_BASE_URL}/api/health`,
  STREAM: `${API_BASE_URL}/api/stream`,
};
