import React, { useState, useRef } from 'react';
import {
  Search,
  X,
  Heart,
  Plus,
  Play,
  Pause,
  AlertCircle,
  Loader2,
  Music2,
} from 'lucide-react';
import { searchYouTube } from '../api';
import { usePlayer } from '../PlayerContext';

const formatTime = (seconds) => {
  if (!seconds || isNaN(seconds)) return '0:00';
  const mins = Math.floor(seconds / 60);
  const secs = String(Math.floor(seconds % 60)).padStart(2, '0');
  return `${mins}:${secs}`;
};

export default function SearchScreen({ onOpenAddToPlaylist }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const {
    playTrack,
    currentTrack,
    isPlaying,
    isLoadingStream,
    toggleSaveTrack,
    isTrackSaved,
    isBackendConnected,
  } = usePlayer();

  const searchRequestIdRef = useRef(0);

  const executeSearch = async (searchQuery) => {
    const trimmed = searchQuery.trim();
    if (!trimmed) {
      setResults([]);
      setError(null);
      setLoading(false);
      return;
    }

    const currentRequestId = ++searchRequestIdRef.current;
    setLoading(true);
    setError(null);

    try {
      const searchResults = await searchYouTube(trimmed);

      if (currentRequestId === searchRequestIdRef.current) {
        setResults(searchResults);
      }
    } catch (err) {
      if (currentRequestId === searchRequestIdRef.current) {
        console.error('Search error:', err);
        setError(err.message || 'Error searching YouTube. Please ensure backend is running.');
        setResults([]);
      }
    } finally {
      if (currentRequestId === searchRequestIdRef.current) {
        setLoading(false);
      }
    }
  };

  const handleClear = () => {
    setQuery('');
    setResults([]);
    setError(null);
    setLoading(false);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      executeSearch(query);
    }
  };

  return (
    <div>
      {/* Header */}
      <div className="greeting-header">
        <h1>Search YouTube</h1>
        <p>Find any track, album, remix, or live performance to stream as pure audio.</p>
      </div>

      {/* Search Input Bar */}
      <div className="search-bar-container">
        <div className="search-input-box">
          <Search size={20} color="var(--text-secondary)" />
          <input
            type="text"
            className="search-input"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Search songs, artists, or paste keywords..."
            autoFocus
          />
          {query.length > 0 && (
            <button className="btn-icon" onClick={handleClear} title="Clear">
              <X size={18} />
            </button>
          )}
          <button
            className="search-submit-btn"
            onClick={() => executeSearch(query)}
            title="Search"
          >
            <Search size={18} />
          </button>
        </div>
      </div>

      {/* Loading state */}
      {loading && (
        <div className="empty-box">
          <Loader2 size={36} className="spinner" style={{ marginBottom: 12 }} />
          <h3 className="empty-box-title">Searching YouTube...</h3>
          <p className="empty-box-sub">Fetching high-quality metadata via yt-dlp backend</p>
        </div>
      )}

      {/* Error state */}
      {error && !loading && (
        <div className="empty-box" style={{ borderColor: 'var(--danger)' }}>
          <div className="empty-box-icon" style={{ color: 'var(--danger)' }}>
            <AlertCircle size={32} />
          </div>
          <h3 className="empty-box-title" style={{ color: 'var(--danger)' }}>Search Failed</h3>
          <p className="empty-box-sub">{error}</p>
          <button className="btn-primary" onClick={() => executeSearch(query)}>
            Retry Search
          </button>
        </div>
      )}

      {/* Empty results */}
      {!loading && !error && query.trim().length > 0 && results.length === 0 && (
        <div className="empty-box">
          <div className="empty-box-icon">
            <Search size={32} />
          </div>
          <h3 className="empty-box-title">No results found</h3>
          <p className="empty-box-sub">Try searching with different keywords or spelling.</p>
        </div>
      )}

      {/* Initial state placeholder */}
      {!loading && !error && query.trim().length === 0 && results.length === 0 && (
        <div className="empty-box">
          <div className="empty-box-icon">
            <Music2 size={32} />
          </div>
          <h3 className="empty-box-title">Discover Music</h3>
          <p className="empty-box-sub">
            Type any song name, artist, or YouTube title above and hit search to start listening.
          </p>
        </div>
      )}

      {/* Results List */}
      {!loading && !error && results.length > 0 && (
        <div className="section-container">
          <div className="section-header-row">
            <h2 className="section-title">Search Results ({results.length})</h2>
          </div>

          <div className="track-list-table">
            {results.map((track) => {
              const isCurrent = currentTrack?.id === track.id;
              const isSaved = isTrackSaved(track.id);

              return (
                <div
                  key={track.id}
                  className={`track-row ${isCurrent ? 'active' : ''}`}
                  onClick={() => playTrack(track, results)}
                >
                  <img
                    src={track.thumbnail || 'https://via.placeholder.com/48?text=Song'}
                    alt={track.title}
                    className="track-row-thumb"
                  />

                  <div className="track-row-info">
                    <div className="track-row-title" title={track.title}>
                      {track.title}
                    </div>
                    <div className="track-row-artist" title={track.uploader}>
                      {track.uploader || 'YouTube'}
                    </div>
                  </div>

                  <div className="track-row-meta">
                    <button
                      className={`btn-icon ${isSaved ? 'active' : ''}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleSaveTrack(track);
                      }}
                      title={isSaved ? 'Remove from Saved' : 'Save to Favorites'}
                    >
                      <Heart size={16} fill={isSaved ? '#1DB954' : 'none'} />
                    </button>

                    <button
                      className="btn-icon"
                      onClick={(e) => {
                        e.stopPropagation();
                        onOpenAddToPlaylist(track);
                      }}
                      title="Add to Playlist"
                    >
                      <Plus size={16} />
                    </button>

                    <span className="track-duration">{formatTime(track.duration)}</span>

                    <div style={{ width: 28, display: 'flex', justifyContent: 'center' }}>
                      {isCurrent && isLoadingStream ? (
                        <Loader2 size={18} className="spinner" />
                      ) : isCurrent && isPlaying ? (
                        <Pause size={18} style={{ color: 'var(--brand-green)' }} />
                      ) : (
                        <Play size={18} style={{ color: isCurrent ? 'var(--brand-green)' : 'var(--text-muted)' }} />
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

