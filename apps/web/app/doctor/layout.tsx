'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth.store';
import { Navbar } from '@/components/shared/Navbar';
import { Sidebar } from '@/components/shared/Sidebar';
import { useNotifications } from '@/hooks/useNotifications';

export default function DoctorLayout({ children }: { children: React.ReactNode }) {
  const { user, isAuthenticated, token } = useAuthStore();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  useNotifications(token);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }
    if (user?.role !== 'DOCTOR') {
      router.push('/patient/dashboard');
    }
  }, [mounted, isAuthenticated, user]);

  if (!mounted) return null;
  if (!isAuthenticated || user?.role !== 'DOCTOR') return null;

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="flex">
        <Sidebar role="DOCTOR" />
        <main className="flex-1 overflow-auto p-4 md:p-6">{children}</main>
      </div>
    </div>
  );
}
