import { useEffect, useState } from 'react';
import { AppState } from 'react-native';

import { todayISO, type ISODate } from '@/domain';

/** Current local date that rolls over at midnight and when the app returns to foreground. */
export function useTodayDate(): ISODate {
  const [today, setToday] = useState(() => todayISO());
  useEffect(() => {
    const refresh = () => setToday(todayISO());
    const now = new Date();
    const midnight = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 0, 0, 5);
    const timer = setTimeout(refresh, midnight.getTime() - now.getTime());
    const sub = AppState.addEventListener('change', (s) => s === 'active' && refresh());
    return () => {
      clearTimeout(timer);
      sub.remove();
    };
  }, [today]);
  return today;
}
