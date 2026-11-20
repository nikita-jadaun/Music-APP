import React, { useState } from 'react';
import { X, Plus, Check, ListMusic, PlusCircle } from 'lucide-react';
import { usePlayer } from '../PlayerContext';

export default function AddToPlaylistModal({ track, onClose }) {
  const { playlists, addToPlaylist, removeFromPlaylist, createPlaylist } = usePlayer();
  const [isCreatingInline, setIsCreatingInline] = useState(false);
  const [newPlaylistTitle, setNewPlaylistTitle] = useState('');

  if (!track) return null;

  const handleCreateAndAdd = (e) => {
    e.preventDefault();
    if (newPlaylistTitle.trim()) {
      const pl = createPlaylist(newPlaylistTitle.trim());
      if (pl) {
        addToPlaylist(pl.id, track);
      }
      setNewPlaylistTitle('');
      setIsCreatingInline(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="dialog-card" onClick={(e) => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h2 className="dialog-title">Add to Playlist</h2>
          <button className="btn-icon" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        {/* Selected Track Preview */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20, paddingBottom: 16, borderBottom: '1px solid var(--border-subtle)' }}>
          <img
            src={track.thumbnail || 'https://via.placeholder.com/48?text=Song'}
            alt={track.title}
            style={{ width: 44, height: 44, borderRadius: 6, objectFit: 'cover', backgroundColor: '#282828' }}
          />
          <div style={{ overflow: 'hidden', flex: 1 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {track.title}
            </div>
            <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
              {track.uploader || 'YouTube'}
            </div>
          </div>
        </div>

        {/* Inline Create Form */}
        {isCreatingInline ? (
          <form onSubmit={handleCreateAndAdd} style={{ marginBottom: 16 }}>
            <div style={{ display: 'flex', gap: 8 }}>
              <input
                type="text"
                className="dialog-input"
                style={{ marginBottom: 0, flex: 1 }}
                placeholder="Playlist name..."
                value={newPlaylistTitle}
                onChange={(e) => setNewPlaylistTitle(e.target.value)}
                autoFocus
              />
              <button
                type="submit"
                className="btn-primary"
                style={{ padding: '8px 16px', fontSize: 13 }}
                disabled={!newPlaylistTitle.trim()}
              >
                Save
              </button>
              <button
                type="button"
                className="btn-secondary"
                style={{ padding: '8px 12px' }}
                onClick={() => setIsCreatingInline(false)}
              >
                Cancel
              </button>
            </div>
          </form>
        ) : (
          <button
            type="button"
            className="sidebar-playlist-item"
            style={{
              padding: '10px 14px',
              backgroundColor: 'var(--bg-secondary)',
              borderRadius: 8,
              marginBottom: 12,
              color: 'var(--brand-green)',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              border: '1px dashed var(--brand-green)',
            }}
            onClick={() => setIsCreatingInline(true)}
          >
            <PlusCircle size={18} />
            <span>Create new playlist for this song</span>
          </button>
        )}

        {/* Existing Playlists List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 260, overflowY: 'auto', marginBottom: 20 }}>
          {playlists.map((pl) => {
            const tracksList = Array.isArray(pl.tracks) ? pl.tracks : [];
            const isInPlaylist = tracksList.some((t) => String(t.id) === String(track.id));

            return (
              <div
                key={pl.id}
                onClick={() => {
                  if (isInPlaylist) {
                    removeFromPlaylist(pl.id, track.id);
                  } else {
                    addToPlaylist(pl.id, track);
                  }
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '10px 14px',
                  borderRadius: 8,
                  backgroundColor: isInPlaylist ? 'var(--bg-active)' : 'var(--bg-secondary)',
                  cursor: 'pointer',
                  border: isInPlaylist ? '1px solid var(--brand-green)' : '1px solid transparent',
                  transition: 'all 0.15s ease',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <ListMusic size={18} color="var(--brand-green)" />
                  <span style={{ fontSize: 14, fontWeight: 600 }}>{pl.name}</span>
                  <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>({tracksList.length} tracks)</span>
                </div>
                {isInPlaylist ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--brand-green)', fontSize: 12, fontWeight: 700 }}>
                    <Check size={18} />
                    <span>Added</span>
                  </div>
                ) : (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--text-secondary)', fontSize: 12 }}>
                    <Plus size={18} />
                    <span>Add</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div className="dialog-actions">
          <button type="button" className="btn-primary" onClick={onClose} style={{ width: '100%' }}>
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
