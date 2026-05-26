'use client';
import Link from 'next/link';
import { Bell, LogOut, User } from 'lucide-react';
import { useAuthStore } from '@/store/auth.store';
import { useNotificationStore } from '@/store/notification.store';
import { authApi } from '@/lib/api';
import { useRouter } from 'next/navigation';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { getInitials } from '@/lib/utils';

export function Navbar() {
  const { user, clearAuth } = useAuthStore();
  const { unreadCount } = useNotificationStore();
  const router = useRouter();

  const profile =
    user?.role === 'DOCTOR' ? user?.doctorProfile : user?.patientProfile;

  const handleLogout = async () => {
    try { await authApi.logout(); } catch {}
    clearAuth();
    router.push('/login');
  };

  return (
    <header className="sticky top-0 z-40 border-b border-gray-100 bg-white/90 backdrop-blur-sm">
      <div className="flex h-16 items-center justify-between px-6">
        <Link href="/" className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-teal-600">
            <span className="text-sm font-bold text-white">YK</span>
          </div>
          <span className="text-lg font-bold text-teal-700">YourKalinga</span>
        </Link>

        <div className="flex items-center gap-3">
          {user && (
            <>
              <Link
                href={user.role === 'DOCTOR' ? '/doctor/dashboard' : '/patient/dashboard'}
                className="relative rounded-full p-2 text-gray-500 hover:bg-teal-50 hover:text-teal-700 transition-colors"
              >
                <Bell className="h-5 w-5" />
                {unreadCount > 0 && (
                  <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </Link>

              <div className="flex items-center gap-2">
                <Avatar className="h-8 w-8">
                  {profile?.avatarUrl && <AvatarImage src={profile.avatarUrl} />}
                  <AvatarFallback>
                    {getInitials(profile?.firstName || '', profile?.lastName || '')}
                  </AvatarFallback>
                </Avatar>
                <span className="text-sm font-medium text-gray-700 hidden sm:block">
                  {profile?.firstName} {profile?.lastName}
                </span>
              </div>

              <button
                onClick={handleLogout}
                className="rounded-full p-2 text-gray-500 hover:bg-red-50 hover:text-red-600 transition-colors"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
