import { useEffect, useRef, useState } from 'react';
import { AppState } from 'react-native';

import { useNow } from '@/hooks';
import { haptics } from '@/services/haptics';
import { useActiveWorkoutStore } from '@/store';

export interface RestTimerView {
  active: boolean;
  remainingSec: number;
  fraction: number;
  /** Briefly true after the timer reaches zero. */
  justFinished: boolean;
}

/** Ticks the persisted rest timer and fires a haptic when it ends in the foreground. */
export function useRestTimer(): RestTimerView {
  const rest = useActiveWorkoutStore((s) => s.rest);
  const clearRest = useActiveWorkoutStore((s) => s.clearRest);
  const now = useNow(250, !!rest);
  const [justFinished, setJustFinished] = useState(false);
  const firedFor = useRef<number | null>(null);

  const remainingMs = rest ? rest.endsAt - now : 0;

  useEffect(() => {
    if (!rest || remainingMs > 0 || firedFor.current === rest.endsAt) return;
    firedFor.current = rest.endsAt;
    const late = -remainingMs > 5000; // ended while backgrounded — the notification already alerted
    if (!late && AppState.currentState === 'active') {
      haptics.alert();
      setJustFinished(true);
      const t = setTimeout(() => {
        setJustFinished(false);
        clearRest();
      }, 2500);
      return () => clearTimeout(t);
    }
    clearRest();
  }, [rest, remainingMs, clearRest]);

  if (!rest) return { active: false, remainingSec: 0, fraction: 0, justFinished };
  const remainingSec = Math.max(0, Math.ceil(remainingMs / 1000));
  return {
    active: true,
    remainingSec,
    fraction: rest.durationSec > 0 ? 1 - remainingSec / rest.durationSec : 1,
    justFinished: justFinished || remainingSec === 0,
  };
}
