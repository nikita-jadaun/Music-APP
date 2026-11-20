import React from 'react';
import {
  Play,
  Pause,
  Heart,
  Plus,
  ListMusic,
  Clock,
  Music,
  Loader2,
} from 'lucide-react';
import { usePlayer } from '../PlayerContext';

const formatTime = (seconds) => {
  if (!seconds || isNaN(seconds)) return '0:00';
  const mins = Math.floor(seconds / 60);
  const secs = String(Math.floor(seconds % 60)).padStart(2, '0');
  return `${mins}:${secs}`;
};

export default function HomeScreen({ setActiveTab, onOpenCreatePlaylist, onSelectPlaylist, onOpenAddToPlaylist }) {
  const {
    recentTracks,
    savedTracks,
    playlists,
    playTrack,
    currentTrack,
    isPlaying,
    isLoadingStream,
    toggleSaveTrack,
    isTrackSaved,
  } = usePlayer();

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 18) return 'Good Afternoon';
    return 'Good Evening';
  };

  const renderTrackRow = (track, list) => {
    const isCurrent = currentTrack?.id === track.id;
    const isSaved = isTrackSaved(track.id);

    return (
      <div
        key={track.id}
        className={`track-row ${isCurrent ? 'active' : ''}`}
        onClick={() => playTrack(track, list)}
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
          <div className="track-row-artist" title={track.uploader || 'YouTube'}>
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
              onOpenAddToPlaylist(track);
            }}
            title="Add to Playlist"
          >
            <Plus size={16} />
          </button>

          <span className="track-duration">
            {formatTime(track.duration)}
          </span>

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
  };

  return (
    <div>
      {/* Top Welcome Banner */}
      <div className="greeting-header">
        <h1>{getGreeting()}</h1>
        <p>Explore, stream, and organize your favorite YouTube audio.</p>
      </div>

      {/* Recently Played */}
      <div className="section-container">
        <div className="section-header-row">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Clock size={20} color="var(--brand-green)" />
            <h2 className="section-title">Recently Played</h2>
          </div>
        </div>

        {recentTracks.length > 0 ? (
          <div className="cards-grid">
            {recentTracks.slice(0, 6).map((track) => {
              const isCurrent = currentTrack?.id === track.id;
              return (
                <div
                  key={track.id}
                  className={`track-card ${isCurrent ? 'active' : ''}`}
                  onClick={() => playTrack(track, recentTracks)}
                >
                  <div className="card-img-wrapper">
                    <img
                      src={track.thumbnail || 'https://via.placeholder.com/200?text=Audio'}
                      alt={track.title}
                      className="card-img"
                    />
                    <div className="card-hover-play">
                      {isCurrent && isPlaying ? (
                        <Pause size={20} fill="#121212" />
                      ) : (
                        <Play size={20} fill="#121212" style={{ marginLeft: 2 }} />
                      )}
                    </div>
                  </div>
                  <div className="card-title" title={track.title}>
                    {track.title}
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div className="card-subtitle" style={{ flex: 1 }} title={track.uploader}>
                      {track.uploader || 'YouTube'}
                    </div>
                    <button
                      className="btn-icon"
                      style={{ padding: 4 }}
                      onClick={(e) => {
                        e.stopPropagation();
                        onOpenAddToPlaylist(track);
                      }}
                      title="Add to Playlist"
                    >
                      <Plus size={16} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="empty-box">
            <div className="empty-box-icon">
              <Music size={28} />
            </div>
            <h3 className="empty-box-title">No history yet</h3>
            <p className="empty-box-sub">
              Tracks you stream will automatically appear here for quick access.
            </p>
            <button className="btn-primary" onClick={() => setActiveTab('search')}>
              Search & Play Music
            </button>
          </div>
        )}
      </div>

      {/* Saved Tracks (Favorites) */}
      <div className="section-container">
        <div className="section-header-row">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Heart size={20} color="var(--brand-green)" fill="var(--brand-green)" />
            <h2 className="section-title">Saved Tracks ({savedTracks.length})</h2>
          </div>
        </div>

        {savedTracks.length > 0 ? (
          <div className="track-list-table">
            {savedTracks.map((track) => renderTrackRow(track, savedTracks))}
          </div>
        ) : (
          <div className="empty-box">
            <div className="empty-box-icon">
              <Heart size={28} />
            </div>
            <h3 className="empty-box-title">No saved tracks</h3>
            <p className="empty-box-sub">
              Tap the heart icon on any song while searching to save it to your library.
            </p>
            <button className="btn-primary" onClick={() => setActiveTab('search')}>
              Find Songs to Save
            </button>
          </div>
        )}
      </div>

      {/* Playlists Grid */}
      <div className="section-container">
        <div className="section-header-row">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <ListMusic size={20} color="var(--brand-green)" />
            <h2 className="section-title">Your Playlists</h2>
          </div>
          <button
            className="btn-primary"
            style={{ padding: '8px 16px', fontSize: 13, display: 'flex', alignItems: 'center', gap: 6 }}
            onClick={onOpenCreatePlaylist}
          >
            <Plus size={16} />
            <span>New Playlist</span>
          </button>
        </div>

        {playlists.length > 0 ? (
          <div className="cards-grid">
            {playlists.map((pl) => (
              <div
                key={pl.id}
                className="track-card"
                onClick={() => onSelectPlaylist(pl)}
              >
                <div
                  className="card-img-wrapper"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: 'linear-gradient(135deg, #2a2a2a, #1a1a1a)',
                  }}
                >
                  <ListMusic size={48} color="var(--brand-green)" />
                </div>
                <div className="card-title">{pl.name}</div>
                <div className="card-subtitle">{Array.isArray(pl.tracks) ? pl.tracks.length : 0} tracks</div>
              </div>
            ))}
          </div>
        ) : (
          <div className="empty-box">
            <div className="empty-box-icon">
              <ListMusic size={28} />
            </div>
            <h3 className="empty-box-title">No playlists created</h3>
            <p className="empty-box-sub">
              Organize your YouTube audio discoveries into custom collections.
            </p>
            <button className="btn-primary" onClick={onOpenCreatePlaylist}>
              Create First Playlist
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
