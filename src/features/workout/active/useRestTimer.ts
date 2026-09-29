import { useEffect, useRef } from 'react';
import { AppState } from 'react-native';

import { useNow } from '@/hooks';
import { haptics } from '@/services/haptics';
import { useActiveWorkoutStore } from '@/store';

export interface RestTimerView {
  active: boolean;
  remainingSec: number;
  fraction: number;
  /** True from zero until the finished banner is dismissed. */
  justFinished: boolean;
}

/** How long "Rest complete" stays visible before the bar hides. */
const FINISHED_VISIBLE_MS = 2500;

/** Ticks the persisted rest timer and fires a haptic when it ends in the foreground. */
export function useRestTimer(): RestTimerView {
  const rest = useActiveWorkoutStore((s) => s.rest);
  const clearRest = useActiveWorkoutStore((s) => s.clearRest);
  const now = useNow(250, !!rest);
  const firedFor = useRef<number | null>(null);

  const remainingMs = rest ? rest.endsAt - now : 0;
  const finished = !!rest && remainingMs <= 0;

  useEffect(() => {
    if (!rest || !finished || firedFor.current === rest.endsAt) return;
    firedFor.current = rest.endsAt;
    // Ended while backgrounded: the local notification already alerted, so just hide the bar.
    const late = Date.now() - rest.endsAt > 5000;
    if (late || AppState.currentState !== 'active') {
      clearRest();
      return;
    }
    haptics.alert();
    const t = setTimeout(clearRest, FINISHED_VISIBLE_MS);
    return () => clearTimeout(t);
  }, [rest, finished, clearRest]);

  if (!rest) return { active: false, remainingSec: 0, fraction: 0, justFinished: false };
  const remainingSec = Math.max(0, Math.ceil(remainingMs / 1000));
  return {
    active: true,
    remainingSec,
    fraction: rest.durationSec > 0 ? 1 - remainingSec / rest.durationSec : 1,
    justFinished: finished,
  };
}
