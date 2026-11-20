import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { fetchAudioURL, checkBackendHealth, searchYouTube } from './api';
import { API_BASE_URL } from './config';
import { extractArtistFromTrack } from './utils/artistHelper';

const PlayerContext = createContext();

const STORAGE_KEYS = {
  RECENT: 'groovy_recent_tracks',
  SAVED: 'groovy_saved_tracks',
  PLAYLISTS: 'groovy_playlists',
  VOLUME: 'groovy_volume',
};

const getStoredItem = (key, fallback) => {
  try {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : fallback;
  } catch {
    return fallback;
  }
};

const setStoredItem = (key, value) => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.warn('LocalStorage save failed:', e);
  }
};

export const PlayerProvider = ({ children }) => {
  const [currentTrack, setCurrentTrack] = useState(null);
  const [audioUrl, setAudioUrl] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoadingStream, setIsLoadingStream] = useState(false);
  const [position, setPosition] = useState(0); // in milliseconds
  const [duration, setDuration] = useState(0); // in milliseconds
  const [playbackError, setPlaybackError] = useState(null);
  const [volume, setVolumeState] = useState(() => getStoredItem(STORAGE_KEYS.VOLUME, 0.8));
  const [isMuted, setIsMuted] = useState(false);
  const [queue, setQueueState] = useState([]);
  const [isExpandedPlayerOpen, setIsExpandedPlayerOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);
  const [repeatMode, setRepeatModeState] = useState('all'); // 'all', 'one', 'off'
  const [isShuffle, setIsShuffleState] = useState(false);
  const [isArtistRadio, setIsArtistRadioState] = useState(true); // Autoplay same singer
  const [artistRecommendations, setArtistRecommendations] = useState([]);

  // User Library State
  const [recentTracks, setRecentTracks] = useState(() => getStoredItem(STORAGE_KEYS.RECENT, []));
  const [savedTracks, setSavedTracks] = useState(() => getStoredItem(STORAGE_KEYS.SAVED, []));
  const [playlists, setPlaylists] = useState(() => {
    const stored = getStoredItem(STORAGE_KEYS.PLAYLISTS, null);
    if (Array.isArray(stored) && stored.length > 0) {
      return stored.map((p) => ({
        ...p,
        tracks: Array.isArray(p.tracks) ? p.tracks : [],
      }));
    }
    return [
      { id: 'favorites', name: 'My Favorites', tracks: [] },
      { id: 'chill', name: 'Chill Vibes', tracks: [] },
    ];
  });
  const [isBackendConnected, setIsBackendConnected] = useState(true);

  const audioRef = useRef(null);
  const playRequestIdRef = useRef(0);
  const toastTimeoutRef = useRef(null);
  const lastPrevClickTimeRef = useRef(0);

  // Fresh mutable refs to avoid stale closures in audio events
  const queueRef = useRef([]);
  const currentTrackRef = useRef(null);
  const recentTracksRef = useRef(recentTracks);
  const savedTracksRef = useRef(savedTracks);
  const repeatModeRef = useRef(repeatMode);
  const isShuffleRef = useRef(isShuffle);
  const isArtistRadioRef = useRef(isArtistRadio);
  const artistRecsCacheRef = useRef({}); // Cache recommendations by artist name

  useEffect(() => {
    queueRef.current = queue;
  }, [queue]);

  useEffect(() => {
    currentTrackRef.current = currentTrack;
  }, [currentTrack]);

  useEffect(() => {
    recentTracksRef.current = recentTracks;
  }, [recentTracks]);

  useEffect(() => {
    savedTracksRef.current = savedTracks;
  }, [savedTracks]);

  useEffect(() => {
    repeatModeRef.current = repeatMode;
  }, [repeatMode]);

  useEffect(() => {
    isShuffleRef.current = isShuffle;
  }, [isShuffle]);

  useEffect(() => {
    isArtistRadioRef.current = isArtistRadio;
  }, [isArtistRadio]);

  const showToast = (message) => {
    if (toastTimeoutRef.current) {
      clearTimeout(toastTimeoutRef.current);
    }
    setToastMessage(message);
    toastTimeoutRef.current = setTimeout(() => {
      setToastMessage(null);
    }, 2800);
  };

  const setQueue = (newQueue) => {
    const safeQueue = Array.isArray(newQueue) ? newQueue : [];
    queueRef.current = safeQueue;
    setQueueState(safeQueue);
  };

  // Helper to fetch or get cached recommendations for a singer
  const getSingerRecommendations = async (track) => {
    if (!track) return [];
    const artist = extractArtistFromTrack(track);
    if (!artist || artist === 'Music') return [];

    const cacheKey = artist.toLowerCase();
    if (artistRecsCacheRef.current[cacheKey]) {
      return artistRecsCacheRef.current[cacheKey];
    }

    try {
      console.log('🎵 Fetching recommended songs for singer:', artist);
      const results = await searchYouTube(`${artist} songs`);
      if (Array.isArray(results) && results.length > 0) {
        artistRecsCacheRef.current[cacheKey] = results;
        setArtistRecommendations(results);
        return results;
      }
    } catch (err) {
      console.warn('Could not fetch singer recommendations:', err);
    }
    return [];
  };

  // Pre-fetch recommendations in background whenever track changes
  useEffect(() => {
    if (currentTrack && isArtistRadio) {
      getSingerRecommendations(currentTrack);
    }
  }, [currentTrack?.id, isArtistRadio]);

  // Play next track in queue with smart singer recommendations
  const playNextInQueue = async () => {
    const current = currentTrackRef.current;
    let effectiveQueue = queueRef.current;

    // 1. If shuffle is active and queue has multiple tracks
    if (isShuffleRef.current && effectiveQueue.length > 1 && current) {
      const otherTracks = effectiveQueue.filter((t) => String(t.id) !== String(current.id));
      const randomIndex = Math.floor(Math.random() * otherTracks.length);
      const nextTrack = otherTracks[randomIndex];
      showToast(`Next: "${nextTrack.title.slice(0, 24)}..." 🔀`);
      playTrack(nextTrack, effectiveQueue);
      return;
    }

    // 2. Check position in current user queue
    const currentIndex = current
      ? effectiveQueue.findIndex((t) => String(t.id) === String(current.id))
      : -1;

    // If there is another song further down the user's queue, play it!
    if (currentIndex !== -1 && currentIndex < effectiveQueue.length - 1) {
      const nextTrack = effectiveQueue[currentIndex + 1];
      showToast(`Next: "${nextTrack.title.slice(0, 24)}..." ⏭️`);
      playTrack(nextTrack, effectiveQueue);
      return;
    }

    // 3. At the end of queue (or queue has 1 track): Play songs recommended for the same singer!
    if (isArtistRadioRef.current && current) {
      const singer = extractArtistFromTrack(current);
      showToast(`Finding more songs by ${singer}... ✨`);

      let recs = await getSingerRecommendations(current);

      if (recs && recs.length > 0) {
        // Filter out the current song and songs already in effectiveQueue
        const unplayedRecs = recs.filter(
          (r) =>
            String(r.id) !== String(current.id) &&
            !effectiveQueue.some((q) => String(q.id) === String(r.id))
        );

        const nextRec = unplayedRecs.length > 0 ? unplayedRecs[0] : recs.find((r) => String(r.id) !== String(current.id));

        if (nextRec) {
          showToast(`More by ${singer}: "${nextRec.title.slice(0, 22)}..." 🎵`);
          // Append new singer recommendations to queue so music flows endlessly
          const newQueue = [...effectiveQueue, nextRec];
          playTrack(nextRec, newQueue);
          return;
        }
      }
    }

    // 4. Fallback: Loop back to start of queue or recent tracks
    if (!effectiveQueue || effectiveQueue.length === 0) {
      if (recentTracksRef.current.length > 0) effectiveQueue = recentTracksRef.current;
      else if (savedTracksRef.current.length > 0) effectiveQueue = savedTracksRef.current;
    }

    if (effectiveQueue && effectiveQueue.length > 0) {
      const nextTrack = effectiveQueue[0];
      showToast(`Next: "${nextTrack.title.slice(0, 24)}..." ⏭️`);
      playTrack(nextTrack, effectiveQueue);
    } else {
      showToast('End of queue');
    }
  };

  // Play previous track in queue
  const playPreviousInQueue = () => {
    const audio = audioRef.current;
    const now = Date.now();
    const isDoubleClicked = now - lastPrevClickTimeRef.current < 1500;
    lastPrevClickTimeRef.current = now;

    // If more than 3 seconds in and not clicked rapidly, restart current song
    if (audio && audio.currentTime > 3 && !isDoubleClicked) {
      audio.currentTime = 0;
      setPosition(0);
      showToast('Restarted track');
      return;
    }

    let effectiveQueue = queueRef.current;
    if (!effectiveQueue || effectiveQueue.length === 0) {
      if (recentTracksRef.current.length > 0) effectiveQueue = recentTracksRef.current;
      else if (savedTracksRef.current.length > 0) effectiveQueue = savedTracksRef.current;
    }

    if (!effectiveQueue || effectiveQueue.length === 0) {
      if (audio) {
        audio.currentTime = 0;
        setPosition(0);
      }
      return;
    }

    const current = currentTrackRef.current;
    if (!current) {
      playTrack(effectiveQueue[0], effectiveQueue);
      return;
    }

    const currentIndex = effectiveQueue.findIndex((t) => String(t.id) === String(current.id));

    let prevTrack;
    if (currentIndex > 0) {
      prevTrack = effectiveQueue[currentIndex - 1];
    } else {
      // Wrap to end
      prevTrack = effectiveQueue[effectiveQueue.length - 1];
    }

    if (prevTrack) {
      showToast(`Previous: "${prevTrack.title.slice(0, 24)}..." ⏮️`);
      playTrack(prevTrack, effectiveQueue);
    }
  };

  const toggleRepeatMode = () => {
    const modes = ['all', 'one', 'off'];
    const nextIndex = (modes.indexOf(repeatMode) + 1) % modes.length;
    const nextMode = modes[nextIndex];
    setRepeatModeState(nextMode);
    repeatModeRef.current = nextMode;
    showToast(`Repeat mode: ${nextMode.toUpperCase()}`);
  };

  const toggleShuffle = () => {
    const nextShuffle = !isShuffle;
    setIsShuffleState(nextShuffle);
    isShuffleRef.current = nextShuffle;
    showToast(`Shuffle: ${nextShuffle ? 'ON 🔀' : 'OFF'}`);
  };

  const toggleArtistRadio = () => {
    const nextRadio = !isArtistRadio;
    setIsArtistRadioState(nextRadio);
    isArtistRadioRef.current = nextRadio;
    showToast(`Same Singer Autoplay: ${nextRadio ? 'ON ✨' : 'OFF'}`);
  };

  // Initialize Audio element
  useEffect(() => {
    const audio = new Audio();
    audio.preload = 'auto';
    audio.volume = volume;
    audioRef.current = audio;

    const handleTimeUpdate = () => {
      if (audio.currentTime !== undefined && !isNaN(audio.currentTime)) {
        setPosition(Math.floor(audio.currentTime * 1000));
      }
    };

    const handleLoadedMetadata = () => {
      if (audio.duration && !isNaN(audio.duration)) {
        setDuration(Math.floor(audio.duration * 1000));
      }
    };

    const handleDurationChange = () => {
      if (audio.duration && !isNaN(audio.duration)) {
        setDuration(Math.floor(audio.duration * 1000));
      }
    };

    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);
    const handleWaiting = () => setIsLoadingStream(true);
    const handlePlaying = () => {
      setIsLoadingStream(false);
      setIsPlaying(true);
    };

    const handleEnded = () => {
      setIsPlaying(false);
      setPosition(0);

      if (repeatModeRef.current === 'one') {
        audio.currentTime = 0;
        audio.play().catch(() => {});
      } else if (repeatModeRef.current !== 'off') {
        playNextInQueue();
      }
    };

    const handleError = (e) => {
      console.warn('Audio playback error event:', e);
      setIsLoadingStream(false);
      setIsPlaying(false);
      if (audio.src) {
        setPlaybackError('Audio streaming error. Please try again or check backend.');
      }
    };

    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('durationchange', handleDurationChange);
    audio.addEventListener('play', handlePlay);
    audio.addEventListener('pause', handlePause);
    audio.addEventListener('waiting', handleWaiting);
    audio.addEventListener('playing', handlePlaying);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('error', handleError);

    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('durationchange', handleDurationChange);
      audio.removeEventListener('play', handlePlay);
      audio.removeEventListener('pause', handlePause);
      audio.removeEventListener('waiting', handleWaiting);
      audio.removeEventListener('playing', handlePlaying);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('error', handleError);
      audio.pause();
      audio.src = '';
    };
  }, []);

  // Sync state with localStorage
  useEffect(() => {
    setStoredItem(STORAGE_KEYS.RECENT, recentTracks);
  }, [recentTracks]);

  useEffect(() => {
    setStoredItem(STORAGE_KEYS.SAVED, savedTracks);
  }, [savedTracks]);

  useEffect(() => {
    setStoredItem(STORAGE_KEYS.PLAYLISTS, playlists);
  }, [playlists]);

  useEffect(() => {
    setStoredItem(STORAGE_KEYS.VOLUME, volume);
  }, [volume]);

  // Auto-sync library to MongoDB when user is logged in
  useEffect(() => {
    const token = localStorage.getItem('groovy_auth_token');
    if (!token) return;

    const timer = setTimeout(() => {
      fetch(`${API_BASE_URL}/api/auth/sync`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          savedTracks,
          playlists,
          recentTracks,
        }),
      }).catch((e) => console.warn('Background MongoDB sync error:', e));
    }, 2000);

    return () => clearTimeout(timer);
  }, [savedTracks, playlists, recentTracks]);

  const loadUserLibrary = (library) => {
    if (!library) return;
    if (Array.isArray(library.savedTracks)) {
      setSavedTracks(library.savedTracks);
    }
    if (Array.isArray(library.playlists) && library.playlists.length > 0) {
      setPlaylists(library.playlists);
    }
    if (Array.isArray(library.recentTracks)) {
      setRecentTracks(library.recentTracks);
    }
  };

  // Periodic Backend Health Check
  useEffect(() => {
    checkBackendHealth().then(setIsBackendConnected);
    const interval = setInterval(() => {
      checkBackendHealth().then(setIsBackendConnected);
    }, 10000);
    return () => clearInterval(interval);
  }, []);

  const playTrack = async (track, contextQueue = null) => {
    if (!track || !track.url) {
      setPlaybackError('Invalid track selected');
      return;
    }

    if (contextQueue && Array.isArray(contextQueue)) {
      setQueue(contextQueue);
    } else if (queueRef.current.length === 0) {
      setQueue([track]);
    }

    const audio = audioRef.current;
    if (!audio) return;

    // If tapping current track that's already loaded
    if (currentTrack?.id === track.id && audio.src && !isLoadingStream) {
      await togglePlayPause();
      return;
    }

    const currentRequestId = ++playRequestIdRef.current;

    audio.pause();
    setCurrentTrack(track);
    currentTrackRef.current = track;
    setPlaybackError(null);
    setIsLoadingStream(true);
    setIsPlaying(false);
    setPosition(0);
    setDuration(track.duration ? track.duration * 1000 : 0);

    try {
      const streamUrl = await fetchAudioURL(track.url);

      if (currentRequestId !== playRequestIdRef.current) {
        return; // Discard superseded track selection
      }

      setAudioUrl(streamUrl);
      audio.src = streamUrl;
      audio.load();

      await audio.play();

      if (currentRequestId === playRequestIdRef.current) {
        setIsPlaying(true);
        setIsLoadingStream(false);

        // Add to Recent tracks
        setRecentTracks((prev) => {
          const filtered = prev.filter((t) => t.id !== track.id);
          return [track, ...filtered].slice(0, 30);
        });
      }
    } catch (err) {
      if (currentRequestId === playRequestIdRef.current) {
        console.error('Track playback failed:', err);
        setPlaybackError(err.message || 'Failed to stream audio file');
        setIsLoadingStream(false);
        setIsPlaying(false);
      }
    }
  };

  const togglePlayPause = async () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (!audio.src) {
      if (currentTrack) {
        await playTrack(currentTrack);
      }
      return;
    }

    try {
      if (isPlaying) {
        audio.pause();
      } else {
        await audio.play();
      }
    } catch (err) {
      console.error('Play/Pause toggle error:', err);
      setPlaybackError('Failed to control audio playback');
    }
  };

  const seekTo = (positionMillis) => {
    const audio = audioRef.current;
    if (!audio) return;

    const seconds = Math.max(0, positionMillis / 1000);
    audio.currentTime = seconds;
    setPosition(positionMillis);
  };

  const skipForward = (amountMs = 15000) => {
    seekTo(position + amountMs);
  };

  const skipBackward = (amountMs = 15000) => {
    seekTo(position - amountMs);
  };

  const setVolume = (val) => {
    const clamped = Math.max(0, Math.min(1, val));
    setVolumeState(clamped);
    if (audioRef.current) {
      audioRef.current.volume = clamped;
    }
    if (clamped > 0 && isMuted) {
      setIsMuted(false);
      if (audioRef.current) audioRef.current.muted = false;
    }
  };

  const toggleMute = () => {
    if (audioRef.current) {
      const nextMute = !isMuted;
      setIsMuted(nextMute);
      audioRef.current.muted = nextMute;
    }
  };

  const toggleSaveTrack = (track) => {
    if (!track) return;
    setSavedTracks((prev) => {
      const exists = prev.some((t) => t.id === track.id);
      if (exists) {
        showToast(`Removed from Saved`);
        return prev.filter((t) => t.id !== track.id);
      } else {
        showToast(`Saved to Favorites ❤️`);
        return [track, ...prev];
      }
    });
  };

  const isTrackSaved = (trackId) => {
    return savedTracks.some((t) => t.id === trackId);
  };

  const createPlaylist = (name) => {
    if (!name || !name.trim()) return null;
    const newPlaylist = {
      id: 'pl_' + Date.now().toString(),
      name: name.trim(),
      tracks: [],
    };
    setPlaylists((prev) => [...prev, newPlaylist]);
    showToast(`Created playlist "${name.trim()}"`);
    return newPlaylist;
  };

  const deletePlaylist = (playlistId) => {
    setPlaylists((prev) => prev.filter((pl) => String(pl.id) !== String(playlistId)));
    showToast('Playlist deleted');
  };

  const addToPlaylist = (playlistId, track) => {
    if (!playlistId || !track) return;
    let targetName = 'Playlist';
    setPlaylists((prev) =>
      prev.map((pl) => {
        if (String(pl.id) === String(playlistId)) {
          targetName = pl.name;
          const currentTracks = Array.isArray(pl.tracks) ? pl.tracks : [];
          const exists = currentTracks.some((t) => String(t.id) === String(track.id));
          if (!exists) {
            return { ...pl, tracks: [...currentTracks, track] };
          }
        }
        return pl;
      })
    );
    showToast(`Added to "${targetName}" ✅`);
  };

  const removeFromPlaylist = (playlistId, trackId) => {
    let targetName = 'Playlist';
    setPlaylists((prev) =>
      prev.map((pl) => {
        if (String(pl.id) === String(playlistId)) {
          targetName = pl.name;
          const currentTracks = Array.isArray(pl.tracks) ? pl.tracks : [];
          return {
            ...pl,
            tracks: currentTracks.filter((t) => String(t.id) !== String(trackId)),
          };
        }
        return pl;
      })
    );
    showToast(`Removed from "${targetName}"`);
  };

  return (
    <PlayerContext.Provider
      value={{
        currentTrack,
        audioUrl,
        isPlaying,
        isLoadingStream,
        position,
        duration,
        playbackError,
        volume,
        isMuted,
        queue,
        repeatMode,
        isShuffle,
        isArtistRadio,
        artistRecommendations,
        recentTracks,
        savedTracks,
        playlists,
        isBackendConnected,
        isExpandedPlayerOpen,
        toastMessage,
        showToast,
        setQueue,
        setIsExpandedPlayerOpen,
        playTrack,
        togglePlayPause,
        seekTo,
        skipForward,
        skipBackward,
        playNextInQueue,
        playPreviousInQueue,
        toggleRepeatMode,
        toggleShuffle,
        toggleArtistRadio,
        setVolume,
        toggleMute,
        toggleSaveTrack,
        isTrackSaved,
        createPlaylist,
        deletePlaylist,
        addToPlaylist,
        removeFromPlaylist,
        loadUserLibrary,
      }}
    >
      {children}
    </PlayerContext.Provider>
  );
};

export const usePlayer = () => useContext(PlayerContext);
