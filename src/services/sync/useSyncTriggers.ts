import NetInfo from '@react-native-community/netinfo';
import { useEffect } from 'react';
import { AppState } from 'react-native';

import { useAppStore } from '@/store';

import { restoreSession } from './account';
import { flushOutbox } from './syncEngine';
import { useSyncStatus } from './syncStatus';

/** Flushes the outbox when connectivity returns, on foreground, and shortly after local changes. */
export function useSyncTriggers() {
  useEffect(() => {
    void restoreSession().then(() => flushOutbox());

    const netSub = NetInfo.addEventListener((s) => {
      const online = s.isConnected !== false;
      const wasOnline = useSyncStatus.getState().online;
      useSyncStatus.getState().set({ online });
      if (online && !wasOnline) void flushOutbox(true);
    });
    const appSub = AppState.addEventListener('change', (state) => {
      if (state === 'active') void flushOutbox();
    });

    let timer: ReturnType<typeof setTimeout> | null = null;
    const unsub = useAppStore.subscribe((s, prev) => {
      if (s.outbox === prev.outbox || s.outbox.length === 0) return;
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => void flushOutbox(), 2_000);
    });
    const interval = setInterval(() => void flushOutbox(), 60_000);

    return () => {
      netSub();
      appSub.remove();
      unsub();
      if (timer) clearTimeout(timer);
      clearInterval(interval);
    };
  }, []);
}
