import { router } from 'expo-router';
import { useMemo } from 'react';
import { SectionList, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppHeader, EmptyState, ListRow, makeStyles, Text } from '@/design-system';
import { completedSessions, completedSetCount, formatDayDate, formatDuration, formatVolume, fromISODate, sessionDurationSec, sessionVolume } from '@/domain';
import { useAppStore } from '@/store';

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

export function HistoryScreen() {
  const styles = useStyles();
  const insets = useSafeAreaInsets();
  const sessions = useAppStore((s) => s.sessions);
  const sections = useMemo(() => {
    const groups = new Map<string, ReturnType<typeof completedSessions>>();
    for (const s of completedSessions(sessions)) {
      const d = fromISODate(s.date);
      const key = `${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
      groups.set(key, [...(groups.get(key) ?? []), s]);
    }
    return [...groups.entries()].map(([title, data]) => ({ title, data }));
  }, [sessions]);

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <AppHeader title="Workout history" />
      <SectionList
        sections={sections}
        keyExtractor={(s) => s.id}
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 24 }]}
        stickySectionHeadersEnabled={false}
        renderSectionHeader={({ section }) => (
          <Text variant="label" color="muted" style={styles.section}>
            {section.title}
          </Text>
        )}
        renderItem={({ item }) => (
          <View style={styles.item}>
            <ListRow
              title={item.name}
              subtitle={`${formatDayDate(item.date)} · ${formatDuration(Math.round(sessionDurationSec(item) / 60))} · ${item.exercises.length} exercises · ${completedSetCount(item)} sets`}
              value={formatVolume(sessionVolume(item))}
              onPress={() => router.push({ pathname: '/workout/session/[id]', params: { id: item.id } })}
            />
          </View>
        )}
        ListEmptyComponent={<EmptyState title="No workouts yet" message="Finish your first workout to start your history." />}
      />
    </View>
  );
}

const useStyles = makeStyles((t) => ({
  root: { flex: 1, backgroundColor: t.colors.background },
  content: { paddingHorizontal: t.layout.screenPadding },
  section: { marginTop: t.spacing.xl, marginBottom: t.spacing.xs },
  item: { backgroundColor: t.colors.surface, borderRadius: t.radius.lg, borderWidth: 1, borderColor: t.colors.border, marginBottom: t.spacing.xs },
}));
