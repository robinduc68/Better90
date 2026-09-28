import { useMemo } from 'react';

import { EXERCISES } from '@/data/exercises';
import { completedSessions, computeStreaks, journeyEndDate, journeyProgress, strengthGain, type ISODate, type ProgressPhoto } from '@/domain';
import { useJourneyIndex } from '@/hooks';
import { useAppStore } from '@/store';

export interface ShareStats {
  dayNumber: number;
  totalDays: number;
  fraction: number;
  consistency: number;
  workouts: number;
  bestLift: { name: string; deltaKg: number } | null;
  weightDeltaKg: number | null;
  waistDeltaCm: number | null;
  latestPhoto: ProgressPhoto | null;
}

/** Aggregates for share cards and milestones. Nothing here is shared unless the user opts in. */
export function useShareStats(today: ISODate): ShareStats | null {
  const index = useJourneyIndex();
  const measurements = useAppStore((s) => s.measurements);
  const photos = useAppStore((s) => s.photos);
  return useMemo(() => {
    if (!index) return null;
    const { journey, sessions } = index.data;
    const progress = journeyProgress(journey, today);
    const end = journeyEndDate(journey);
    const last = today < end ? today : end;
    const streaks = computeStreaks(index.scoreRange(journey.startDate, last), last);
    const best = EXERCISES.map((e) => ({ name: e.name, gain: strengthGain(sessions, e.id) }))
      .filter((x) => x.gain && x.gain.deltaKg > 0)
      .sort((a, b) => b.gain!.deltaKg - a.gain!.deltaKg)[0];
    const sorted = [...measurements].sort((a, b) => a.date.localeCompare(b.date));
    const delta = (key: 'weightKg' | 'waistCm') => {
      const vals = sorted.map((m) => m[key]).filter((v): v is number => v !== null);
      return vals.length >= 2 ? Math.round((vals[vals.length - 1]! - vals[0]!) * 10) / 10 : null;
    };
    const front = photos.filter((p) => p.pose === 'front').sort((a, b) => b.dayNumber - a.dayNumber)[0] ?? null;
    return {
      dayNumber: progress.dayNumber,
      totalDays: progress.totalDays,
      fraction: progress.fraction,
      consistency: streaks.consistency,
      workouts: completedSessions(sessions).length,
      bestLift: best ? { name: best.name, deltaKg: best.gain!.deltaKg } : null,
      weightDeltaKg: delta('weightKg'),
      waistDeltaCm: delta('waistCm'),
      latestPhoto: front,
    };
  }, [index, measurements, photos, today]);
}
