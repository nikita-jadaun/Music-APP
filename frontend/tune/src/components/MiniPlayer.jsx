import React, { useRef } from 'react';
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  RotateCcw,
  RotateCw,
  Heart,
  Plus,
  Volume2,
  VolumeX,
  Maximize2,
  Loader2,
  Shuffle,
  Repeat,
  Repeat1,
  Sparkles,
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

export default function MiniPlayer({ onOpenAddToPlaylist }) {
  const {
    currentTrack,
    isPlaying,
    isLoadingStream,
    position,
    duration,
    togglePlayPause,
    seekTo,
    skipForward,
    skipBackward,
    playNextInQueue,
    playPreviousInQueue,
    repeatMode,
    isShuffle,
    isArtistRadio,
    toggleRepeatMode,
    toggleShuffle,
    toggleArtistRadio,
    volume,
    isMuted,
    setVolume,
    toggleMute,
    toggleSaveTrack,
    isTrackSaved,
    setIsExpandedPlayerOpen,
  } = usePlayer();

  const progressSliderRef = useRef(null);

  if (!currentTrack) return null;

  const singer = extractArtistFromTrack(currentTrack);
  const isSaved = isTrackSaved(currentTrack.id);
  const progressRatio = duration > 0 ? Math.min(position / duration, 1) : 0;
  const progressPercent = progressRatio * 100;

  const handleSeekClick = (e) => {
    if (!progressSliderRef.current || duration <= 0) return;
    const rect = progressSliderRef.current.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const ratio = Math.max(0, Math.min(1, clickX / rect.width));
    seekTo(ratio * duration);
  };

  return (
    <div className="bottom-player-bar">
      {/* Top Edge Progress Bar for Mobile/Quick visual */}
      <div className="mini-player-top-progress" onClick={handleSeekClick}>
        <div className="mini-player-top-fill" style={{ width: `${progressPercent}%` }} />
      </div>

      {/* Left: Track Information */}
      <div className="player-left">
        <img
          src={currentTrack.thumbnail || 'https://via.placeholder.com/64?text=Audio'}
          alt={currentTrack.title}
          className="player-thumb"
          onClick={() => setIsExpandedPlayerOpen(true)}
        />
        <div className="player-track-info">
          <span
            className="player-title"
            title={currentTrack.title}
            onClick={() => setIsExpandedPlayerOpen(true)}
          >
            {currentTrack.title}
          </span>
          <span className="player-artist" title={singer}>
            {isLoadingStream ? 'Fetching audio stream...' : singer}
          </span>
        </div>
        <button
          className={`btn-icon ${isSaved ? 'active' : ''}`}
          onClick={() => toggleSaveTrack(currentTrack)}
          title={isSaved ? 'Remove from Saved' : 'Save to Favorites'}
        >
          <Heart size={18} fill={isSaved ? '#1DB954' : 'none'} />
        </button>
        <button
          className="btn-icon"
          onClick={() => onOpenAddToPlaylist && onOpenAddToPlaylist(currentTrack)}
          title="Add to Playlist"
        >
          <Plus size={18} />
        </button>
      </div>

      {/* Center: Playback Controls & Timeline Slider */}
      <div className="player-center">
        <div className="player-controls-row">
          <button
            className={`btn-icon ${isShuffle ? 'active' : ''}`}
            onClick={toggleShuffle}
            title={isShuffle ? 'Shuffle: ON' : 'Shuffle: OFF'}
          >
            <Shuffle size={16} color={isShuffle ? 'var(--brand-green)' : 'var(--text-secondary)'} />
          </button>

          <button
            className="btn-icon"
            onClick={playPreviousInQueue}
            title="Previous Track"
            disabled={isLoadingStream}
          >
            <SkipBack size={20} />
          </button>

          <button
            className="play-circle-btn"
            onClick={togglePlayPause}
            disabled={isLoadingStream}
            title={isPlaying ? 'Pause' : 'Play'}
          >
            {isLoadingStream ? (
              <Loader2 size={20} className="spinner" style={{ color: '#121212', borderWidth: 2 }} />
            ) : isPlaying ? (
              <Pause size={20} fill="#121212" />
            ) : (
              <Play size={20} fill="#121212" style={{ marginLeft: 2 }} />
            )}
          </button>

          <button
            className="btn-icon"
            onClick={playNextInQueue}
            title="Next Track"
            disabled={isLoadingStream}
          >
            <SkipForward size={20} />
          </button>

          <button
            className={`btn-icon ${repeatMode !== 'off' ? 'active' : ''}`}
            onClick={toggleRepeatMode}
            title={`Repeat: ${repeatMode.toUpperCase()}`}
          >
            {repeatMode === 'one' ? (
              <Repeat1 size={16} color="var(--brand-green)" />
            ) : (
              <Repeat size={16} color={repeatMode === 'all' ? 'var(--brand-green)' : 'var(--text-secondary)'} />
            )}
          </button>

          <button
            className={`btn-icon ${isArtistRadio ? 'active' : ''}`}
            onClick={toggleArtistRadio}
            title={`Same Singer Autoplay: ${isArtistRadio ? 'ON ✨' : 'OFF'}`}
          >
            <Sparkles size={16} color={isArtistRadio ? 'var(--brand-green)' : 'var(--text-secondary)'} />
          </button>
        </div>

        <div className="player-progress-bar-row">
          <span className="progress-time">{formatTime(position)}</span>
          <div
            className="progress-bar-slider"
            ref={progressSliderRef}
            onClick={handleSeekClick}
          >
            <div
              className="progress-bar-fill"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          <span className="progress-time">{formatTime(duration)}</span>
        </div>
      </div>

      {/* Right: Volume & Expand Full Player */}
      <div className="player-right">
        <div className="volume-bar-container">
          <button className="btn-icon" onClick={toggleMute} title={isMuted ? 'Unmute' : 'Mute'}>
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
            title={`Volume: ${Math.round((isMuted ? 0 : volume) * 100)}%`}
          />
        </div>

        <button
          className="btn-icon"
          onClick={() => setIsExpandedPlayerOpen(true)}
          title="Open Fullscreen Player"
        >
          <Maximize2 size={18} />
        </button>
      </div>
    </div>
  );
}
