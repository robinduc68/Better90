import { activateKeepAwakeAsync, deactivateKeepAwake } from 'expo-keep-awake';
import { router } from 'expo-router';
import { ArrowDown, ArrowUp, ChevronDown, Copy, Ellipsis, History, Plus, Timer, Trash2 } from 'lucide-react-native';
import { useEffect, useMemo, useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { getExercise } from '@/data/exercises';
import {
  BottomSheet,
  Button,
  ConfirmSheet,
  EmptyState,
  IconButton,
  ListRow,
  makeStyles,
  SegmentedControl,
  Switch,
  Text,
  useTheme,
} from '@/design-system';
import { completedSetCount, formatElapsed, isExerciseComplete, sessionDurationSec } from '@/domain';
import { useNow } from '@/hooks';
import { useActiveWorkoutStore, useAppStore, type RestPreset } from '@/store';

import { discardWorkout, finishWorkout } from '../actions';
import { ExerciseCard } from './ExerciseCard';
import { RestTimerBar } from './RestTimerBar';
import { useRestTimer } from './useRestTimer';

const KEEP_AWAKE_TAG = 'active-workout';
const REST_OPTIONS: { value: RestPreset; label: string }[] = [
  { value: 60, label: '60s' },
  { value: 90, label: '90s' },
  { value: 120, label: '2m' },
  { value: 180, label: '3m' },
];

export function ActiveWorkoutScreen() {
  const styles = useStyles();
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const session = useActiveWorkoutStore((s) => s.session);
  const history = useAppStore((s) => s.sessions);
  const settings = useAppStore((s) => s.settings);
  const updateSettings = useAppStore((s) => s.updateSettings);
  const now = useNow(1000, !!session);
  const timer = useRestTimer();
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});
  const [menu, setMenu] = useState(false);
  const [exerciseMenu, setExerciseMenu] = useState<string | null>(null);
  const [setOptions, setSetOptions] = useState<{ exerciseItemId: string; setId: string; index: number } | null>(null);
  const [confirm, setConfirm] = useState<'finish' | 'discard' | 'empty' | null>(null);

  useEffect(() => {
    void activateKeepAwakeAsync(KEEP_AWAKE_TAG).catch(() => undefined);
    return () => {
      void deactivateKeepAwake(KEEP_AWAKE_TAG);
    };
  }, []);

  const firstOpen = useMemo(() => session?.exercises.find((e) => !isExerciseComplete(e))?.id ?? null, [session]);

  if (!session) {
    return (
      <View style={[styles.root, { paddingTop: insets.top }]}>
        <EmptyState title="No active workout" message="Start one from Today or the Workout tab." actionLabel="Back to Today" onAction={() => router.replace('/(tabs)')} />
      </View>
    );
  }

  const elapsed = sessionDurationSec(session, new Date(now));
  const done = completedSetCount(session);
  const total = session.exercises.reduce((n, e) => n + e.sets.length, 0);

  const isExpanded = (id: string, complete: boolean) => collapsed[id] === undefined ? !complete || id === firstOpen : !collapsed[id];

  const minimize = () => (router.canGoBack() ? router.back() : router.replace('/(tabs)'));

  const requestFinish = () => {
    if (done === 0) setConfirm('empty');
    else if (done < total) setConfirm('finish');
    else complete();
  };

  const complete = () => {
    setConfirm(null);
    const finished = finishWorkout();
    if (finished) router.replace({ pathname: '/workout/complete', params: { id: finished.id } });
  };

  const menuExercise = exerciseMenu ? session.exercises.find((e) => e.id === exerciseMenu) : null;
  const menuIndex = menuExercise ? session.exercises.indexOf(menuExercise) : -1;

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <IconButton icon={ChevronDown} onPress={minimize} accessibilityLabel="Minimize workout" />
        <View style={styles.headerCenter} accessible accessibilityLabel={`${session.name}, ${formatElapsed(elapsed)} elapsed, ${done} of ${total} sets`}>
          <Text variant="bodySemibold" numberOfLines={1}>
            {session.name}
          </Text>
          <Text variant="metricS" color="accent">
            {formatElapsed(elapsed)}
          </Text>
        </View>
        <IconButton icon={Ellipsis} onPress={() => setMenu(true)} accessibilityLabel="Workout options" />
      </View>

      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          style={styles.flex}
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          automaticallyAdjustKeyboardInsets
          showsVerticalScrollIndicator={false}
        >
          <Text variant="caption" color="muted" tabular style={styles.progressText}>
            {done} of {total} sets · {session.exercises.filter(isExerciseComplete).length} of {session.exercises.length} exercises
          </Text>
          {session.exercises.length === 0 ? (
            <EmptyState
              title="Empty workout"
              message="Add exercises as you go. Last time's numbers load automatically."
              actionLabel="Add exercises"
              onAction={() => router.push({ pathname: '/workout/library', params: { mode: 'session' } })}
            />
          ) : null}
          {session.exercises.map((item) => {
            const complete = isExerciseComplete(item);
            return (
              <ExerciseCard
                key={item.id}
                item={item}
                sessionId={session.id}
                history={history}
                expanded={isExpanded(item.id, complete)}
                onToggleExpanded={() => setCollapsed((c) => ({ ...c, [item.id]: isExpanded(item.id, complete) }))}
                onOptions={() => setExerciseMenu(item.id)}
                onSetOptions={(setId, index) => setSetOptions({ exerciseItemId: item.id, setId, index })}
              />
            );
          })}
          {session.exercises.length > 0 ? (
            <Button
              label="Add exercise"
              icon={Plus}
              variant="ghost"
              size="md"
              onPress={() => router.push({ pathname: '/workout/library', params: { mode: 'session' } })}
              style={styles.addExercise}
            />
          ) : null}
        </ScrollView>

        <RestTimerBar timer={timer} />
        <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 12) }]}>
          <Button label="Finish workout" onPress={requestFinish} />
        </View>
      </KeyboardAvoidingView>

      <BottomSheet visible={menu} onClose={() => setMenu(false)} title="Workout">
        <View style={styles.menuRow}>
          <Timer size={18} color={colors.textSecondary} />
          <Text variant="bodyMedium" style={styles.flex}>
            Rest timer
          </Text>
          <Switch value={settings.restTimerEnabled} onValueChange={(v) => updateSettings({ restTimerEnabled: v })} accessibilityLabel="Rest timer" />
        </View>
        {settings.restTimerEnabled ? (
          <SegmentedControl options={REST_OPTIONS} value={settings.restTimerSeconds} onChange={(v) => updateSettings({ restTimerSeconds: v })} accessibilityLabel="Rest duration" />
        ) : null}
        <ListRow
          icon={Plus}
          title="Add exercise"
          onPress={() => {
            setMenu(false);
            router.push({ pathname: '/workout/library', params: { mode: 'session' } });
          }}
        />
        <ListRow
          icon={Trash2}
          title="Discard workout"
          destructive
          showChevron={false}
          onPress={() => {
            setMenu(false);
            setConfirm('discard');
          }}
        />
      </BottomSheet>

      <BottomSheet visible={!!menuExercise} onClose={() => setExerciseMenu(null)} title={menuExercise ? getExercise(menuExercise.exerciseId)?.name : undefined}>
        {menuExercise ? (
          <View>
            <ListRow
              icon={History}
              title="History"
              onPress={() => {
                setExerciseMenu(null);
                router.push({ pathname: '/workout/exercise/[id]', params: { id: menuExercise.exerciseId } });
              }}
            />
            <ListRow icon={ArrowUp} title="Move up" disabled={menuIndex === 0} showChevron={false} onPress={() => useActiveWorkoutStore.getState().moveExercise(menuExercise.id, -1)} />
            <ListRow
              icon={ArrowDown}
              title="Move down"
              disabled={menuIndex === session.exercises.length - 1}
              showChevron={false}
              onPress={() => useActiveWorkoutStore.getState().moveExercise(menuExercise.id, 1)}
            />
            <ListRow
              icon={Trash2}
              title="Remove exercise"
              destructive
              showChevron={false}
              onPress={() => {
                useActiveWorkoutStore.getState().removeExercise(menuExercise.id);
                setExerciseMenu(null);
              }}
            />
          </View>
        ) : null}
      </BottomSheet>

      <BottomSheet visible={!!setOptions} onClose={() => setSetOptions(null)} title={setOptions ? `Set ${setOptions.index + 1}` : undefined}>
        {setOptions ? (
          <View>
            <ListRow
              icon={Copy}
              title="Add another set"
              showChevron={false}
              onPress={() => {
                useActiveWorkoutStore.getState().addSet(setOptions.exerciseItemId);
                setSetOptions(null);
              }}
            />
            <ListRow
              icon={Trash2}
              title="Delete set"
              destructive
              showChevron={false}
              onPress={() => {
                useActiveWorkoutStore.getState().removeSet(setOptions.exerciseItemId, setOptions.setId);
                setSetOptions(null);
              }}
            />
          </View>
        ) : null}
      </BottomSheet>

      <ConfirmSheet
        visible={confirm === 'finish'}
        title="Finish workout?"
        message={`${done} of ${total} sets completed. Unfinished sets won't be saved.`}
        confirmLabel="Finish workout"
        cancelLabel="Keep going"
        onConfirm={complete}
        onCancel={() => setConfirm(null)}
      />
      <ConfirmSheet
        visible={confirm === 'empty'}
        title="No sets completed yet"
        message="Complete at least one set to save this workout, or discard it."
        confirmLabel="Discard workout"
        cancelLabel="Keep going"
        destructive
        onConfirm={() => {
          setConfirm(null);
          discardWorkout();
          router.replace('/(tabs)');
        }}
        onCancel={() => setConfirm(null)}
      />
      <ConfirmSheet
        visible={confirm === 'discard'}
        title="Discard this workout?"
        message="Sets from this session will be deleted. This can't be undone."
        confirmLabel="Discard workout"
        cancelLabel="Keep going"
        destructive
        onConfirm={() => {
          setConfirm(null);
          discardWorkout();
          router.replace('/(tabs)');
        }}
        onCancel={() => setConfirm(null)}
      />
    </View>
  );
}

const useStyles = makeStyles((t) => ({
  root: { flex: 1, backgroundColor: t.colors.background },
  flex: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: t.spacing.xs, minHeight: 60, borderBottomWidth: 1, borderBottomColor: t.colors.border },
  headerCenter: { flex: 1, alignItems: 'center' },
  content: { paddingHorizontal: t.layout.screenPaddingDense, paddingBottom: t.spacing['2xl'], gap: t.spacing.sm },
  progressText: { textAlign: 'center', marginVertical: t.spacing.sm },
  addExercise: { alignSelf: 'center', marginTop: t.spacing.xs },
  footer: { paddingHorizontal: t.layout.screenPaddingDense, paddingTop: t.spacing.sm, borderTopWidth: 1, borderTopColor: t.colors.border, backgroundColor: t.colors.background },
  menuRow: { flexDirection: 'row', alignItems: 'center', gap: t.spacing.sm, minHeight: 48 },
}));
