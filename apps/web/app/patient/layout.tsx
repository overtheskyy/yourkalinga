'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth.store';
import { Navbar } from '@/components/shared/Navbar';
import { Sidebar } from '@/components/shared/Sidebar';
import { useNotifications } from '@/hooks/useNotifications';

export default function PatientLayout({ children }: { children: React.ReactNode }) {
  const { user, isAuthenticated, token } = useAuthStore();
  const router = useRouter();
  useNotifications(token);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }
    if (user?.role !== 'PATIENT') {
      router.push('/doctor/dashboard');
    }
  }, [isAuthenticated, user]);

  if (!isAuthenticated || user?.role !== 'PATIENT') return null;

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="flex">
        <Sidebar role="PATIENT" />
        <main className="flex-1 overflow-auto p-6">{children}</main>
      </div>
    </div>
  );
}
