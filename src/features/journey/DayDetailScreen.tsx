import { useLocalSearchParams } from 'expo-router';

import { AppHeader, AppScreen, EmptyState } from '@/design-system';
import { formatDayDate } from '@/domain';
import { DayView } from '@/features/today/DayView';
import { useDayModel } from '@/features/today/useDayModel';
import { useTodayDate } from '@/hooks';

/** Any past day is editable — logging late is fine. */
export function DayDetailScreen() {
  const { date } = useLocalSearchParams<{ date: string }>();
  const today = useTodayDate();
  const safeDate = date && /^\d{4}-\d{2}-\d{2}$/.test(date) && date <= today ? date : today;
  const model = useDayModel(safeDate, today);
  if (!model) {
    return (
      <AppScreen header={<AppHeader />}>
        <EmptyState title="Day unavailable" message="This day is outside your journey." />
      </AppScreen>
    );
  }
  return (
    <AppScreen header={<AppHeader title={`Day ${model.progress.dayNumber}`} subtitle={formatDayDate(safeDate)} />}>
      <DayView model={model} />
    </AppScreen>
  );
}
