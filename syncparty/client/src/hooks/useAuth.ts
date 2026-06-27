'use client';

import { useState, useCallback } from 'react';
import { api } from '@/lib/api';
import { useAppStore } from '@/store';

export function useAuth() {
  const { user, setUser, setToken, logout } = useAppStore();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const guestLogin = useCallback(
    async (username: string) => {
      setLoading(true);
      setError(null);
      try {
        const { token, user } = await api.guestLogin(username);
        setToken(token);
        setUser(user);
        return user;
      } catch (err: any) {
        setError(err.message);
        return null;
      } finally {
        setLoading(false);
      }
    },
    [setToken, setUser]
  );

  const checkAuth = useCallback(async () => {
    const token = localStorage.getItem('syncparty_token');
    if (!token) return false;

    try {
      setToken(token);
      const userData = await api.getMe();
      setUser(userData);
      return true;
    } catch {
      logout();
      return false;
    }
  }, [setToken, setUser, logout]);

  return { user, loading, error, guestLogin, checkAuth, logout };
}
