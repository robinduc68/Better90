import type { ActivityKey, GoalKey } from '@/domain';

export const GOAL_OPTIONS: { key: GoalKey; label: string }[] = [
  { key: 'build_muscle', label: 'Build muscle' },
  { key: 'lose_fat', label: 'Lose fat' },
  { key: 'recomposition', label: 'Body recomposition' },
  { key: 'appearance', label: 'Improve appearance' },
  { key: 'discipline', label: 'Build discipline' },
  { key: 'custom', label: 'Something else' },
];

export const ACTIVITY_OPTIONS: { key: ActivityKey; label: string }[] = [
  { key: 'football', label: 'Football' },
  { key: 'running', label: 'Running' },
  { key: 'cycling', label: 'Cycling' },
  { key: 'other', label: 'Other' },
];

export const ACTIVITY_LABEL: Record<ActivityKey, string> = {
  football: 'Football',
  running: 'Running',
  cycling: 'Cycling',
  other: 'Activity',
};
