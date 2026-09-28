import { router } from 'expo-router';
import { ArrowDown, ArrowUp, Plus } from 'lucide-react-native';
import { useMemo, useState } from 'react';
import { View } from 'react-native';

import { HABIT_CATALOG, habitFromTemplate } from '@/constants/habitCatalog';
import {
  AppHeader,
  AppScreen,
  BottomSheet,
  Button,
  Card,
  Divider,
  EmptyState,
  IconButton,
  ListRow,
  makeStyles,
  PressableScale,
  SectionHeader,
  Text,
  useTheme,
} from '@/design-system';
import type { Habit } from '@/domain';
import { newId } from '@/lib/id';
import { nowISO } from '@/lib/now';
import { useAppStore } from '@/store';

function describe(h: Habit) {
  if (h.kind === 'boolean') return h.routineSteps.length ? `Checklist · ${h.routineSteps.length} steps` : 'Done / not done';
  if (h.kind === 'duration') return `${h.target ?? 0} min daily`;
  return `${(h.target ?? 0).toLocaleString('en-US')} ${h.unit ?? ''} daily`;
}

export function HabitsScreen() {
  const styles = useStyles();
  const { colors } = useTheme();
  const habits = useAppStore((s) => s.habits);
  const addHabit = useAppStore((s) => s.addHabit);
  const moveHabit = useAppStore((s) => s.moveHabit);
  const [adding, setAdding] = useState(false);
  const active = useMemo(() => habits.filter((h) => !h.archivedAt).sort((a, b) => a.sortOrder - b.sortOrder), [habits]);
  const available = HABIT_CATALOG.filter((t) => !active.some((h) => h.templateKey === t.key));

  const nextOrder = () => Math.max(-1, ...habits.map((h) => h.sortOrder)) + 1;

  const addCustom = () => {
    const now = nowISO();
    const habit: Habit = {
      id: newId(),
      templateKey: null,
      name: 'New habit',
      kind: 'boolean',
      target: null,
      unit: null,
      category: 'custom',
      timeOfDay: 'anytime',
      routineSteps: [],
      routineTags: [],
      countsTowardScore: true,
      sortOrder: nextOrder(),
      archivedAt: null,
      createdAt: now,
      updatedAt: now,
    };
    addHabit(habit);
    setAdding(false);
    router.push({ pathname: '/profile/habit/[id]', params: { id: habit.id } });
  };

  return (
    <AppScreen header={<AppHeader title="Habits & routines" />} footer={<Button label="Add habit" icon={Plus} onPress={() => setAdding(true)} />}>
      <Text variant="small" color="muted">
        Each habit is a one-tap row on Today. Checklist routines (like skincare) can have steps and special nights.
      </Text>
      <SectionHeader title="Daily" trailing={String(active.length)} />
      {active.length === 0 ? (
        <Card variant="flat">
          <EmptyState title="No habits yet" message="Add skincare, reading, English or anything you want to do daily." />
        </Card>
      ) : (
        <View style={styles.list}>
          {active.map((h, i) => (
            <Card key={h.id} padding="none" style={styles.item}>
              <PressableScale
                onPress={() => router.push({ pathname: '/profile/habit/[id]', params: { id: h.id } })}
                pressedScale={1}
                pressedOpacity={0.7}
                style={styles.itemBody}
                accessibilityHint="Edit habit"
              >
                <Text variant="bodyMedium" numberOfLines={1}>
                  {h.name}
                </Text>
                <Text variant="caption" color="muted">
                  {describe(h)}
                  {h.countsTowardScore ? '' : ' · not scored'}
                </Text>
              </PressableScale>
              <IconButton icon={ArrowUp} onPress={() => moveHabit(h.id, -1)} disabled={i === 0} accessibilityLabel={`Move ${h.name} up`} />
              <IconButton icon={ArrowDown} onPress={() => moveHabit(h.id, 1)} disabled={i === active.length - 1} accessibilityLabel={`Move ${h.name} down`} />
            </Card>
          ))}
        </View>
      )}

      <BottomSheet visible={adding} onClose={() => setAdding(false)} title="Add habit">
        <View style={styles.sheetList}>
          {available.map((t, i) => (
            <View key={t.key}>
              {i > 0 ? <Divider /> : null}
              <ListRow
                title={t.name}
                subtitle={t.description}
                trailing={<Plus size={18} color={colors.accentForeground} />}
                showChevron={false}
                onPress={() => {
                  addHabit(habitFromTemplate(t, newId, nextOrder(), nowISO()));
                  setAdding(false);
                }}
              />
            </View>
          ))}
          {available.length > 0 ? <Divider /> : null}
          <ListRow title="Custom habit" subtitle="Done / not done, minutes, or a count" onPress={addCustom} />
        </View>
      </BottomSheet>
    </AppScreen>
  );
}

const useStyles = makeStyles((t) => ({
  list: { gap: t.spacing.xs },
  item: { flexDirection: 'row', alignItems: 'center', paddingRight: t.spacing.xxs },
  itemBody: { flex: 1, paddingVertical: t.spacing.md, paddingLeft: t.spacing.md, gap: 2 },
  sheetList: { marginHorizontal: -t.spacing.md },
}));
