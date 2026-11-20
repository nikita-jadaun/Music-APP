import React, { useState, useRef } from 'react';
import {
  ArrowLeft,
  Play,
  Pause,
  Trash2,
  Music,
  Heart,
  Plus,
  Check,
  Search,
  Loader2,
  X,
} from 'lucide-react';
import { usePlayer } from '../PlayerContext';
import { searchYouTube } from '../api';

const formatTime = (seconds) => {
  if (!seconds || isNaN(seconds)) return '0:00';
  const mins = Math.floor(seconds / 60);
  const secs = String(Math.floor(seconds % 60)).padStart(2, '0');
  return `${mins}:${secs}`;
};

export default function PlaylistDetailsView({ playlistId, onBack }) {
  const {
    playlists,
    deletePlaylist,
    removeFromPlaylist,
    addToPlaylist,
    playTrack,
    currentTrack,
    isPlaying,
    isLoadingStream,
    toggleSaveTrack,
    isTrackSaved,
  } = usePlayer();

  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const searchRequestIdRef = useRef(0);

  const currentPl = playlists.find((p) => String(p.id) === String(playlistId)) || {
    id: playlistId,
    name: 'Playlist',
    tracks: [],
  };

  const tracks = Array.isArray(currentPl.tracks) ? currentPl.tracks : [];

  const handleDelete = () => {
    if (window.confirm(`Are you sure you want to delete playlist "${currentPl.name}"?`)) {
      deletePlaylist(currentPl.id);
      onBack();
    }
  };

  const handleSearch = async (query) => {
    const trimmed = query.trim();
    if (!trimmed) {
      setSearchResults([]);
      return;
    }

    const reqId = ++searchRequestIdRef.current;
    setIsSearching(true);
    try {
      const results = await searchYouTube(trimmed);
      if (reqId === searchRequestIdRef.current) {
        setSearchResults(results);
      }
    } catch (err) {
      console.error('Playlist search error:', err);
    } finally {
      if (reqId === searchRequestIdRef.current) {
        setIsSearching(false);
      }
    }
  };

  return (
    <div>
      {/* Top Navigation & Playlist Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 24 }}>
        <button className="btn-icon" onClick={onBack} title="Back">
          <ArrowLeft size={22} />
        </button>
        <div style={{ flex: 1 }}>
          <h1 style={{ fontSize: 28, fontWeight: 800 }}>{currentPl.name}</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: 13, marginTop: 4 }}>
            {tracks.length} tracks in collection
          </p>
        </div>
        <button
          className="btn-primary"
          style={{ padding: '8px 16px', fontSize: 13, display: 'flex', alignItems: 'center', gap: 6 }}
          onClick={() => setIsSearchOpen(!isSearchOpen)}
        >
          {isSearchOpen ? <X size={16} /> : <Plus size={16} />}
          <span>{isSearchOpen ? 'Close Search' : 'Find & Add Songs'}</span>
        </button>
        <button
          className="btn-icon"
          style={{ color: 'var(--danger)' }}
          onClick={handleDelete}
          title="Delete Playlist"
        >
          <Trash2 size={20} />
        </button>
      </div>

      {/* Inline Search Drawer for adding songs directly into this playlist */}
      {isSearchOpen && (
        <div
          style={{
            backgroundColor: 'var(--bg-secondary)',
            border: '1px solid var(--border-color)',
            borderRadius: 12,
            padding: 20,
            marginBottom: 28,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
            <Search size={18} color="var(--brand-green)" />
            <span style={{ fontSize: 15, fontWeight: 700 }}>
              Add songs to "{currentPl.name}"
            </span>
          </div>

          <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
            <input
              type="text"
              className="dialog-input"
              style={{ marginBottom: 0, flex: 1 }}
              placeholder="Search song, artist or video title..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                handleSearch(e.target.value);
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSearch(searchQuery);
              }}
              autoFocus
            />
            <button
              className="btn-primary"
              onClick={() => handleSearch(searchQuery)}
              style={{ display: 'flex', alignItems: 'center', gap: 6 }}
            >
              <Search size={16} />
              <span>Search</span>
            </button>
          </div>

          {isSearching && (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
              <Loader2 size={24} className="spinner" />
            </div>
          )}

          {searchResults.length > 0 && !isSearching && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 280, overflowY: 'auto' }}>
              {searchResults.map((track) => {
                const isInPlaylist = tracks.some((t) => String(t.id) === String(track.id));
                return (
                  <div
                    key={track.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '8px 12px',
                      backgroundColor: 'var(--bg-card)',
                      borderRadius: 8,
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, overflow: 'hidden', flex: 1 }}>
                      <img
                        src={track.thumbnail || 'https://via.placeholder.com/40'}
                        alt=""
                        style={{ width: 40, height: 40, borderRadius: 6, objectFit: 'cover' }}
                      />
                      <div style={{ overflow: 'hidden' }}>
                        <div style={{ fontSize: 13, fontWeight: 600, color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {track.title}
                        </div>
                        <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>
                          {track.uploader || 'YouTube'}
                        </div>
                      </div>
                    </div>

                    <button
                      className="btn-icon"
                      onClick={() => {
                        if (isInPlaylist) {
                          removeFromPlaylist(currentPl.id, track.id);
                        } else {
                          addToPlaylist(currentPl.id, track);
                        }
                      }}
                      style={{ color: isInPlaylist ? 'var(--brand-green)' : '#fff' }}
                      title={isInPlaylist ? 'Remove' : 'Add to playlist'}
                    >
                      {isInPlaylist ? <Check size={18} /> : <Plus size={18} />}
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Playlist Tracks Table */}
      {tracks.length > 0 ? (
        <div className="track-list-table">
          {tracks.map((track) => {
            const isCurrent = currentTrack?.id === track.id;
            const isSaved = isTrackSaved(track.id);

            return (
              <div
                key={track.id}
                className={`track-row ${isCurrent ? 'active' : ''}`}
                onClick={() => playTrack(track, tracks)}
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
                    title={isSaved ? 'Remove from Saved' : 'Save Track'}
                  >
                    <Heart size={16} fill={isSaved ? '#1DB954' : 'none'} />
                  </button>

                  <button
                    className="btn-icon"
                    onClick={(e) => {
                      e.stopPropagation();
                      removeFromPlaylist(currentPl.id, track.id);
                    }}
                    title="Remove from Playlist"
                  >
                    <Trash2 size={16} />
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
      ) : (
        <div className="empty-box">
          <div className="empty-box-icon">
            <Music size={32} />
          </div>
          <h3 className="empty-box-title">This playlist is empty</h3>
          <p className="empty-box-sub">
            Click <strong>"Find & Add Songs"</strong> above to search and add tracks right into this playlist.
          </p>
          <button className="btn-primary" onClick={() => setIsSearchOpen(true)}>
            Find Songs to Add
          </button>
        </div>
      )}
    </div>
  );
}
