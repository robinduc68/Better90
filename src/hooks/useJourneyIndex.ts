import { useMemo } from 'react';
import { useShallow } from 'zustand/react/shallow';

import { JourneyIndex, type JourneyData } from '@/domain';
import { useActiveWorkoutStore, useAppStore } from '@/store';

/** Journey data including the in-progress workout, memoized across renders. */
export function useJourneyData(): JourneyData | null {
  const data = useAppStore(
    useShallow((s) => ({
      journey: s.journey,
      habits: s.habits,
      habitLogs: s.habitLogs,
      proteinLogs: s.proteinLogs,
      meals: s.meals,
      waterLogs: s.waterLogs,
      dailyLogs: s.dailyLogs,
      templates: s.templates,
      sessions: s.sessions,
    })),
  );
  const active = useActiveWorkoutStore((s) => s.session);
  return useMemo(() => {
    if (!data.journey) return null;
    return { ...data, journey: data.journey, sessions: active ? [...data.sessions, active] : data.sessions };
  }, [data, active]);
}

export function useJourneyIndex(): JourneyIndex | null {
  const data = useJourneyData();
  return useMemo(() => (data ? new JourneyIndex(data) : null), [data]);
}
