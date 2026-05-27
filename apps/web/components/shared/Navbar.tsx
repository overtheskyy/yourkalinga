'use client';
import { useRef, useState, useEffect } from 'react';
import Link from 'next/link';
import { Bell, LogOut, Calendar, Clock, CalendarX, CheckCheck, Info } from 'lucide-react';
import { useAuthStore } from '@/store/auth.store';
import { useNotificationStore } from '@/store/notification.store';
import { authApi, notificationsApi } from '@/lib/api';
import { useRouter } from 'next/navigation';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { getInitials } from '@/lib/utils';
import type { Notification } from '@/types';

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

function NotifIcon({ type }: { type: string }) {
  if (type === 'APPOINTMENT_BOOKED')
    return <Calendar className="h-4 w-4 text-teal-600" />;
  if (type === 'APPOINTMENT_UPCOMING')
    return <Clock className="h-4 w-4 text-blue-500" />;
  if (type === 'APPOINTMENT_CANCELLED' || type === 'APPOINTMENT_RESCHEDULED')
    return <CalendarX className="h-4 w-4 text-orange-500" />;
  return <Info className="h-4 w-4 text-gray-400" />;
}

function NotifIconBg({ type }: { type: string }) {
  if (type === 'APPOINTMENT_BOOKED') return 'bg-teal-50';
  if (type === 'APPOINTMENT_UPCOMING') return 'bg-blue-50';
  if (type === 'APPOINTMENT_CANCELLED' || type === 'APPOINTMENT_RESCHEDULED') return 'bg-orange-50';
  return 'bg-gray-50';
}

export function Navbar() {
  const { user, clearAuth } = useAuthStore();
  const { notifications, unreadCount, markRead, markAllRead } = useNotificationStore();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const profile =
    user?.role === 'DOCTOR' ? user?.doctorProfile : user?.patientProfile;

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = async () => {
    try { await authApi.logout(); } catch {}
    clearAuth();
    router.push('/login');
  };

  const handleNotifClick = async (notif: Notification) => {
    if (!notif.isRead) {
      markRead(notif.id);
      notificationsApi.markRead(notif.id).catch(() => {});
    }
  };

  const handleMarkAllRead = async () => {
    markAllRead();
    notificationsApi.markAllRead().catch(() => {});
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
              {/* Notification bell + dropdown */}
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setOpen((v) => !v)}
                  className="relative rounded-full p-2 text-gray-500 hover:bg-teal-50 hover:text-teal-700 transition-colors"
                >
                  <Bell className="h-5 w-5" />
                  {unreadCount > 0 && (
                    <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </button>

                {open && (
                  <div className="absolute right-0 top-12 w-80 rounded-2xl border border-gray-100 bg-white shadow-xl z-50">
                    {/* Header */}
                    <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Bell className="h-4 w-4 text-gray-500" />
                        <span className="text-sm font-semibold text-gray-800">Notifications</span>
                        {unreadCount > 0 && (
                          <span className="rounded-full bg-red-100 px-1.5 py-0.5 text-[10px] font-bold text-red-600">
                            {unreadCount}
                          </span>
                        )}
                      </div>
                      {unreadCount > 0 && (
                        <button
                          onClick={handleMarkAllRead}
                          className="flex items-center gap-1 text-xs text-teal-600 hover:text-teal-700 font-medium"
                        >
                          <CheckCheck className="h-3.5 w-3.5" />
                          Mark all read
                        </button>
                      )}
                    </div>

                    {/* List */}
                    <div className="max-h-96 overflow-y-auto">
                      {notifications.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-10 text-center">
                          <Bell className="h-8 w-8 text-gray-200 mb-2" />
                          <p className="text-sm text-gray-400">No notifications yet</p>
                          <p className="text-xs text-gray-300 mt-0.5">
                            We&apos;ll notify you about appointments and updates
                          </p>
                        </div>
                      ) : (
                        notifications.slice(0, 20).map((notif) => (
                          <button
                            key={notif.id}
                            onClick={() => handleNotifClick(notif)}
                            className={`w-full flex items-start gap-3 px-4 py-3 text-left border-b border-gray-50 last:border-0 ${
                              !notif.isRead ? 'bg-teal-50/40' : ''
                            }`}
                          >
                            <div className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${NotifIconBg({ type: notif.type })}`}>
                              <NotifIcon type={notif.type} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between gap-2">
                                <p className={`text-sm leading-snug ${!notif.isRead ? 'font-semibold text-gray-900' : 'font-medium text-gray-700'}`}>
                                  {notif.title}
                                </p>
                                {!notif.isRead && (
                                  <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-teal-500" />
                                )}
                              </div>
                              <p className="mt-0.5 text-xs text-gray-500 leading-snug line-clamp-2">
                                {notif.body}
                              </p>
                              <p className="mt-1 text-[10px] text-gray-400">
                                {timeAgo(notif.createdAt)}
                              </p>
                            </div>
                          </button>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>

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
