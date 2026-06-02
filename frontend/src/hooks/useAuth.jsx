import { useState, useEffect, createContext, useContext } from 'react';
import { authApi } from '../api/index.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('czesciomania_token');
    if (token) {
      authApi.me()
        .then(u => setUser(u))
        .catch(() => localStorage.removeItem('czesciomania_token'))
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  function login(token, userData) {
    localStorage.setItem('czesciomania_token', token);
    setUser(userData);
  }

  function logout() {
    localStorage.removeItem('czesciomania_token');
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
