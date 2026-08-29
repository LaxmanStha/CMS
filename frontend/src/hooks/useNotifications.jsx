import { useState, useEffect, useRef, useCallback } from 'react';
import api from '@/services/api';

const POLL_INTERVAL = 15000;
const AUTO_REMOVE_DELAY = 4000;

const SAMPLE_SEED = [
  { id: 1, type: 'success', title: 'New Admission', message: 'John Doe was admitted to the Computer Science program', read: false, createdAt: Date.now() - 2 * 60 * 1000 },
  { id: 2, type: 'warning', title: 'Fee Overdue', message: '3 students have overdue payments', read: false, createdAt: Date.now() - 15 * 60 * 1000 },
  { id: 3, type: 'info', title: 'Exam Schedule', message: 'Mid-term exams scheduled for next week', read: true, createdAt: Date.now() - 60 * 60 * 1000 },
  { id: 4, type: 'success', title: 'Report Generated', message: 'Monthly attendance report is ready', read: true, createdAt: Date.now() - 3 * 60 * 60 * 1000 },
];

const LIVE_EVENTS = [
  { type: 'success', title: 'New Admission', message: 'A new student was admitted' },
  { type: 'info', title: 'Assignment Submitted', message: 'A student just submitted an assignment' },
  { type: 'warning', title: 'Fee Reminder', message: 'A payment deadline is approaching' },
  { type: 'success', title: 'Grade Posted', message: 'New grades were published for a course' },
  { type: 'info', title: 'Announcement', message: 'Faculty posted a new announcement' },
  { type: 'error', title: 'System Alert', message: 'Low disk space on the server detected' },
];

let _id = 1000;
const nextId = () => ++_id;

export function useNotifications() {
  const [notifications, setNotifications] = useState(SAMPLE_SEED);
  const [unreadCount, setUnreadCount] = useState(() => SAMPLE_SEED.filter(n => !n.read).length);
  const [newIds, setNewIds] = useState([]);
  const [live, setLive] = useState(false);
  const timersRef = useRef([]);
  const removeTimersRef = useRef({});

  useEffect(() => {
    const timers = removeTimersRef.current;
    return () => {
      Object.values(timers).forEach(clearTimeout);
    };
  }, []);

  const pushIncoming = useCallback((item) => {
    setNotifications(prev => [{ ...item, createdAt: Date.now(), read: false }, ...prev]);
    setUnreadCount(prev => prev + 1);
    setNewIds(prev => [...prev, item.id]);
    setTimeout(() => {
      setNewIds(prev => prev.filter(x => x !== item.id));
    }, 2500);
  }, []);

  useEffect(() => {
    let cancelled = false;

    const fetchLive = async () => {
      try {
        const res = await api.get('/notifications');
        const payload = res.data;
        const list = Array.isArray(payload) ? payload : (payload?.data || []);
        if (!cancelled && list.length) {
          setNotifications(list.map(n => ({
            id: n.id,
            type: n.type || 'info',
            title: n.title,
            message: n.message,
            read: !!n.read,
            createdAt: n.createdAt ? new Date(n.createdAt).getTime() : Date.now(),
          })));
          setUnreadCount(list.filter(n => !n.read).length);
        }
      } catch {
        if (!cancelled) setLive(false);
      }
    };

    fetchLive();
    const poll = setInterval(fetchLive, POLL_INTERVAL);
    timersRef.current.push(poll);

    return () => {
      cancelled = true;
      timersRef.current.forEach(clearInterval);
      timersRef.current = [];
    };
  }, []);

  useEffect(() => {
    timersRef.current.forEach(clearInterval);
    timersRef.current = [];
    setLive(false);

    const tick = () => {
      const ev = LIVE_EVENTS[Math.floor(Math.random() * LIVE_EVENTS.length)];
      pushIncoming({ id: nextId(), ...ev });
    };

    const initial = setTimeout(tick, 8000);
    const interval = setInterval(tick, 22000);
    timersRef.current.push(initial, interval);
    setLive(true);

    return () => {
      timersRef.current.forEach(clearTimeout);
      timersRef.current = [];
    };
  }, [pushIncoming]);

  const remove = useCallback((id) => {
    clearTimeout(removeTimersRef.current[id]);
    delete removeTimersRef.current[id];
    setNotifications(prev => {
      const target = prev.find(n => n.id === id);
      if (target && !target.read) setUnreadCount(c => Math.max(0, c - 1));
      return prev.filter(n => n.id !== id);
    });
  }, []);

  const scheduleRemoval = useCallback((id) => {
    clearTimeout(removeTimersRef.current[id]);
    removeTimersRef.current[id] = setTimeout(() => remove(id), AUTO_REMOVE_DELAY);
  }, [remove]);

  const markRead = useCallback((id) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
    setUnreadCount(prev => Math.max(0, prev - 1));
    scheduleRemoval(id);
  }, [scheduleRemoval]);

  const markAllRead = useCallback(() => {
    setNotifications(prev => {
      prev.forEach(n => { if (!n.read) scheduleRemoval(n.id); });
      return prev.map(n => ({ ...n, read: true }));
    });
    setUnreadCount(0);
  }, [scheduleRemoval]);

  return { notifications, unreadCount, newIds, live, markRead, markAllRead, remove, pushIncoming };
}

export default useNotifications;
