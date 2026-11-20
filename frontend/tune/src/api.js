import { API_ENDPOINTS } from './config';

/**
 * Search for videos on YouTube
 * @param {string} query - The search query
 * @returns {Promise<Array>} Array of video objects with {id, title, url, duration, uploader, thumbnail}
 */
export const searchYouTube = async (query) => {
  if (!query || !query.trim()) {
    throw new Error('Search query cannot be empty');
  }

  try {
    // Format query so multi-word terms are passed as a single unified search argument
    const formattedQuery = query.trim().replace(/\s+/g, '+');
    const response = await fetch(API_ENDPOINTS.SEARCH, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query: formattedQuery }),
    });

    if (!response.ok) {
      throw new Error(`Server returned HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    if (data.success && Array.isArray(data.results)) {
      return data.results;
    } else if (data.success) {
      return [];
    } else {
      throw new Error(data.message || 'Search failed');
    }
  } catch (err) {
    console.error('Search error:', err);
    throw err;
  }
};

/**
 * Get stream URL for a YouTube video
 * @param {string} url - The YouTube video URL
 * @returns {Promise<string>} The audio stream URL
 */
export const fetchAudioURL = async (url) => {
  if (!url || !url.trim()) {
    throw new Error('Video URL cannot be empty');
  }

  try {
    const response = await fetch(API_ENDPOINTS.GET_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url: url.trim() }),
    });

    if (!response.ok) {
      throw new Error(`Server returned HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    if (data.success && data.result) {
      return data.result;
    } else {
      throw new Error(data.message || 'Failed to retrieve audio stream URL');
    }
  } catch (err) {
    console.error('Audio URL fetch error:', err);
    throw err;
  }
};

/**
 * Check if backend is running and healthy
 * @returns {Promise<boolean>}
 */
export const checkBackendHealth = async () => {
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 4000);
    const response = await fetch(API_ENDPOINTS.HEALTH, { signal: controller.signal });
    clearTimeout(timer);
    return response.ok;
  } catch {
    return false;
  }
};
