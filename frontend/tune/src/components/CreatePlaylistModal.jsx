import React, { useState } from 'react';
import { X } from 'lucide-react';
import { usePlayer } from '../PlayerContext';

export default function CreatePlaylistModal({ isOpen, onClose }) {
  const [name, setName] = useState('');
  const { createPlaylist } = usePlayer();

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (name.trim()) {
      createPlaylist(name.trim());
      setName('');
      onClose();
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="dialog-card" onClick={(e) => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h2 className="dialog-title">New Playlist</h2>
          <button className="btn-icon" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <input
            type="text"
            className="dialog-input"
            placeholder="Give your playlist a title..."
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoFocus
          />

          <div className="dialog-actions">
            <button type="button" className="btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button
              type="submit"
              className="btn-primary"
              disabled={!name.trim()}
              style={{ opacity: name.trim() ? 1 : 0.5 }}
            >
              Create
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

