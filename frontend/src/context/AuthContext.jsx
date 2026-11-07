import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem('sps_user');
    return savedUser ? JSON.parse(savedUser) : null;
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem('sps_access_token');
      if (token && !user) {
        try {
          const res = await api.get('/auth/me');
          if (res.data && res.data.data) {
            setUser(res.data.data);
            localStorage.setItem('sps_user', JSON.stringify(res.data.data));
          }
        } catch (err) {
          console.error('Failed to restore session:', err);
          logout();
        }
      }
      setLoading(false);
    };

    initAuth();
  }, []);

  const login = async (identifier, password) => {
    try {
      const res = await api.post('/auth/login', { identifier, password });
      const authData = res.data.data;

      localStorage.setItem('sps_access_token', authData.accessToken);
      localStorage.setItem('sps_refresh_token', authData.refreshToken);

      const userInfo = {
        id: authData.userId,
        fullName: authData.fullName,
        phoneNumber: authData.phoneNumber,
        email: authData.email,
        badgeNumber: authData.badgeNumber,
        role: authData.role,
        stationId: authData.stationId,
        stationName: authData.stationName,
        rankDesignation: authData.rankDesignation,
        forcePasswordChange: authData.forcePasswordChange
      };

      setUser(userInfo);
      localStorage.setItem('sps_user', JSON.stringify(userInfo));
      return { success: true, user: userInfo };
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Login failed';
      return { success: false, error: msg };
    }
  };

  const registerCitizen = async (formData) => {
    try {
      const res = await api.post('/auth/citizen-signup', formData);
      const authData = res.data.data;

      localStorage.setItem('sps_access_token', authData.accessToken);
      localStorage.setItem('sps_refresh_token', authData.refreshToken);

      const userInfo = {
        id: authData.userId,
        fullName: authData.fullName,
        phoneNumber: authData.phoneNumber,
        email: authData.email,
        role: authData.role,
      };

      setUser(userInfo);
      localStorage.setItem('sps_user', JSON.stringify(userInfo));
      return { success: true, user: userInfo };
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Registration failed';
      return { success: false, error: msg };
    }
  };

  const logout = () => {
    localStorage.removeItem('sps_access_token');
    localStorage.removeItem('sps_refresh_token');
    localStorage.removeItem('sps_user');
    setUser(null);
  };

  const isOfficer = () => {
    return user && user.role && user.role !== 'ROLE_CITIZEN';
  };

  const isAdminOrSP = () => {
    return user && (user.role === 'ROLE_SP_SSP' || user.role === 'ROLE_DIG_DGP' || user.role === 'ROLE_ADMIN');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        registerCitizen,
        logout,
        isOfficer,
        isAdminOrSP
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
