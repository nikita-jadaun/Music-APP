/**
 * Dynamically resolves the backend host.
 * If running in a browser, uses current hostname so both desktop localhost
 * and LAN devices (like phones opening the web app) can reach the backend.
 */
const getBackendBaseUrl = () => {
  if (typeof window !== 'undefined' && window.location) {
    const hostname = window.location.hostname || 'localhost';
    return `http://${hostname}:5000`;
  }
  return 'http://localhost:5000';
};

export const API_BASE_URL = getBackendBaseUrl();

export const API_ENDPOINTS = {
  SEARCH: `${API_BASE_URL}/api/search`,
  GET_URL: `${API_BASE_URL}/api/url`,
  HEALTH: `${API_BASE_URL}/api/health`,
  STREAM: `${API_BASE_URL}/api/stream`,
};
