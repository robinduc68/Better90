import { router } from 'expo-router';
import { ArrowRight, BookOpen, History, Play, Plus } from 'lucide-react-native';
import { useMemo } from 'react';
import { View } from 'react-native';

import { STARTER_TEMPLATES } from '@/constants/starterTemplates';
import {
  AppScreen,
  Button,
  Card,
  EmptyState,
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
  completedSessions,
  estimateTemplateMinutes,
  exerciseProgress,
  formatDuration,
  formatShortDate,
  formatVolume,
  sessionDurationSec,
  sessionVolume,
  WEEKDAY_SHORT,
  type WorkoutTemplate,
} from '@/domain';
import { useActiveWorkoutStore, useAppStore } from '@/store';

import { startEmptyWorkout, startWorkout } from './actions';

function scheduleLabel(t: WorkoutTemplate) {
  if (t.weekdays.length === 0) return 'Unscheduled';
  return [...t.weekdays].sort((a, b) => ((a + 6) % 7) - ((b + 6) % 7)).map((d) => WEEKDAY_SHORT[d]).join(', ');
}

export function WorkoutHomeScreen() {
  const styles = useStyles();
  const { colors } = useTheme();
  const templates = useAppStore((s) => s.templates);
  const sessions = useAppStore((s) => s.sessions);
  const createTemplate = useAppStore((s) => s.createTemplate);
  const active = useActiveWorkoutStore((s) => s.session);
  const list = useMemo(() => templates.filter((t) => !t.archivedAt), [templates]);
  const recent = useMemo(() => completedSessions(sessions).slice(0, 3), [sessions]);

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
        <Card variant="elevated" onPress={() => router.push('/workout/active')} accessibilityHint="Returns to your workout">
          <Text variant="label" color="accent">
            In progress
          </Text>
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

      <SectionHeader title="My workouts" actionLabel={list.length ? 'New' : undefined} onAction={list.length ? newTemplate : undefined} />
      {list.length === 0 ? (
        <Card variant="flat">
          <EmptyState title="No workout yet" message="Create your first workout and start tracking strength." actionLabel="Create workout" onAction={newTemplate} />
        </Card>
      ) : (
        <View style={styles.templates}>
          {list.map((t) => (
            <Card key={t.id} padding="none" style={styles.templateCard}>
              <PressableScale
                onPress={() => router.push({ pathname: '/workout/template/[id]', params: { id: t.id } })}
                pressedScale={1}
                pressedOpacity={0.7}
                style={styles.templateBody}
                accessibilityLabel={`${t.name}, ${t.exercises.length} exercises, ${scheduleLabel(t)}`}
                accessibilityHint="Edit workout"
              >
                <Text variant="bodySemibold" numberOfLines={1}>
                  {t.name}
                </Text>
                <Text variant="caption" color="muted" numberOfLines={1}>
                  {t.exercises.length} exercises · ~{estimateTemplateMinutes(t)} min · {scheduleLabel(t)}
                </Text>
              </PressableScale>
              <IconButton
                icon={Play}
                variant="surface"
                onPress={() => startWorkout(t)}
                disabled={t.exercises.length === 0 || !!active}
                accessibilityLabel={`Start ${t.name}`}
                style={styles.play}
              />
            </Card>
          ))}
        </View>
      )}

      {!active ? <Button label="Start empty workout" variant="ghost" size="md" onPress={startEmptyWorkout} style={styles.empty} /> : null}

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
                <ListRow title={s.name} subtitle={`${s.exercises.length} exercises`} onPress={() => addStarter(s)} trailing={<Plus size={18} color={colors.accentForeground} />} showChevron={false} accessibilityHint="Adds this workout to My workouts" />
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
        <ListRow icon={BookOpen} title="Exercise library" subtitle="Instructions and your history per exercise" onPress={() => router.push('/workout/library')} />
        <Divider inset={60} />
        <ListRow icon={History} title="Workout history" onPress={() => router.push('/workout/history')} />
      </ListGroup>
    </AppScreen>
  );
}

const useStyles = makeStyles((t) => ({
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: t.spacing.md, marginBottom: t.spacing.xs },
  activeTitle: { marginTop: t.spacing.xs },
  activeBar: { marginTop: t.spacing.md },
  activeCta: { marginTop: t.spacing.lg },
  templates: { gap: t.spacing.xs },
  templateCard: { flexDirection: 'row', alignItems: 'center' },
  templateBody: { flex: 1, paddingVertical: t.spacing.md, paddingLeft: t.spacing.md, gap: 3 },
  play: { marginRight: t.spacing.sm },
  empty: { marginTop: t.spacing.xs, alignSelf: 'flex-start' },
  starterHint: { marginBottom: t.spacing.sm, marginTop: -t.spacing.xs },
}));
