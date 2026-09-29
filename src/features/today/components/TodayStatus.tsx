import { Check, ChevronDown, ChevronRight, Ellipsis, Share2 } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { View } from 'react-native';
import Animated, { FadeIn, FadeOut, LinearTransition, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';

import { AnimatedNumber, BottomSheet, Card, IconBadge, IconButton, ListRow, makeStyles, PressableScale, SegmentedProgress, Text, useReducedMotion, useTheme } from '@/design-system';
import { formatPercent, type DayScore, type ScoreItem } from '@/domain';

import type { TaskView } from '../taskDetail';

interface TodayStatusProps {
  score: DayScore;
  isToday: boolean;
  tasks: TaskView[];
  next: TaskView | null;
  onOpenTask: (item: ScoreItem) => void;
  onShare?: () => void;
}

const DURATION = 250;

/**
 * Today's completion. Collapsed: count, segments and "Next up".
 * Expanded: every task, completed first — designed to screenshot well
 * together with the journey header above it.
 */
export function TodayStatus({ score, isToday, tasks, next, onOpenTask, onShare }: TodayStatusProps) {
  const styles = useStyles();
  const { colors } = useTheme();
  const reduceMotion = useReducedMotion();
  const [expanded, setExpanded] = useState(false);
  const [hideDone, setHideDone] = useState(false);
  const [menu, setMenu] = useState(false);
  const allDone = score.totalCount > 0 && score.doneCount === score.totalCount;

  const rotation = useSharedValue(0);
  useEffect(() => {
    rotation.value = reduceMotion ? (expanded ? 1 : 0) : withTiming(expanded ? 1 : 0, { duration: DURATION });
  }, [expanded, rotation, reduceMotion]);
  const chevronStyle = useAnimatedStyle(() => ({ transform: [{ rotate: `${rotation.value * 180}deg` }] }));

  const layout = reduceMotion ? undefined : LinearTransition.duration(DURATION);
  const enter = reduceMotion ? undefined : FadeIn.duration(200);
  const exit = reduceMotion ? undefined : FadeOut.duration(150);
  const shown = hideDone ? tasks.filter((t) => !t.item.done) : tasks;
  const doneCount = tasks.filter((t) => t.item.done).length;

  return (
    <Animated.View layout={layout}>
      <Card variant="elevated" padding="md">
        <View style={styles.header}>
          <PressableScale
            onPress={() => setExpanded((e) => !e)}
            pressedScale={1}
            pressedOpacity={0.8}
            style={styles.toggle}
            accessibilityRole="button"
            accessibilityState={{ expanded }}
            accessibilityLabel={`${isToday ? 'Today' : 'This day'}: ${score.doneCount} of ${score.totalCount} completed, ${formatPercent(score.score)}`}
            accessibilityHint={expanded ? 'Collapses the task list' : 'Shows all tasks'}
          >
            <View style={styles.flex}>
              <View style={styles.labelRow}>
                <Text variant="label" color="muted">
                  {isToday ? 'Today' : 'This day'}
                </Text>
                <Animated.View style={chevronStyle}>
                  <ChevronDown size={16} color={colors.textMuted} />
                </Animated.View>
              </View>
              <Text variant="h3" tabular style={styles.count}>
                {score.doneCount} / {score.totalCount} completed
              </Text>
            </View>
            <AnimatedNumber value={Math.round(score.score * 100)} format={(v) => `${Math.round(v)}%`} variant="metricL" color={allDone ? 'accent' : 'primary'} />
          </PressableScale>
          {onShare ? <IconButton icon={Ellipsis} onPress={() => setMenu(true)} accessibilityLabel="Today options" style={styles.more} /> : null}
        </View>

        <PressableScale onPress={() => setExpanded((e) => !e)} pressedScale={1} pressedOpacity={0.8} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
          <SegmentedProgress
            segments={score.items.map((i) => (i.done ? 1 : i.progress))}
            style={styles.segments}
            accessibilityLabel={`${score.doneCount} of ${score.totalCount} goals complete, ${formatPercent(score.score)}`}
          />
        </PressableScale>

        {expanded ? (
          <Animated.View entering={enter} exiting={exit} layout={layout} style={styles.tasks}>
            <View style={styles.tasksHead}>
              <Text variant="label" color="muted">
                Today’s tasks
              </Text>
              {doneCount > 0 ? (
                <PressableScale onPress={() => setHideDone((h) => !h)} hitSlop={8} style={styles.hideBtn} accessibilityRole="button" accessibilityLabel={hideDone ? `Show completed, ${doneCount}` : 'Hide completed'}>
                  <Text variant="smallMedium" color="accent">
                    {hideDone ? `Show completed (${doneCount})` : 'Hide completed'}
                  </Text>
                </PressableScale>
              ) : null}
            </View>
            {shown.map((t) => (
              <Animated.View key={t.item.key} entering={enter} exiting={exit} layout={layout}>
                <TaskRow task={t} onPress={() => onOpenTask(t.item)} />
              </Animated.View>
            ))}
            {shown.length === 0 ? (
              <Text variant="small" color="accent" style={styles.allDone}>
                Everything done today. Strong day.
              </Text>
            ) : null}
          </Animated.View>
        ) : allDone ? (
          <Text variant="small" color="accent" style={styles.done}>
            Everything done. Strong day.
          </Text>
        ) : next ? (
          <Animated.View entering={enter} exiting={exit}>
            <PressableScale onPress={() => onOpenTask(next.item)} style={styles.next} pressedScale={1} pressedOpacity={0.7} accessibilityLabel={`Next up: ${next.item.label}, ${next.detail}`}>
              <IconBadge icon={next.visual.icon} tone={next.visual.tone} size="sm" />
              <View style={styles.flex}>
                <Text variant="caption" color="muted">
                  Next up
                </Text>
                <Text variant="bodyMedium" numberOfLines={1}>
                  {next.item.label}
                </Text>
              </View>
              <Text variant="caption" color="secondary" tabular>
                {next.detail}
              </Text>
              <ChevronRight size={18} color={colors.textMuted} />
            </PressableScale>
          </Animated.View>
        ) : null}
      </Card>

      {onShare ? (
        <BottomSheet visible={menu} onClose={() => setMenu(false)} title="Today">
          <ListRow
            icon={Share2}
            title="Share today’s progress"
            subtitle="Preview a 9:16 card first — nothing is shared yet"
            onPress={() => {
              setMenu(false);
              onShare();
            }}
          />
        </BottomSheet>
      ) : null}
    </Animated.View>
  );
}

function TaskRow({ task, onPress }: { task: TaskView; onPress: () => void }) {
  const styles = useStyles();
  const { colors } = useTheme();
  const done = task.item.done;
  return (
    <PressableScale
      onPress={onPress}
      pressedScale={1}
      pressedOpacity={0.7}
      style={[styles.task, done && styles.taskDone]}
      accessibilityLabel={`${task.item.label}${task.detail ? `, ${task.detail}` : ''}, ${done ? 'done' : 'not done'}`}
    >
      <View style={[styles.mark, done ? styles.markDone : styles.markOpen]}>{done ? <Check size={13} color={colors.onAccent} strokeWidth={3} /> : null}</View>
      <IconBadge icon={task.visual.icon} tone={task.visual.tone} size="sm" bare />
      <Text variant="bodyMedium" color={done ? 'secondary' : 'primary'} numberOfLines={1} style={styles.flex}>
        {task.item.label}
      </Text>
      {task.detail ? (
        <Text variant="caption" color={done ? 'muted' : 'secondary'} tabular numberOfLines={1} style={styles.detail}>
          {task.detail}
        </Text>
      ) : null}
    </PressableScale>
  );
}

const useStyles = makeStyles((t) => ({
  flex: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'flex-start' },
  toggle: { flex: 1, flexDirection: 'row', alignItems: 'flex-end' },
  labelRow: { flexDirection: 'row', alignItems: 'center', gap: t.spacing.xxs },
  count: { marginTop: 2 },
  more: { marginTop: -t.spacing.xs, marginRight: -t.spacing.xs, marginLeft: t.spacing.xxs },
  segments: { marginTop: t.spacing.md },
  done: { marginTop: t.spacing.md },
  next: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: t.spacing.sm,
    marginTop: t.spacing.md,
    paddingTop: t.spacing.sm,
    borderTopWidth: 1,
    borderTopColor: t.colors.border,
    minHeight: 48,
  },
  tasks: { marginTop: t.spacing.md, gap: t.spacing.xxs },
  tasksHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', minHeight: 32, marginBottom: t.spacing.xxs },
  hideBtn: { minHeight: 32, justifyContent: 'center' },
  task: { flexDirection: 'row', alignItems: 'center', gap: t.spacing.sm, minHeight: 44, paddingHorizontal: t.spacing.xs, borderRadius: t.radius.md },
  taskDone: { backgroundColor: t.colors.accentMuted },
  mark: { width: 22, height: 22, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  markDone: { backgroundColor: t.colors.accent },
  markOpen: { borderWidth: 1.5, borderColor: t.colors.borderStrong },
  detail: { maxWidth: '40%' },
  allDone: { paddingVertical: t.spacing.xs },
}));
