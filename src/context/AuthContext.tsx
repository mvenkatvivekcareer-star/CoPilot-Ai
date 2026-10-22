import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../lib/api';
import type { User, Profile } from '../types';

interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, pass: string) => Promise<void>;
  register: (email: string, pass: string) => Promise<void>;
  demoLogin: () => Promise<void>;
  quickAccess: (email?: string) => Promise<void>;
  logout: () => void;
  updateProfile: (data: Partial<Profile>) => Promise<Profile>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchCurrentUser = async () => {
    try {
      const data = await api.getCurrentUser();
      setUser(data.user);
      setProfile(data.profile);
    } catch {
      setUser(null);
      setProfile(null);
      api.clearToken();
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCurrentUser();

    const handleUnauthorized = () => {
      setUser(null);
      setProfile(null);
    };

    window.addEventListener('careerpilot_unauthorized', handleUnauthorized);
    return () => {
      window.removeEventListener('careerpilot_unauthorized', handleUnauthorized);
    };
  }, []);

  const login = async (email: string, pass: string) => {
    const res = await api.login(email, pass);
    setUser(res.user);
    setProfile(res.profile);
  };

  const register = async (email: string, pass: string) => {
    const res = await api.register(email, pass);
    setUser(res.user);
    setProfile(res.profile);
  };

  const demoLogin = async () => {
    api.clearToken();
    const res = await api.demoLogin();
    setUser(res.user);
    setProfile(res.profile);
  };

  const quickAccess = async (email?: string) => {
    api.clearToken();
    const res = await api.quickAccess(email);
    setUser(res.user);
    setProfile(res.profile);
  };

  const logout = () => {
    api.clearToken();
    setUser(null);
    setProfile(null);
  };

  const updateProfile = async (data: Partial<Profile>): Promise<Profile> => {
    const res = await api.updateProfile(data);
    setProfile(res.profile);
    return res.profile;
  };

  const refreshProfile = async () => {
    if (!user) return;
    try {
      const data = await api.getCurrentUser();
      setProfile(data.profile);
    } catch (e) {
      console.error('Failed to refresh profile', e);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        isLoading,
        isAuthenticated: Boolean(user),
        login,
        register,
        demoLogin,
        quickAccess,
        logout,
        updateProfile,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
