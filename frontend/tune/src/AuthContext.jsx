import React, { createContext, useContext, useState, useEffect } from 'react';
import { API_BASE_URL } from './config';

const AuthContext = createContext();

const AUTH_TOKEN_KEY = 'groovy_auth_token';

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() => localStorage.getItem(AUTH_TOKEN_KEY));
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState('login'); // 'login' or 'register'

  // Verify and restore user session from token
  useEffect(() => {
    const verifyToken = async () => {
      const storedToken = localStorage.getItem(AUTH_TOKEN_KEY);
      if (!storedToken) {
        setIsLoadingAuth(false);
        return;
      }

      try {
        const res = await fetch(`${API_BASE_URL}/api/auth/me`, {
          headers: {
            Authorization: `Bearer ${storedToken}`,
          },
        });

        if (res.ok) {
          const data = await res.json();
          if (data.success && data.user) {
            setUser(data.user);
            setToken(storedToken);
          } else {
            localStorage.removeItem(AUTH_TOKEN_KEY);
            setUser(null);
            setToken(null);
          }
        } else {
          localStorage.removeItem(AUTH_TOKEN_KEY);
          setUser(null);
          setToken(null);
        }
      } catch (err) {
        console.warn('Auth token verification error:', err);
      } finally {
        setIsLoadingAuth(false);
      }
    };

    verifyToken();
  }, []);

  const login = async (email, password) => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), password }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Login failed');
      }

      localStorage.setItem(AUTH_TOKEN_KEY, data.token);
      setToken(data.token);
      setUser(data.user);
      setIsAuthModalOpen(false);
      return data;
    } catch (err) {
      console.error('Login error:', err);
      throw err;
    }
  };

  const register = async (name, email, password) => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim(), email: email.trim(), password }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Registration failed');
      }

      localStorage.setItem(AUTH_TOKEN_KEY, data.token);
      setToken(data.token);
      setUser(data.user);
      setIsAuthModalOpen(false);
      return data;
    } catch (err) {
      console.error('Registration error:', err);
      throw err;
    }
  };

  const logout = () => {
    localStorage.removeItem(AUTH_TOKEN_KEY);
    setToken(null);
    setUser(null);
  };

  const syncLibrary = async (libraryData) => {
    if (!token) return;
    try {
      await fetch(`${API_BASE_URL}/api/auth/sync`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(libraryData),
      });
    } catch (err) {
      console.warn('Sync library error:', err);
    }
  };

  const openAuthModal = (mode = 'login') => {
    setAuthMode(mode);
    setIsAuthModalOpen(true);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoadingAuth,
        isAuthModalOpen,
        authMode,
        setAuthMode,
        setIsAuthModalOpen,
        openAuthModal,
        login,
        register,
        logout,
        syncLibrary,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);

