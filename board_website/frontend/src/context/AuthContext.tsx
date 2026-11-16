import React, { createContext, useContext, useState } from 'react';
import { api } from '../services/api';

export interface AuthContextType {
  isAuthenticated: boolean;
  currentUser: any;
  isAuthModalOpen: boolean;
  setIsAuthenticated: React.Dispatch<React.SetStateAction<boolean>>;
  setCurrentUser: React.Dispatch<React.SetStateAction<any>>;
  openAuthModal: () => void;
  closeAuthModal: () => void;
  login: (email?: string, password?: string) => Promise<void>;
  googleLogin: (payload: {
    credential?: string;
    accessToken?: string;
    profile?: { email: string; name?: string; picture?: string; sub?: string };
  }) => Promise<void>;
  setSession: (token: string, user: any) => void;
  forgotPassword: (email: string) => Promise<{ ok: number; message: string }>;
  resetPassword: (
    email: string,
    code: string,
    newPass: string
  ) => Promise<{ ok: number; message: string; token: string; user: any }>;
  logout: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export interface AuthProviderProps {
  children: React.ReactNode;
  showToast?: (msg: string) => void;
  onLoginSuccess?: () => void;
  onLogoutSuccess?: () => void;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({
  children,
  showToast = () => {},
  onLoginSuccess = () => {},
  onLogoutSuccess = () => {},
}) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    const isLoggedOut = localStorage.getItem('logged_out') === '1';
    if (isLoggedOut) return false;
    return Boolean(localStorage.getItem('auth_token') || localStorage.getItem('auth_user'));
  });

  const [currentUser, setCurrentUser] = useState<any>(() => {
    try {
      const isLoggedOut = localStorage.getItem('logged_out') === '1';
      if (isLoggedOut) return null;
      const u = localStorage.getItem('auth_user');
      return u ? JSON.parse(u) : null;
    } catch {
      return null;
    }
  });

  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);

  const openAuthModal = () => setIsAuthModalOpen(true);
  const closeAuthModal = () => setIsAuthModalOpen(false);

  const login = async (email?: string, password?: string) => {
    try {
      const res = await api.login(email, password);
      if (res && res.token) {
        localStorage.setItem('auth_token', res.token);
      }
      if (res && res.user) {
        localStorage.setItem('auth_user', JSON.stringify(res.user));
        setCurrentUser(res.user);
      }
      localStorage.removeItem('logged_out');
      sessionStorage.setItem('job_tracker_server_warmed', 'true');
      setIsAuthenticated(true);
      closeAuthModal();
      showToast('Logged in successfully');
      onLoginSuccess();
    } catch (err: any) {
      showToast(err.message || 'Login failed');
      throw err;
    }
  };

  const googleLogin = async (payload: {
    credential?: string;
    accessToken?: string;
    profile?: { email: string; name?: string; picture?: string; sub?: string };
  }) => {
    try {
      const res = await api.googleAuth(payload);
      if (res && res.token) {
        localStorage.setItem('auth_token', res.token);
      }
      if (res && res.user) {
        localStorage.setItem('auth_user', JSON.stringify(res.user));
        setCurrentUser(res.user);
      }
      localStorage.removeItem('logged_out');
      sessionStorage.setItem('job_tracker_server_warmed', 'true');
      setIsAuthenticated(true);
      closeAuthModal();
      showToast(`Welcome, ${res.user?.name || res.user?.email || 'User'}! Signed in with Google`);
      onLoginSuccess();
    } catch (err: any) {
      showToast(err.message || 'Google sign-in failed');
      throw err;
    }
  };

  const setSession = (token: string, user: any) => {
    if (token) localStorage.setItem('auth_token', token);
    if (user) {
      localStorage.setItem('auth_user', JSON.stringify(user));
      setCurrentUser(user);
    }
    localStorage.removeItem('logged_out');
    setIsAuthenticated(true);
    closeAuthModal();
    showToast(`Welcome, ${user?.name || user?.email || 'User'}!`);
    onLoginSuccess();
  };

  const forgotPassword = async (email: string) => {
    try {
      const res = await api.forgotPassword(email);
      showToast(res.message || 'Verification code sent to your email');
      return res;
    } catch (err: any) {
      showToast(err.message || 'Failed to send verification code');
      throw err;
    }
  };

  const resetPassword = async (email: string, code: string, newPass: string) => {
    try {
      const res = await api.resetPassword(email, code, newPass);
      if (res && res.token) {
        localStorage.setItem('auth_token', res.token);
      }
      if (res && res.user) {
        localStorage.setItem('auth_user', JSON.stringify(res.user));
        setCurrentUser(res.user);
      }
      localStorage.removeItem('logged_out');
      sessionStorage.setItem('job_tracker_server_warmed', 'true');
      setIsAuthenticated(true);
      closeAuthModal();
      showToast('Password reset successfully! Signed in.');
      onLoginSuccess();
      return res;
    } catch (err: any) {
      showToast(err.message || 'Failed to reset password');
      throw err;
    }
  };

  const logout = async () => {
    try {
      await api.logout().catch(() => {});
    } finally {
      localStorage.setItem('logged_out', '1');
      localStorage.removeItem('auth_token');
      localStorage.removeItem('auth_user');
      localStorage.removeItem('job_tracker_apps');
      localStorage.removeItem('job_tracker_learnings');
      localStorage.removeItem('job_tracker_profile');
      localStorage.removeItem('job_tracker_quicklinks');
      localStorage.removeItem('job_tracker_gamify');
      localStorage.removeItem('gdrive_folder_id');
      setCurrentUser(null);
      setIsAuthenticated(false);
      showToast('Logged out');
      onLogoutSuccess();
    }
  };

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        currentUser,
        isAuthModalOpen,
        setIsAuthenticated,
        setCurrentUser,
        openAuthModal,
        closeAuthModal,
        login,
        googleLogin,
        setSession,
        forgotPassword,
        resetPassword,
        logout,
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

