'use client';
import { useEffect } from 'react';
import { useNotificationStore } from '@/store/notification.store';
import { getSocket } from '@/lib/socket';
import { notificationsApi } from '@/lib/api';

export function useNotifications(token: string | null) {
  const { setNotifications, addNotification } = useNotificationStore();

  useEffect(() => {
    if (!token) return;

    notificationsApi.getAll().then((res) => {
      setNotifications(res.data);
    }).catch(() => {});

    const socket = getSocket(token);

    socket.on('notification', (notification) => {
      addNotification(notification);
    });

    return () => {
      socket.off('notification');
    };
  }, [token]);
}
