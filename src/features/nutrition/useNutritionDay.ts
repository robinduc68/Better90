import { useMemo } from 'react';
import { useShallow } from 'zustand/react/shallow';

import { addDays, fromISODate, nutritionTotals, WEEKDAY_SHORT, type ISODate } from '@/domain';
import type { DateStripDay } from '@/design-system';
import { useAppStore } from '@/store';

export function useNutritionDay(date: ISODate) {
  const { proteinLogs, meals, journey } = useAppStore(useShallow((s) => ({ proteinLogs: s.proteinLogs, meals: s.meals, journey: s.journey })));
  return useMemo(() => {
    const totals = nutritionTotals(date, proteinLogs, meals);
    return {
      totals,
      meals: meals.filter((m) => m.date === date).sort((a, b) => a.loggedAt.localeCompare(b.loggedAt)),
      quickLogs: proteinLogs.filter((l) => l.date === date).sort((a, b) => a.loggedAt.localeCompare(b.loggedAt)),
      targets: {
        proteinG: journey?.proteinTargetG ?? 0,
        calories: journey?.calorieTargetKcal ?? null,
        carbsG: journey?.carbsTargetG ?? null,
        fatG: journey?.fatTargetG ?? null,
      },
    };
  }, [date, proteinLogs, meals, journey]);
}

/** Last 7 days ending today, for date strips. */
export function weekStripDays(today: ISODate, marked: (d: ISODate) => boolean, earliest?: ISODate): DateStripDay[] {
  return Array.from({ length: 7 }, (_, i) => {
    const d = addDays(today, i - 6);
    return {
      key: d,
      weekday: WEEKDAY_SHORT[fromISODate(d).getDay()]!,
      day: String(fromISODate(d).getDate()),
      disabled: earliest ? d < earliest : false,
      marked: marked(d),
    };
  });
}
