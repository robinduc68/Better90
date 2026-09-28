import { todayISO } from '@/domain';
import { newId } from '@/lib/id';
import { useActiveWorkoutStore, useAppStore } from '@/store';

import { generateDemoData } from './demoSeed';

/** Development only: replaces local data with the demo journey (Day 23 of 90). */
export function loadDemoData() {
  useActiveWorkoutStore.getState().discard();
  const data = generateDemoData(todayISO(), newId);
  const s = useAppStore.getState();
  s.loadSnapshot({ ...data, settings: { ...s.settings, seenMilestones: [7, 15] } });
}
