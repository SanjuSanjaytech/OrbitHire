'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/store';
import { authApi } from '@/lib/api';

export function useAuthGuard() {
  const router = useRouter();
  const { isAuthenticated, isLoading, initFromStorage, setAuth, clearAuth, setLoading } = useAuthStore();

  useEffect(() => {
    initFromStorage();
  }, []);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace('/login');
    }
  }, [isAuthenticated, isLoading]);

  // Verify token on mount
  useEffect(() => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('jh_token') : null;
    if (!token) { setLoading(false); return; }

    authApi.me()
      .then(res => {
        setAuth(res.data.data.user, token);
      })
      .catch(() => {
        clearAuth();
        router.replace('/login');
      });
  }, []);

  return { isAuthenticated, isLoading };
}

export function useGuestGuard() {
  const router = useRouter();
  const { isAuthenticated, isLoading, initFromStorage } = useAuthStore();

  useEffect(() => {
    initFromStorage();
  }, []);

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      router.replace('/dashboard');
    }
  }, [isAuthenticated, isLoading]);

  return { isAuthenticated, isLoading };
}
