'use client';
import { useAuthStore } from '@/store/auth.store';
import { authApi } from '@/lib/api';
import { useRouter } from 'next/navigation';

export function useAuth() {
  const { user, token, isAuthenticated, setAuth, clearAuth } = useAuthStore();
  const router = useRouter();

  const login = async (email: string, password: string) => {
    const res = await authApi.login({ email, password });
    setAuth(res.data.user, res.data.accessToken);
    return res.data;
  };

  const register = async (data: {
    email: string;
    password: string;
    role: string;
    firstName: string;
    lastName: string;
  }) => {
    const res = await authApi.register(data);
    setAuth(res.data.user, res.data.accessToken);
    return res.data;
  };

  const logout = async () => {
    try { await authApi.logout(); } catch {}
    clearAuth();
    router.push('/login');
  };

  return { user, token, isAuthenticated, login, register, logout };
}
