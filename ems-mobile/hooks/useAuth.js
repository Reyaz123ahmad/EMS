import React, { useEffect, useRef, useState, createContext, useContext } from 'react';
import { storage } from '../utils/storage.js';
import { authService } from '../services/auth.service.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const hasCheckedRef = useRef(false);

  const refreshUser = async () => {
    try {
      const token = await storage.getItem('accessToken');
      if (!token) return null;
      const freshUser = await authService.getMe();
      if (freshUser) {
        setUser((prev) => {
          if (JSON.stringify(prev) !== JSON.stringify(freshUser)) {
            return freshUser;
          }
          return prev;
        });
        await storage.setItem('user', freshUser);
        return freshUser;
      }
    } catch (err) {
      console.warn('[AUTH] Error refreshing user profile:', err.message);
    }
    return null;
  };

  useEffect(() => {
    if (hasCheckedRef.current) return;
    hasCheckedRef.current = true;

    const checkSession = async () => {
      try {
        console.log('[AUTH] Checking stored authentication session...');
        const token = await storage.getItem('accessToken');
        const userStr = await storage.getItem('user');

        if (token && userStr) {
          try {
            const parsedUser = JSON.parse(userStr);
            setUser(parsedUser);
            console.log('[AUTH] Session restored from storage for:', parsedUser.email || parsedUser.name);
            refreshUser();
          } catch (e) {
            setUser(null);
            await storage.clear();
          }
        } else {
          setUser(null);
          console.log('[AUTH] No stored access token found');
        }
      } catch (err) {
        console.error('[AUTH] Session check error:', err.message);
        setUser(null);
      } finally {
        setIsLoading(false);
        console.log('[AUTH] Check complete');
      }
    };

    checkSession();
  }, []);

  const login = async (email, password, twoFactorToken = undefined) => {
    setIsSubmitting(true);
    setError(null);
    try {
      console.log('[AUTH] Attempting login for:', email.trim());
      const resData = await authService.login(email, password, twoFactorToken);

      if (resData?.requires2FA) {
        setIsSubmitting(false);
        return {
          requires2FA: true,
          email: resData.email || email,
          message: resData.message || 'Two-factor authentication code sent to your email',
        };
      }

      const accessToken = resData?.accessToken || resData?.token;
      const refreshToken = resData?.refreshToken;
      let loggedInUser = resData?.user || resData?.employee || resData;

      if (!accessToken) {
        throw new Error('Invalid response from authentication server');
      }

      await storage.setItem('accessToken', accessToken);
      if (refreshToken) {
        await storage.setItem('refreshToken', refreshToken);
      }

      try {
        const freshUser = await authService.getMe();
        if (freshUser) {
          loggedInUser = freshUser;
        }
      } catch (meErr) {
        console.warn('[AUTH] Could not fetch fresh profile on login:', meErr.message);
      }

      if (loggedInUser) {
        await storage.setItem('user', loggedInUser);
      }

      setUser(loggedInUser);
      setIsSubmitting(false);
      return { success: true, user: loggedInUser };
    } catch (err) {
      const errorMessage =
        err.response?.data?.message ||
        err.response?.data?.error ||
        err.message ||
        'Login failed. Please check your credentials.';

      console.error('[AUTH] Login failed:', errorMessage);
      setError(errorMessage);
      setIsSubmitting(false);
      return { success: false, error: errorMessage };
    }
  };

  const logout = async () => {
    try {
      const refreshToken = await storage.getItem('refreshToken');
      await authService.logout(refreshToken);
    } catch (e) {
      console.warn('[AUTH] Logout API call failed:', e.message);
    } finally {
      await storage.clear();
      setUser(null);
      setError(null);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        isSubmitting,
        error,
        login,
        logout,
        setUser,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default useAuth;
