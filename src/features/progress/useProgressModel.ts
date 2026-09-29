import { useMemo } from 'react';

import { EXERCISES } from '@/data/exercises';
import {
  checkpointsFor,
  completedSessions,
  dateForDay,
  journeyProgress,
  sessionVolume,
  strengthGain,
  strengthSeries,
  type BodyMeasurement,
  type ISODate,
} from '@/domain';
import { useAppStore } from '@/store';

export type MeasureKey = 'weightKg' | 'waistCm' | 'chestCm' | 'leftArmCm' | 'rightArmCm' | 'bodyFatPct';

export interface MeasureSummary {
  key: MeasureKey;
  label: string;
  unit: string;
  first: { date: ISODate; value: number } | null;
  latest: { date: ISODate; value: number } | null;
  points: { date: ISODate; value: number }[];
}

export const MEASURES: { key: MeasureKey; label: string; unit: string }[] = [
  { key: 'weightKg', label: 'Weight', unit: 'kg' },
  { key: 'waistCm', label: 'Waist', unit: 'cm' },
  { key: 'chestCm', label: 'Chest', unit: 'cm' },
  { key: 'leftArmCm', label: 'Left arm', unit: 'cm' },
  { key: 'rightArmCm', label: 'Right arm', unit: 'cm' },
  { key: 'bodyFatPct', label: 'Body fat', unit: '%' },
];

export function summarizeMeasure(measurements: BodyMeasurement[], key: MeasureKey): MeasureSummary {
  const meta = MEASURES.find((m) => m.key === key)!;
  const points = measurements
    .filter((m) => m[key] !== null)
    .sort((a, b) => a.date.localeCompare(b.date))
    .map((m) => ({ date: m.date, value: m[key] as number }));
  return { ...meta, first: points[0] ?? null, latest: points[points.length - 1] ?? null, points };
}

export function useProgressModel(today: ISODate) {
  const journey = useAppStore((s) => s.journey);
  const measurements = useAppStore((s) => s.measurements);
  const sessions = useAppStore((s) => s.sessions);
  const photos = useAppStore((s) => s.photos);

  return useMemo(() => {
    if (!journey) return null;
    const progress = journeyProgress(journey, today);
    const measures = Object.fromEntries(MEASURES.map((m) => [m.key, summarizeMeasure(measurements, m.key)])) as Record<MeasureKey, MeasureSummary>;
    const done = completedSessions(sessions);
    const strength = EXERCISES.map((e) => ({ exercise: e, gain: strengthGain(sessions, e.id) }))
      .filter((x): x is { exercise: (typeof EXERCISES)[number]; gain: NonNullable<ReturnType<typeof strengthGain>> } => x.gain !== null)
      .sort((a, b) => b.gain.deltaKg / (b.gain.first || 1) - a.gain.deltaKg / (a.gain.first || 1))
      .map((x) => ({ ...x, series: strengthSeries(sessions, x.exercise.id).map((p) => p.topWeightKg) }));
    const checkpoints = checkpointsFor(journey.durationDays).map((day) => {
      const date = dateForDay(journey, day);
      const logged = measurements.some((m) => m.date >= date && m.date <= dateForDay(journey, day + 3));
      const photoCount = photos.filter((p) => p.dayNumber === day).length;
      const state: 'done' | 'now' | 'upcoming' | 'past' =
        logged || photoCount > 0 ? 'done' : progress.dayNumber >= day && progress.dayNumber <= day + 3 ? 'now' : day > progress.dayNumber ? 'upcoming' : 'past';
      return { day, date, logged, photoCount, state };
    });
    return {
      journey,
      progress,
      measures,
      workoutsCompleted: done.length,
      totalVolume: done.reduce((s, x) => s + sessionVolume(x), 0),
      strength,
      checkpoints,
      photoCount: photos.length,
    };
  }, [journey, measurements, sessions, photos, today]);
}
