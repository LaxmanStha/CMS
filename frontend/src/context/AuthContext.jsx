import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '@/services/api';

const AuthContext = createContext(null);

const MOCK_USERS = {
  admin: { id: '1', email: 'admin@college.edu', role: 'admin', name: 'Dr. Sarah Mitchell', avatar: null },
  faculty: { id: '2', email: 'faculty@college.edu', role: 'faculty', name: 'Prof. James Anderson', avatar: null },
  student: { id: '3', email: 'student@college.edu', role: 'student', name: 'Alex Johnson', avatar: null },
  accountant: { id: '4', email: 'accountant@college.edu', role: 'accountant', name: 'Maria Rodriguez', avatar: null },
};

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
    setLoading(false);
  }, []);

  const login = useCallback(async (email, password, role = 'student') => {
    const normalizedEmail = (email || '').toLowerCase().trim();

    // Prefer the backend: it validates the password and returns the real role.
    try {
      const response = await api.post('/login', { email: normalizedEmail, username: normalizedEmail, password, role });
      const data = response.data;
      if (data && data.success && data.user) {
        const userData = {
          id: data.user.id,
          email: data.user.email,
          role: data.user.role,
          name: data.user.name,
          avatar: null,
        };
        const token = data.token || `mock-jwt-token-${Date.now()}`;
        localStorage.setItem('user', JSON.stringify(userData));
        localStorage.setItem('token', token);
        setUser(userData);
        return { user: userData, token };
      }
      // Backend responded but credentials were invalid.
      throw new Error(data?.message || 'Invalid email or password');
    } catch (err) {
      // Network/backend unavailable: fall back to local temporary records.
      if (err.response && err.response.status && err.response.status !== 401) {
        const userData = MOCK_USERS[role] || MOCK_USERS.student;
        if (normalizedEmail !== userData.email || password !== 'password123') {
          throw new Error('Invalid email or password');
        }
        const token = `mock-jwt-token-${Date.now()}`;
        localStorage.setItem('user', JSON.stringify(userData));
        localStorage.setItem('token', token);
        setUser(userData);
        return { user: userData, token };
      }
      throw err;
    }
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    setUser(null);
  }, []);

  const value = {
    user,
    loading,
    login,
    logout,
    isAuthenticated: !!user,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}