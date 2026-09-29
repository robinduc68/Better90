import { router } from 'expo-router';
import { ArrowRight, BookOpen, History, Plus, Timer } from 'lucide-react-native';
import { useMemo } from 'react';
import { View } from 'react-native';

import { STARTER_TEMPLATES } from '@/constants/starterTemplates';
import {
  AppScreen,
  Button,
  Card,
  EmptyState,
  IconBadge,
  IconButton,
  ListGroup,
  ListRow,
  makeStyles,
  PressableScale,
  ProgressBar,
  SectionHeader,
  Text,
  toast,
  Divider,
  useTheme,
} from '@/design-system';
import {
  addDays,
  completedSessions,
  exerciseProgress,
  formatDuration,
  formatShortDate,
  formatVolume,
  sessionDurationSec,
  sessionVolume,
  weekday,
} from '@/domain';
import { useTodayDate } from '@/hooks';
import { useActiveWorkoutStore, useAppStore } from '@/store';

import { startEmptyWorkout, startWorkout } from './actions';
import { TemplateArtwork } from './artwork';
import { ExerciseTemplateRow } from './components/ExerciseTemplateRow';
import { WeekStrip, type WeekStripDay } from './components/WeekStrip';

export function WorkoutHomeScreen() {
  const styles = useStyles();
  const { colors } = useTheme();
  const templates = useAppStore((s) => s.templates);
  const sessions = useAppStore((s) => s.sessions);
  const createTemplate = useAppStore((s) => s.createTemplate);
  const active = useActiveWorkoutStore((s) => s.session);
  const gymDays = useAppStore((s) => s.journey?.gymDaysPerWeek ?? 0);
  const today = useTodayDate();
  const todayWd = weekday(today);
  const list = useMemo(() => templates.filter((t) => !t.archivedAt), [templates]);
  const recent = useMemo(() => completedSessions(sessions).slice(0, 3), [sessions]);
  const week: WeekStripDay[] = useMemo(() => {
    const monday = addDays(today, -((todayWd + 6) % 7));
    return Array.from({ length: 7 }, (_, i) => {
      const date = addDays(monday, i);
      const wd = weekday(date);
      return {
        date,
        isToday: date === today,
        planned: list.some((t) => t.weekdays.includes(wd)),
        done: sessions.some((x) => x.status === 'completed' && x.date === date),
      };
    });
  }, [today, todayWd, list, sessions]);
  const weekDone = week.filter((d) => d.done).length;
  const weekTarget = Math.max(gymDays, week.filter((d) => d.planned).length, weekDone);

  const newTemplate = () => {
    const id = createTemplate({ name: 'New workout' });
    router.push({ pathname: '/workout/template/[id]', params: { id, isNew: '1' } });
  };

  const addStarter = (s: (typeof STARTER_TEMPLATES)[number]) => {
    createTemplate({
      name: s.name,
      exercises: s.exercises.map(([exerciseId, targetSets, targetReps]) => ({ exerciseId, targetSets, targetReps, restSeconds: null })),
    });
    toast.show(`${s.name} added`);
  };

  return (
    <AppScreen>
      <View style={styles.header}>
        <Text variant="h1" accessibilityRole="header">
          Workout
        </Text>
        <IconButton icon={Plus} variant="surface" onPress={newTemplate} accessibilityLabel="Create workout" />
      </View>

      {active ? (
        <Card variant="elevated">
          <View style={styles.activeHead}>
            <IconBadge icon={Timer} tone="brand" size="sm" />
            <Text variant="label" color="accent">
              In progress
            </Text>
          </View>
          <Text variant="h2" style={styles.activeTitle} numberOfLines={1}>
            {active.name}
          </Text>
          <Text variant="small" color="secondary" tabular>
            {exerciseProgress(active).done} / {exerciseProgress(active).total} exercises · {formatDuration(Math.round(sessionDurationSec(active) / 60))}
          </Text>
          <ProgressBar value={exerciseProgress(active).fraction} style={styles.activeBar} />
          <Button label="Continue" icon={ArrowRight} iconPosition="right" onPress={() => router.push('/workout/active')} style={styles.activeCta} />
        </Card>
      ) : null}

      <View style={styles.week}>
        <WeekStrip days={week} done={weekDone} target={weekTarget} />
      </View>

      <SectionHeader title="My workouts" actionLabel={list.length ? 'New' : undefined} onAction={list.length ? newTemplate : undefined} />
      {list.length === 0 ? (
        <Card variant="flat">
          <EmptyState title="No workout yet" message="Create your first workout and start tracking strength." actionLabel="Create workout" onAction={newTemplate} />
        </Card>
      ) : (
        <View style={styles.templates}>
          {[...list]
            .sort((a, b) => Number(b.weekdays.includes(todayWd)) - Number(a.weekdays.includes(todayWd)))
            .map((t) => (
              <ExerciseTemplateRow
                key={t.id}
                template={t}
                isToday={t.weekdays.includes(todayWd)}
                onOpen={() => router.push({ pathname: '/workout/template/[id]', params: { id: t.id } })}
                onStart={() => startWorkout(t)}
                startDisabled={t.exercises.length === 0 || !!active}
              />
            ))}
        </View>
      )}


      {list.length < 2 ? (
        <>
          <SectionHeader title="Starter workouts" />
          <Text variant="caption" color="muted" style={styles.starterHint}>
            Optional starting points. Edit anything after adding.
          </Text>
          <ListGroup>
            {STARTER_TEMPLATES.filter((s) => !list.some((t) => t.name === s.name)).map((s, i) => (
              <View key={s.name}>
                {i > 0 ? <Divider inset={16} /> : null}
                <PressableScale onPress={() => addStarter(s)} pressedScale={1} pressedOpacity={0.7} style={styles.starter} accessibilityLabel={`Add ${s.name}`} accessibilityHint="Adds this workout to My workouts">
                  <TemplateArtwork template={{ exercises: s.exercises.map(([exerciseId]) => ({ exerciseId })) }} size={44} />
                  <View style={styles.flex}>
                    <Text variant="bodyMedium">{s.name}</Text>
                    <Text variant="caption" color="muted">
                      {s.exercises.length} exercises
                    </Text>
                  </View>
                  <Plus size={18} color={colors.accentForeground} />
                </PressableScale>
              </View>
            ))}
          </ListGroup>
        </>
      ) : null}

      <SectionHeader title="Recent" actionLabel={recent.length ? 'All history' : undefined} onAction={() => router.push('/workout/history')} />
      {recent.length === 0 ? (
        <Text variant="small" color="muted">
          Completed workouts appear here with their volume and duration.
        </Text>
      ) : (
        <ListGroup>
          {recent.map((s, i) => (
            <View key={s.id}>
              {i > 0 ? <Divider inset={16} /> : null}
              <ListRow
                title={s.name}
                subtitle={`${formatShortDate(s.date)} · ${formatDuration(Math.round(sessionDurationSec(s) / 60))}`}
                value={formatVolume(sessionVolume(s))}
                onPress={() => router.push({ pathname: '/workout/session/[id]', params: { id: s.id } })}
              />
            </View>
          ))}
        </ListGroup>
      )}

      <SectionHeader title="Explore" />
      <ListGroup>
        <ListRow icon={BookOpen} title="Exercise library" subtitle="67 exercises · instructions and your history" onPress={() => router.push('/workout/library')} />
        <Divider inset={60} />
        {!active ? (
          <>
            <ListRow icon={Plus} title="Start empty workout" subtitle="Add exercises as you go" onPress={startEmptyWorkout} />
            <Divider inset={60} />
          </>
        ) : null}
        <ListRow icon={History} title="Workout history" subtitle={recent.length ? `${completedSessions(sessions).length} sessions logged` : undefined} onPress={() => router.push('/workout/history')} />
      </ListGroup>
    </AppScreen>
  );
}

const useStyles = makeStyles((t) => ({
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: t.spacing.md, marginBottom: t.spacing.xs },
  activeTitle: { marginTop: t.spacing.xs },
  activeBar: { marginTop: t.spacing.md },
  activeCta: { marginTop: t.spacing.lg },
  flex: { flex: 1 },
  week: { marginTop: t.spacing.md },
  activeHead: { flexDirection: 'row', alignItems: 'center', gap: t.spacing.xs },
  templates: { gap: t.spacing.xs },
  starter: { flexDirection: 'row', alignItems: 'center', gap: t.spacing.sm, minHeight: 64, paddingHorizontal: t.spacing.sm },
  starterHint: { marginBottom: t.spacing.sm, marginTop: -t.spacing.xs },
}));
