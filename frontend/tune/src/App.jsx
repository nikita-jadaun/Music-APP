import React, { useState } from 'react';
import {
  Home,
  Search,
  Plus,
  ListMusic,
  Radio,
  User,
  LogOut,
  LogIn,
  UserPlus,
} from 'lucide-react';
import { AuthProvider, useAuth } from './AuthContext';
import { PlayerProvider, usePlayer } from './PlayerContext';
import HomeScreen from './components/HomeScreen';
import SearchScreen from './components/SearchScreen';
import PlaylistDetailsView from './components/PlaylistDetailsView';
import MiniPlayer from './components/MiniPlayer';
import PlayerModal from './components/PlayerModal';
import CreatePlaylistModal from './components/CreatePlaylistModal';
import AddToPlaylistModal from './components/AddToPlaylistModal';
import AuthModal from './components/AuthModal';

function MainApp() {
  const [activeTab, setActiveTab] = useState('home');
  const [selectedPlaylistId, setSelectedPlaylistId] = useState(null);
  const [isCreatePlaylistOpen, setIsCreatePlaylistOpen] = useState(false);
  const [trackForAddToPlaylist, setTrackForAddToPlaylist] = useState(null);

  const { isBackendConnected, playlists, toastMessage, showToast } = usePlayer();
  const { user, openAuthModal, logout } = useAuth();

  const handleSelectPlaylist = (pl) => {
    setSelectedPlaylistId(pl.id);
    setActiveTab('playlist');
  };

  const handleLogout = () => {
    logout();
    showToast('Logged out successfully');
  };

  return (
    <div className="app-layout">
      {/* Toast Notification */}
      {toastMessage && (
        <div
          style={{
            position: 'fixed',
            top: 24,
            left: '50%',
            transform: 'translateX(-50%)',
            backgroundColor: '#1E1E1E',
            color: '#fff',
            border: '1px solid var(--brand-green)',
            borderRadius: 30,
            padding: '10px 22px',
            fontSize: 14,
            fontWeight: 600,
            zIndex: 9999,
            boxShadow: '0 8px 24px rgba(0,0,0,0.6)',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            animation: 'fadeIn 0.2s ease',
          }}
        >
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Sidebar for Desktop */}
      <aside className="sidebar">
        {/* Brand */}
        <div className="brand-container">
          <div className="brand-logo-icon">
            <Radio size={22} />
          </div>
          <div>
            <div className="brand-title">Groovy</div>
            <div className="brand-sub">Audio Streamer</div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="nav-links">
          <button
            className={`nav-item ${activeTab === 'home' ? 'active' : ''}`}
            onClick={() => {
              setActiveTab('home');
              setSelectedPlaylistId(null);
            }}
          >
            <Home size={20} />
            <span>Home</span>
          </button>
          <button
            className={`nav-item ${activeTab === 'search' ? 'active' : ''}`}
            onClick={() => {
              setActiveTab('search');
              setSelectedPlaylistId(null);
            }}
          >
            <Search size={20} />
            <span>Search</span>
          </button>
        </nav>

        {/* Playlists in Sidebar */}
        <div className="sidebar-playlist-box">
          <div className="sidebar-playlist-header">
            <span>Playlists</span>
            <button
              className="sidebar-add-btn"
              onClick={() => setIsCreatePlaylistOpen(true)}
              title="Create Playlist"
            >
              <Plus size={18} />
            </button>
          </div>

          <div className="sidebar-playlist-list">
            {playlists.map((pl) => (
              <button
                key={pl.id}
                className={`sidebar-playlist-item ${
                  activeTab === 'playlist' && String(selectedPlaylistId) === String(pl.id) ? 'active' : ''
                }`}
                onClick={() => handleSelectPlaylist(pl)}
              >
                <ListMusic size={16} />
                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {pl.name}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* User Account Section at bottom of Sidebar */}
        <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: 14 }}>
          {user ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, overflow: 'hidden' }}>
                <div
                  style={{
                    width: 34,
                    height: 34,
                    borderRadius: '50%',
                    backgroundColor: 'var(--brand-green)',
                    color: '#121212',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 800,
                    fontSize: 14,
                    flexShrink: 0,
                  }}
                >
                  {user.name.charAt(0).toUpperCase()}
                </div>
                <div style={{ overflow: 'hidden' }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {user.name}
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {user.email}
                  </div>
                </div>
              </div>

              <button
                className="btn-icon"
                onClick={handleLogout}
                title="Log Out"
                style={{ color: 'var(--text-secondary)' }}
              >
                <LogOut size={16} />
              </button>
            </div>
          ) : null}
        </div>
      </aside>

      {/* Main Content View */}
      <div className="main-wrapper">
        {/* Top Header Bar */}
        <header className="top-bar">
          <div className="top-bar-left">
            <span style={{ fontWeight: 700, fontSize: 16, color: '#fff' }}>
              Groovy Music
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            {/* Backend connection pill */}
            <div className="status-badge">
              <div className={`status-dot ${isBackendConnected ? 'online' : 'offline'}`} />
              <span style={{ color: isBackendConnected ? 'var(--text-primary)' : 'var(--danger)' }}>
                {isBackendConnected ? 'Backend Online' : 'Backend Offline'}
              </span>
            </div>

            {/* User Account Pill in TopBar */}
            {user ? (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  backgroundColor: 'var(--bg-secondary)',
                  border: '1px solid var(--border-color)',
                  borderRadius: 24,
                  padding: '4px 12px 4px 6px',
                }}
              >
                <div
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: '50%',
                    backgroundColor: 'var(--brand-green)',
                    color: '#121212',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 800,
                    fontSize: 12,
                  }}
                >
                  {user.name.charAt(0).toUpperCase()}
                </div>
                <span style={{ fontSize: 13, fontWeight: 600 }}>{user.name}</span>
                <button
                  className="btn-icon"
                  style={{ padding: 4, marginLeft: 4 }}
                  onClick={handleLogout}
                  title="Sign Out"
                >
                  <LogOut size={14} />
                </button>
              </div>
            ) : (
              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  className="btn-secondary"
                  onClick={() => openAuthModal('login')}
                  style={{
                    padding: '6px 14px',
                    fontSize: 12,
                    borderRadius: 20,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                  }}
                >
                  <LogIn size={14} />
                  <span>Sign In</span>
                </button>
                <button
                  className="btn-primary"
                  onClick={() => openAuthModal('register')}
                  style={{
                    padding: '6px 14px',
                    fontSize: 12,
                    borderRadius: 20,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                  }}
                >
                  <UserPlus size={14} />
                  <span>Register</span>
                </button>
              </div>
            )}
          </div>
        </header>

        {/* Scrollable View */}
        <main className="content-area">
          {activeTab === 'home' && (
            <HomeScreen
              setActiveTab={setActiveTab}
              onOpenCreatePlaylist={() => setIsCreatePlaylistOpen(true)}
              onSelectPlaylist={handleSelectPlaylist}
              onOpenAddToPlaylist={(track) => setTrackForAddToPlaylist(track)}
            />
          )}

          {activeTab === 'search' && (
            <SearchScreen
              onOpenAddToPlaylist={(track) => setTrackForAddToPlaylist(track)}
            />
          )}

          {activeTab === 'playlist' && selectedPlaylistId && (
            <PlaylistDetailsView
              playlistId={selectedPlaylistId}
              onBack={() => {
                setActiveTab('home');
                setSelectedPlaylistId(null);
              }}
            />
          )}
        </main>
      </div>

      {/* Mobile Navigation Bar */}
      <nav className="mobile-nav-bar">
        <button
          className={`nav-item ${activeTab === 'home' ? 'active' : ''}`}
          style={{ width: 'auto', padding: '6px 16px' }}
          onClick={() => {
            setActiveTab('home');
            setSelectedPlaylistId(null);
          }}
        >
          <Home size={20} />
          <span>Home</span>
        </button>
        <button
          className={`nav-item ${activeTab === 'search' ? 'active' : ''}`}
          style={{ width: 'auto', padding: '6px 16px' }}
          onClick={() => {
            setActiveTab('search');
            setSelectedPlaylistId(null);
          }}
        >
          <Search size={20} />
          <span>Search</span>
        </button>
      </nav>

      {/* Sticky Bottom Mini Player */}
      <MiniPlayer
        onOpenAddToPlaylist={(track) => setTrackForAddToPlaylist(track)}
      />

      {/* Fullscreen Player Modal */}
      <PlayerModal
        onOpenAddToPlaylist={(track) => setTrackForAddToPlaylist(track)}
      />

      {/* Create Playlist Modal */}
      <CreatePlaylistModal
        isOpen={isCreatePlaylistOpen}
        onClose={() => setIsCreatePlaylistOpen(false)}
      />

      {/* Add To Playlist Modal */}
      <AddToPlaylistModal
        track={trackForAddToPlaylist}
        onClose={() => setTrackForAddToPlaylist(null)}
      />

      {/* Sign In & Register Modal */}
      <AuthModal />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <PlayerProvider>
        <MainApp />
      </PlayerProvider>
    </AuthProvider>
  );
}
