import { toast } from '@/design-system';
import { formatLiters, nutritionTotals, type Habit, type ISODate } from '@/domain';
import { analytics } from '@/services/analytics';
import { haptics } from '@/services/haptics';
import { useAppStore } from '@/store';

/**
 * Daily logging use cases: store write + analytics + feedback.
 * Screens call these instead of touching the store directly.
 */

function totalOn<T extends { date: string }>(list: T[], date: ISODate, pick: (t: T) => number) {
  return list.filter((l) => l.date === date).reduce((s, l) => s + pick(l), 0);
}

export function logProtein(date: ISODate, grams: number) {
  if (!Number.isFinite(grams) || grams <= 0) return;
  const store = useAppStore.getState();
  const id = store.addProtein(date, grams);
  haptics.tick();
  analytics.track('protein_logged', { grams });
  const s = useAppStore.getState();
  const total = nutritionTotals(date, s.proteinLogs, s.meals).proteinG;
  const target = s.journey?.proteinTargetG ?? 0;
  toast.show(`Protein +${grams}g · ${total} / ${target}g`, { actionLabel: 'Undo', onAction: () => useAppStore.getState().removeProteinLog(id) });
}

export function logWater(date: ISODate, ml: number) {
  if (!Number.isFinite(ml) || ml <= 0) return;
  const store = useAppStore.getState();
  const id = store.addWater(date, ml);
  analytics.track('water_logged', { ml });
  const s = useAppStore.getState();
  const total = totalOn(s.waterLogs, date, (l) => l.ml);
  const target = s.journey?.waterTargetMl ?? 0;
  const reached = total >= target && total - ml < target;
  if (reached) haptics.success();
  else haptics.tick();
  toast.show(reached ? `Water target reached · ${formatLiters(total)} L` : `Water +${ml} ml · ${formatLiters(total)} / ${formatLiters(target)} L`, {
    actionLabel: 'Undo',
    onAction: () => useAppStore.getState().removeWaterLog(id),
  });
}

function onHabitDone(habit: Habit) {
  haptics.tick();
  analytics.track('habit_completed', { category: habit.category, kind: habit.kind });
}

export function toggleHabit(habit: Habit, date: ISODate) {
  const done = useAppStore.getState().toggleHabit(habit.id, date);
  if (done) onHabitDone(habit);
}

export function toggleHabitStep(habit: Habit, date: ISODate, stepId: string, applicableStepIds: string[]) {
  const wasDone = (useAppStore.getState().habitLogs.find((l) => l.habitId === habit.id && l.date === date)?.value ?? 0) >= 1;
  const done = useAppStore.getState().toggleHabitStep(habit.id, date, stepId, applicableStepIds);
  if (done && !wasDone) onHabitDone(habit);
}

export function setHabitValue(habit: Habit, date: ISODate, value: number) {
  const prev = useAppStore.getState().habitLogs.find((l) => l.habitId === habit.id && l.date === date)?.value ?? 0;
  useAppStore.getState().setHabitValue(habit.id, date, value);
  const target = habit.target ?? 1;
  if (value >= target && prev < target) onHabitDone(habit);
}

export function setSleep(date: ISODate, minutes: number | null) {
  useAppStore.getState().setSleep(date, minutes);
}
