import { useState } from 'react';
import { RefreshControl } from 'react-native';

import { AppScreen, makeStyles, useTheme } from '@/design-system';
import { greeting } from '@/domain';
import { useTodayDate } from '@/hooks';
import { flushOutbox } from '@/services/sync';
import { useAppStore } from '@/store';

import { JourneyHero } from './components/JourneyHero';
import { DayView } from './DayView';
import { useDayModel } from './useDayModel';

export function TodayScreen() {
  const styles = useStyles();
  const theme = useTheme();
  const today = useTodayDate();
  const name = useAppStore((s) => s.profile?.name ?? '');
  const model = useDayModel(today, today);
  const [refreshing, setRefreshing] = useState(false);
  const [quickLog, setQuickLog] = useState(false);

  if (!model) return null;
  return (
    <AppScreen
      contentStyle={styles.content}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          tintColor={theme.colors.textMuted}
          onRefresh={async () => {
            setRefreshing(true);
            await flushOutbox(true).catch(() => undefined);
            setRefreshing(false);
          }}
        />
      }
    >
      <JourneyHero greeting={greeting()} name={name} progress={model.progress} onQuickLog={() => setQuickLog(true)} />
      <DayView model={model} quickLogOpen={quickLog} onQuickLogClose={() => setQuickLog(false)} />
    </AppScreen>
  );
}

const useStyles = makeStyles((t) => ({
  content: { gap: t.spacing.xl },
}));
