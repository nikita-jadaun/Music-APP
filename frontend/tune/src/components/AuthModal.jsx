import React, { useState } from 'react';
import { X, Lock, Mail, User, AlertCircle, Loader2 } from 'lucide-react';
import { useAuth } from '../AuthContext';
import { usePlayer } from '../PlayerContext';

export default function AuthModal() {
  const { isAuthModalOpen, setIsAuthModalOpen, authMode, setAuthMode, login, register } = useAuth();
  const { showToast, loadUserLibrary } = usePlayer();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  if (!isAuthModalOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      if (authMode === 'login') {
        const res = await login(email, password);
        if (res.library && loadUserLibrary) {
          loadUserLibrary(res.library);
        }
        showToast(`Welcome back, ${res.user.name}! 👋`);
      } else {
        const res = await register(name, email, password);
        if (res.library && loadUserLibrary) {
          loadUserLibrary(res.library);
        }
        showToast(`Account created! Welcome, ${res.user.name} 🎉`);
      }
      setName('');
      setEmail('');
      setPassword('');
    } catch (err) {
      setError(err.message || 'Authentication failed. Please check your credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  const switchMode = (mode) => {
    setError(null);
    setAuthMode(mode);
  };

  return (
    <div className="modal-overlay" onClick={() => setIsAuthModalOpen(false)}>
      <div className="dialog-card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 420 }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <h2 className="dialog-title" style={{ marginBottom: 0 }}>
            {authMode === 'login' ? 'Sign In to Groovy' : 'Create an Account'}
          </h2>
          <button className="btn-icon" onClick={() => setIsAuthModalOpen(false)}>
            <X size={18} />
          </button>
        </div>

        {/* Tab switch */}
        <div
          style={{
            display: 'flex',
            backgroundColor: 'var(--bg-primary)',
            borderRadius: 8,
            padding: 4,
            marginBottom: 20,
            border: '1px solid var(--border-color)',
          }}
        >
          <button
            type="button"
            onClick={() => switchMode('login')}
            style={{
              flex: 1,
              padding: '8px 0',
              border: 'none',
              borderRadius: 6,
              fontSize: 13,
              fontWeight: 700,
              cursor: 'pointer',
              backgroundColor: authMode === 'login' ? 'var(--bg-card)' : 'transparent',
              color: authMode === 'login' ? '#fff' : 'var(--text-secondary)',
              transition: 'all 0.15s ease',
            }}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => switchMode('register')}
            style={{
              flex: 1,
              padding: '8px 0',
              border: 'none',
              borderRadius: 6,
              fontSize: 13,
              fontWeight: 700,
              cursor: 'pointer',
              backgroundColor: authMode === 'register' ? 'var(--bg-card)' : 'transparent',
              color: authMode === 'register' ? '#fff' : 'var(--text-secondary)',
              transition: 'all 0.15s ease',
            }}
          >
            Create Account
          </button>
        </div>

        {/* Error alert */}
        {error && (
          <div
            style={{
              backgroundColor: 'var(--danger-bg)',
              borderLeft: '3px solid var(--danger)',
              padding: '10px 12px',
              borderRadius: 6,
              marginBottom: 16,
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              fontSize: 13,
              color: 'var(--danger)',
            }}
          >
            <AlertCircle size={16} style={{ flexShrink: 0 }} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {authMode === 'register' && (
            <div style={{ marginBottom: 14 }}>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6 }}>
                Full Name
              </label>
              <div style={{ position: 'relative' }}>
                <User size={16} color="var(--text-muted)" style={{ position: 'absolute', left: 12, top: 14 }} />
                <input
                  type="text"
                  required
                  className="dialog-input"
                  style={{ paddingLeft: 38, marginBottom: 0 }}
                  placeholder="Username"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
            </div>
          )}

          <div style={{ marginBottom: 14 }}>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6 }}>
              Email Address
            </label>
            <div style={{ position: 'relative' }}>
              <Mail size={16} color="var(--text-muted)" style={{ position: 'absolute', left: 12, top: 14 }} />
              <input
                type="email"
                required
                className="dialog-input"
                style={{ paddingLeft: 38, marginBottom: 0 }}
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </div>

          <div style={{ marginBottom: 24 }}>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6 }}>
              Password
            </label>
            <div style={{ position: 'relative' }}>
              <Lock size={16} color="var(--text-muted)" style={{ position: 'absolute', left: 12, top: 14 }} />
              <input
                type="password"
                required
                minLength={6}
                className="dialog-input"
                style={{ paddingLeft: 38, marginBottom: 0 }}
                placeholder="At least 6 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          <button
            type="submit"
            className="btn-primary"
            disabled={isLoading}
            style={{
              width: '100%',
              padding: '12px 0',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              fontSize: 15,
              opacity: isLoading ? 0.7 : 1,
            }}
          >
            {isLoading && <Loader2 size={18} className="spinner" />}
            <span>{authMode === 'login' ? 'Sign In' : 'Create Account'}</span>
          </button>
        </form>

        {/* Footer switch text */}
        <div style={{ marginTop: 20, textAlign: 'center', fontSize: 13, color: 'var(--text-secondary)' }}>
          {authMode === 'login' ? (
            <span>
              Don't have an account?{' '}
              <button
                type="button"
                onClick={() => switchMode('register')}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--brand-green)',
                  fontWeight: 700,
                  cursor: 'pointer',
                  textDecoration: 'underline',
                }}
              >
                Sign up
              </button>
            </span>
          ) : (
            <span>
              Already have an account?{' '}
              <button
                type="button"
                onClick={() => switchMode('login')}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--brand-green)',
                  fontWeight: 700,
                  cursor: 'pointer',
                  textDecoration: 'underline',
                }}
              >
                Sign in
              </button>
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

