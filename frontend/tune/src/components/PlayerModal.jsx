import React, { useRef } from 'react';
import {
  ChevronDown,
  Heart,
  Plus,
  Play,
  Pause,
  SkipBack,
  SkipForward,
  RotateCcw,
  RotateCw,
  Shuffle,
  Repeat,
  Repeat1,
  Sparkles,
  AlertCircle,
  Volume2,
  VolumeX,
  Loader2,
  Radio,
} from 'lucide-react';
import { usePlayer } from '../PlayerContext';
import { extractArtistFromTrack } from '../utils/artistHelper';

const formatTime = (ms) => {
  if (!ms || isNaN(ms)) return '0:00';
  const totalSeconds = Math.floor(ms / 1000);
  const mins = Math.floor(totalSeconds / 60);
  const secs = String(totalSeconds % 60).padStart(2, '0');
  return `${mins}:${secs}`;
};

export default function PlayerModal({ onOpenAddToPlaylist }) {
  const {
    currentTrack,
    isPlaying,
    isLoadingStream,
    position,
    duration,
    playbackError,
    isExpandedPlayerOpen,
    setIsExpandedPlayerOpen,
    playTrack,
    togglePlayPause,
    seekTo,
    skipForward,
    skipBackward,
    playNextInQueue,
    playPreviousInQueue,
    repeatMode,
    isShuffle,
    isArtistRadio,
    artistRecommendations,
    toggleRepeatMode,
    toggleShuffle,
    toggleArtistRadio,
    toggleSaveTrack,
    isTrackSaved,
    volume,
    isMuted,
    setVolume,
    toggleMute,
  } = usePlayer();

  const seekTrackRef = useRef(null);

  if (!isExpandedPlayerOpen || !currentTrack) return null;

  const singer = extractArtistFromTrack(currentTrack);
  const isSaved = isTrackSaved(currentTrack.id);
  const progressRatio = duration > 0 ? Math.min(position / duration, 1) : 0;
  const progressPercent = progressRatio * 100;

  const handleSeek = (e) => {
    if (!seekTrackRef.current || duration <= 0) return;
    const rect = seekTrackRef.current.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const ratio = Math.max(0, Math.min(1, clickX / rect.width));
    seekTo(ratio * duration);
  };

  // Filter recommendations to avoid showing the currently playing song
  const filteredRecs = (artistRecommendations || []).filter(
    (t) => String(t.id) !== String(currentTrack.id)
  );

  return (
    <div className="modal-overlay" onClick={() => setIsExpandedPlayerOpen(false)}>
      <div
        className="expanded-player-card"
        style={{ maxHeight: '90vh', overflowY: 'auto' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="expanded-header">
          <button
            className="btn-icon"
            onClick={() => setIsExpandedPlayerOpen(false)}
            title="Minimize"
          >
            <ChevronDown size={24} />
          </button>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span className="expanded-header-title">Now Playing</span>
            {isArtistRadio && (
              <span
                style={{
                  fontSize: 10,
                  backgroundColor: 'rgba(29, 185, 84, 0.2)',
                  color: 'var(--brand-green)',
                  padding: '2px 8px',
                  borderRadius: 10,
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: 0.5,
                }}
              >
                Artist Radio
              </span>
            )}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <button
              className={`btn-icon ${isSaved ? 'active' : ''}`}
              onClick={() => toggleSaveTrack(currentTrack)}
              title={isSaved ? 'Remove from Saved' : 'Save Track'}
            >
              <Heart size={20} fill={isSaved ? '#1DB954' : 'none'} />
            </button>
            <button
              className="btn-icon"
              onClick={() => {
                setIsExpandedPlayerOpen(false);
                onOpenAddToPlaylist && onOpenAddToPlaylist(currentTrack);
              }}
              title="Add to Playlist"
            >
              <Plus size={20} />
            </button>
          </div>
        </div>

        {/* Artwork */}
        <div className="expanded-artwork-box">
          <img
            src={currentTrack.thumbnail || 'https://via.placeholder.com/380?text=Audio'}
            alt={currentTrack.title}
            className="expanded-artwork"
          />
          {isLoadingStream && (
            <div className="expanded-loader-overlay">
              <Loader2 size={36} className="spinner" />
              <span style={{ fontSize: 13, fontWeight: 600 }}>Fetching Audio Stream...</span>
            </div>
          )}
        </div>

        {/* Info Row */}
        <div className="expanded-info-row">
          <div style={{ overflow: 'hidden', paddingRight: 12 }}>
            <h2 className="expanded-title" title={currentTrack.title}>
              {currentTrack.title}
            </h2>
            <p className="expanded-artist">
              {singer}
            </p>
          </div>
        </div>

        {/* Seek Bar */}
        <div
          className="progress-bar-slider"
          ref={seekTrackRef}
          onClick={handleSeek}
          style={{ height: 6, margin: '8px 0' }}
        >
          <div
            className="progress-bar-fill"
            style={{ width: `${progressPercent}%`, backgroundColor: 'var(--brand-green)' }}
          />
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'var(--text-muted)' }}>
          <span>{formatTime(position)}</span>
          <span>{formatTime(duration)}</span>
        </div>

        {/* Error notification */}
        {playbackError && (
          <div
            style={{
              backgroundColor: 'var(--danger-bg)',
              borderLeft: '3px solid var(--danger)',
              padding: '8px 12px',
              borderRadius: 6,
              marginTop: 12,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 8,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--danger)', fontSize: 12 }}>
              <AlertCircle size={16} />
              <span>{playbackError}</span>
            </div>
            <button
              className="btn-primary"
              style={{ padding: '4px 10px', fontSize: 12, backgroundColor: 'var(--danger)', color: '#fff' }}
              onClick={() => playTrack(currentTrack)}
            >
              Retry
            </button>
          </div>
        )}

        {/* Playback Controls */}
        <div className="expanded-controls-row">
          <button
            className={`btn-icon ${isShuffle ? 'active' : ''}`}
            onClick={toggleShuffle}
            title={isShuffle ? 'Shuffle: ON' : 'Shuffle: OFF'}
          >
            <Shuffle size={20} color={isShuffle ? 'var(--brand-green)' : 'var(--text-secondary)'} />
          </button>

          <button
            className="btn-icon"
            onClick={playPreviousInQueue}
            title="Previous Track"
            disabled={isLoadingStream}
          >
            <SkipBack size={26} />
          </button>

          <button
            className="expanded-play-btn"
            onClick={togglePlayPause}
            disabled={isLoadingStream}
            title={isPlaying ? 'Pause' : 'Play'}
          >
            {isLoadingStream ? (
              <Loader2 size={26} className="spinner" style={{ color: '#121212', borderWidth: 3 }} />
            ) : isPlaying ? (
              <Pause size={28} fill="#121212" />
            ) : (
              <Play size={28} fill="#121212" style={{ marginLeft: 3 }} />
            )}
          </button>

          <button
            className="btn-icon"
            onClick={playNextInQueue}
            title="Next Track"
            disabled={isLoadingStream}
          >
            <SkipForward size={26} />
          </button>

          <button
            className={`btn-icon ${repeatMode !== 'off' ? 'active' : ''}`}
            onClick={toggleRepeatMode}
            title={`Repeat: ${repeatMode.toUpperCase()}`}
          >
            {repeatMode === 'one' ? (
              <Repeat1 size={20} color="var(--brand-green)" />
            ) : (
              <Repeat size={20} color={repeatMode === 'all' ? 'var(--brand-green)' : 'var(--text-secondary)'} />
            )}
          </button>
        </div>

        {/* Jumps and Singer Autoplay Toggle */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 12, padding: '0 8px' }}>
          <div style={{ display: 'flex', gap: 14 }}>
            <button
              className="btn-icon"
              onClick={() => skipBackward(15000)}
              title="Rewind 15s"
              disabled={isLoadingStream}
            >
              <RotateCcw size={18} />
            </button>
            <button
              className="btn-icon"
              onClick={() => skipForward(15000)}
              title="Fast Forward 15s"
              disabled={isLoadingStream}
            >
              <RotateCw size={18} />
            </button>
          </div>

          {/* Autoplay Same Singer Button */}
          <button
            className="btn-secondary"
            onClick={toggleArtistRadio}
            style={{
              padding: '6px 12px',
              fontSize: 12,
              borderRadius: 20,
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              backgroundColor: isArtistRadio ? 'rgba(29, 185, 84, 0.15)' : 'var(--bg-card)',
              color: isArtistRadio ? 'var(--brand-green)' : 'var(--text-secondary)',
              border: `1px solid ${isArtistRadio ? 'var(--brand-green)' : 'var(--border-color)'}`,
            }}
            title="Automatically play songs by the same singer next"
          >
            <Sparkles size={14} />
            <span>{isArtistRadio ? 'Singer Radio ON' : 'Singer Radio OFF'}</span>
          </button>
        </div>

        {/* Volume Row */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, marginTop: 16 }}>
          <button className="btn-icon" onClick={toggleMute}>
            {isMuted || volume === 0 ? <VolumeX size={18} /> : <Volume2 size={18} />}
          </button>
          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={isMuted ? 0 : volume}
            onChange={(e) => setVolume(parseFloat(e.target.value))}
            className="volume-slider"
            style={{ width: 140 }}
          />
        </div>

        {/* More Songs by this Singer Section */}
        {filteredRecs.length > 0 && (
          <div style={{ marginTop: 24, borderTop: '1px solid var(--border-subtle)', paddingTop: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
              <Radio size={16} color="var(--brand-green)" />
              <span style={{ fontSize: 13, fontWeight: 700, color: '#fff' }}>
                Next from {singer}
              </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {filteredRecs.slice(0, 4).map((recTrack) => (
                <div
                  key={recTrack.id}
                  onClick={() => playTrack(recTrack, [recTrack, ...filteredRecs])}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '8px 10px',
                    borderRadius: 8,
                    backgroundColor: 'rgba(255, 255, 255, 0.04)',
                    cursor: 'pointer',
                    transition: 'background-color 0.15s ease',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.08)')}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.04)')}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, overflow: 'hidden', flex: 1 }}>
                    <img
                      src={recTrack.thumbnail || 'https://via.placeholder.com/36'}
                      alt=""
                      style={{ width: 36, height: 36, borderRadius: 4, objectFit: 'cover' }}
                    />
                    <div style={{ overflow: 'hidden' }}>
                      <div style={{ fontSize: 12, fontWeight: 600, color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {recTrack.title}
                      </div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                        {recTrack.uploader || singer}
                      </div>
                    </div>
                  </div>
                  <Play size={16} color="var(--brand-green)" style={{ flexShrink: 0, marginLeft: 8 }} />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
