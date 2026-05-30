'use client';
import { useEffect, useState } from 'react';
import { schedulesApi } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Clock, Loader2, Ban, X } from 'lucide-react';
import type { DoctorSchedule, BlockedSlot } from '@/types';

const DAYS = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY'];
const DAY_LABELS: Record<string, string> = {
  MONDAY: 'Monday', TUESDAY: 'Tuesday', WEDNESDAY: 'Wednesday',
  THURSDAY: 'Thursday', FRIDAY: 'Friday', SATURDAY: 'Saturday', SUNDAY: 'Sunday',
};

const today = new Date().toISOString().split('T')[0];

function formatBlockedDate(isoDate: string) {
  const [y, m, d] = isoDate.split('T')[0].split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString('en-US', {
    weekday: 'long', month: 'long', day: 'numeric', year: 'numeric',
  });
}

export default function DoctorSchedulePage() {
  const [schedules, setSchedules] = useState<DoctorSchedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState<string | null>(null);

  const [blockDate, setBlockDate] = useState('');
  const [blockReason, setBlockReason] = useState('');
  const [blocking, setBlocking] = useState(false);
  const [blockError, setBlockError] = useState('');
  const [unblocking, setUnblocking] = useState<string | null>(null);

  const fetchSchedules = () => {
    schedulesApi.getMy()
      .then((res) => setSchedules(res.data))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchSchedules(); }, []);

  const getSchedule = (day: string) => schedules.find((s) => s.dayOfWeek === day);

  const handleToggle = async (day: string) => {
    const existing = getSchedule(day);
    const newIsActive = existing ? !existing.isActive : true;
    setToggling(day);
    try {
      await schedulesApi.upsert({ dayOfWeek: day, isActive: newIsActive });
      fetchSchedules();
    } finally {
      setToggling(null);
    }
  };

  const handleBlock = async () => {
    if (!blockDate) return;
    setBlocking(true);
    setBlockError('');
    try {
      await schedulesApi.block({ date: blockDate, reason: blockReason || undefined });
      setBlockDate('');
      setBlockReason('');
      fetchSchedules();
    } catch (e: any) {
      setBlockError(e.response?.data?.message || 'Failed to block date');
    } finally {
      setBlocking(false);
    }
  };

  const handleUnblock = async (slotId: string) => {
    setUnblocking(slotId);
    try {
      await schedulesApi.unblock(slotId);
      fetchSchedules();
    } finally {
      setUnblocking(null);
    }
  };

  const allBlockedSlots: (BlockedSlot & { dayOfWeek: string })[] = schedules
    .flatMap((s) => (s.blockedSlots || []).map((b) => ({ ...b, dayOfWeek: s.dayOfWeek })))
    .sort((a, b) => {
      const da = a.date.split('T')[0];
      const db = b.date.split('T')[0];
      return da < db ? -1 : da > db ? 1 : 0;
    });

  const inputCls = 'text-xs border border-gray-200 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-teal-400';

  return (
    <div className="space-y-5 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">My Schedule</h1>
        <p className="text-gray-500 text-sm">9:00 AM – 5:00 PM · Toggle which days you're available</p>
      </div>

      {/* Weekly availability */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Clock className="h-4 w-4 text-teal-600" /> Weekly Availability
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-3">
              {DAYS.map((d) => <Skeleton key={d} className="h-14 w-full" />)}
            </div>
          ) : (
            <div className="space-y-2">
              {DAYS.map((day) => {
                const sched = getSchedule(day);
                const isActive = sched?.isActive ?? false;

                return (
                  <div
                    key={day}
                    className={`flex items-center justify-between rounded-xl border-2 px-4 py-3 transition-all ${
                      isActive ? 'border-teal-200 bg-teal-50/50' : 'border-gray-100'
                    }`}
                  >
                    <span className={`font-medium text-sm ${isActive ? 'text-teal-700' : 'text-gray-400'}`}>
                      {DAY_LABELS[day]}
                    </span>
                    <div className="flex items-center gap-3">
                      {isActive && (
                        <span className="text-xs text-teal-600">9:00 AM – 5:00 PM</span>
                      )}
                      {!isActive && (
                        <span className="text-xs text-gray-400">Unavailable</span>
                      )}
                      {toggling === day ? (
                        <Loader2 className="h-4 w-4 animate-spin text-teal-500" />
                      ) : (
                        <button
                          onClick={() => handleToggle(day)}
                          className={`relative h-5 w-9 shrink-0 rounded-full transition-colors ${isActive ? 'bg-teal-500' : 'bg-gray-200'}`}
                        >
                          <span className={`absolute top-0.5 left-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform ${isActive ? 'translate-x-4' : 'translate-x-0'}`} />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Block a date */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Ban className="h-4 w-4 text-red-500" /> Block a Date
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-2 items-end">
            <div>
              <label className="text-xs text-gray-500 block mb-1">Date</label>
              <input
                type="date"
                min={today}
                value={blockDate}
                onChange={(e) => { setBlockDate(e.target.value); setBlockError(''); }}
                className={inputCls}
              />
            </div>
            <div className="flex-1 min-w-[140px]">
              <label className="text-xs text-gray-500 block mb-1">Reason (optional)</label>
              <input
                type="text"
                value={blockReason}
                onChange={(e) => setBlockReason(e.target.value)}
                placeholder="e.g. Conference, Holiday"
                className={`${inputCls} w-full`}
              />
            </div>
            <button
              onClick={handleBlock}
              disabled={blocking || !blockDate}
              className="flex items-center gap-1.5 rounded-lg bg-red-500 px-3 py-1.5 text-xs font-medium text-white hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {blocking ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Ban className="h-3.5 w-3.5" />}
              Block day
            </button>
          </div>

          {blockError && (
            <p className="text-xs text-red-500 bg-red-50 border border-red-100 rounded-lg px-3 py-2">{blockError}</p>
          )}

          {allBlockedSlots.length > 0 ? (
            <div className="space-y-2">
              <p className="text-xs font-medium text-gray-500">Blocked dates</p>
              {allBlockedSlots.map((slot) => (
                <div key={slot.id} className="flex items-center justify-between rounded-lg border border-red-100 bg-red-50/40 px-3 py-2.5 gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <Ban className="h-3.5 w-3.5 text-red-400 shrink-0" />
                    <span className="text-sm font-medium text-gray-700 truncate">
                      {formatBlockedDate(slot.date)}
                    </span>
                    {slot.reason && (
                      <span className="text-xs text-gray-400 truncate hidden sm:block">· {slot.reason}</span>
                    )}
                  </div>
                  <button
                    onClick={() => handleUnblock(slot.id)}
                    disabled={unblocking === slot.id}
                    className="shrink-0 flex items-center gap-1 text-xs text-red-500 hover:text-red-700 disabled:opacity-50 transition-colors"
                  >
                    {unblocking === slot.id
                      ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      : <X className="h-3.5 w-3.5" />}
                    Unblock
                  </button>
                </div>
              ))}
            </div>
          ) : (
            !loading && (
              <p className="text-xs text-gray-400 text-center py-3">No blocked dates</p>
            )
          )}
        </CardContent>
      </Card>

      <div className="rounded-xl bg-blue-50 border border-blue-100 p-4 text-sm text-blue-700">
        <p className="font-medium mb-1">Schedule notes</p>
        <ul className="list-disc list-inside space-y-0.5 text-blue-600 text-xs">
          <li>Slots are 30 minutes, from 9:00 AM to 5:00 PM</li>
          <li>Patients can only book on your active days</li>
          <li>Blocking a date makes the entire day unavailable</li>
        </ul>
      </div>
    </div>
  );
}
