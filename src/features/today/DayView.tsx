import { router } from 'expo-router';
import { Camera, ChevronRight, Sparkles } from 'lucide-react-native';
import { useMemo, useState } from 'react';
import { View } from 'react-native';

import { ACTIVITY_LABEL } from '@/constants/goals';
import { Card, Checkmark, IconBadge, makeStyles, SectionHeader, Text, useTheme } from '@/design-system';
import {
  activeCheckpoint,
  dateForDay,
  formatDuration,
  formatLiters,
  formatPercent,
  milestonesFor,
  type ScoreItem,
} from '@/domain';
import { useAppStore } from '@/store';

import { logProtein, logWater, setSleep, toggleHabit } from './actions';
import { ConsistencyCard } from './components/ConsistencyCard';
import { HabitRow } from './components/HabitRow';
import { NutritionCard, WaterCard } from './components/NutritionCards';
import { RowGroup } from './components/RowGroup';
import { SimpleRow } from './components/SimpleRow';
import { TodayStatus } from './components/TodayStatus';
import { WorkoutCard } from './components/WorkoutCard';
import { ActivitySheet } from './sheets/ActivitySheet';
import { AmountLogSheet, type LogEntry } from './sheets/AmountLogSheet';
import { HabitSheet } from './sheets/HabitSheet';
import { QuickLogSheet, type QuickLogTarget } from './sheets/QuickLogSheet';
import { SleepSheet } from './sheets/SleepSheet';
import { taskList } from './taskDetail';
import type { DayModel, HabitItem } from './useDayModel';
import { ACTIVITY_VISUAL, KIND_VISUAL } from './visuals';

const timeOf = (iso: string) => new Date(iso).toTimeString().slice(0, 5);

interface DayViewProps {
  model: DayModel;
  quickLogOpen?: boolean;
  onQuickLogClose?: () => void;
}

/** Body of a day: used by Today and by past-day detail in Journey. */
export function DayView({ model, quickLogOpen = false, onQuickLogClose }: DayViewProps) {
  const styles = useStyles();
  const { colors } = useTheme();
  const journey = useAppStore((s) => s.journey);
  const templatesCount = useAppStore((s) => s.templates.filter((t) => !t.archivedAt).length);
  const proteinLogs = useAppStore((s) => s.proteinLogs);
  const waterLogs = useAppStore((s) => s.waterLogs);
  const activityLogs = useAppStore((s) => s.activityLogs);
  const measurements = useAppStore((s) => s.measurements);
  const seenMilestones = useAppStore((s) => s.settings.seenMilestones);
  const removeProteinLog = useAppStore((s) => s.removeProteinLog);
  const removeWaterLog = useAppStore((s) => s.removeWaterLog);
  const addActivity = useAppStore((s) => s.addActivity);
  const removeActivity = useAppStore((s) => s.removeActivity);

  const [sheet, setSheet] = useState<'protein' | 'water' | 'sleep' | 'activity' | null>(null);
  const [habitItem, setHabitItem] = useState<HabitItem | null>(null);
  const date = model.date;

  const proteinEntries: LogEntry[] = useMemo(
    () => proteinLogs.filter((l) => l.date === date).map((l) => ({ id: l.id, label: `${l.grams} g`, time: timeOf(l.loggedAt) })).reverse(),
    [proteinLogs, date],
  );
  const waterEntries: LogEntry[] = useMemo(
    () => waterLogs.filter((l) => l.date === date).map((l) => ({ id: l.id, label: `${l.ml} ml`, time: timeOf(l.loggedAt) })).reverse(),
    [waterLogs, date],
  );
  const activities = useMemo(() => activityLogs.filter((l) => l.date === date), [activityLogs, date]);

  if (!journey) return null;
  const openHabit = habitItem ? (model.habits.find((h) => h.habit.id === habitItem.habit.id) ?? null) : null;

  const day = model.progress.dayNumber;
  const milestone = model.isToday && milestonesFor(journey.durationDays).includes(day) && !seenMilestones.includes(day) ? day : null;
  const checkpoint = model.isToday ? activeCheckpoint(journey.durationDays, day) : null;
  const checkpointDate = checkpoint ? dateForDay(journey, checkpoint) : null;
  const checkpointLogged = checkpointDate ? measurements.some((m) => m.date >= checkpointDate) : true;
  const sleepMet = model.sleepMinutes !== null && model.sleepMinutes >= journey.sleepTargetMin - 15;
  const proteinProgress = journey.proteinTargetG ? model.proteinG / journey.proteinTargetG : 0;
  const waterProgress = journey.waterTargetMl ? model.waterMl / journey.waterTargetMl : 0;

  const tasks = taskList(model, journey);
  // "Next up" skips the workout: its own hero card sits right below.
  const next = tasks.find((t) => !t.item.done && t.item.kind !== 'workout') ?? null;

  const openNext = (item: ScoreItem) => {
    if (item.kind === 'habit') {
      const h = model.habits.find((x) => `habit:${x.habit.id}` === item.key);
      if (h) setHabitItem(h);
    } else if (item.kind === 'protein' || item.kind === 'water' || item.kind === 'sleep') setSheet(item.kind);
    else if (item.kind === 'workout') {
      if (model.activeSession) router.push('/workout/active');
      else if (model.completedSession) router.push({ pathname: '/workout/session/[id]', params: { id: model.completedSession.id } });
    }
  };

  const onQuickLog = (target: QuickLogTarget) => {
    onQuickLogClose?.();
    if (target === 'weight') router.push('/progress/measurement');
    else if (target === 'photo') router.push('/progress/photos');
    else if (target === 'protein') router.push({ pathname: '/nutrition', params: { date } });
    else if (target === 'water') router.push({ pathname: '/water', params: { date } });
    else setSheet(target);
  };

  return (
    <View>
      {milestone ? (
        <Card variant="elevated" style={styles.banner} onPress={() => router.push({ pathname: '/milestone/[day]', params: { day: String(milestone) } })} accessibilityHint="Opens your milestone">
          <IconBadge icon={Sparkles} tone="brand" />
          <View style={styles.bannerBody}>
            <Text variant="label" color="accent">
              Day {milestone}
            </Text>
            <Text variant="bodyMedium">{milestone} days of showing up.</Text>
          </View>
          <ChevronRight size={18} color={colors.textMuted} />
        </Card>
      ) : null}

      <TodayStatus
        score={model.score}
        isToday={model.isToday}
        tasks={tasks}
        next={next}
        onOpenTask={openNext}
        onShare={model.isToday ? () => router.push('/share-today') : undefined}
      />

      <View style={styles.block}>
        <WorkoutCard
          isToday={model.isToday}
          planned={model.planned}
          scheduledToday={model.workoutPlanned}
          active={model.activeSession}
          completed={model.completedSession}
          hasTemplates={templatesCount > 0}
        />
      </View>

      <SectionHeader title="Fuel" />
      <View style={styles.metrics}>
        <NutritionCard
          date={date}
          proteinG={model.proteinG}
          targetG={journey.proteinTargetG}
          calories={model.calories}
          actions={[
            { label: '+10g', onPress: () => logProtein(date, 10), accessibilityLabel: 'Add 10 grams of protein' },
            { label: '+20g', onPress: () => logProtein(date, 20), accessibilityLabel: 'Add 20 grams of protein' },
          ]}
        />
        <WaterCard
          date={date}
          waterMl={model.waterMl}
          targetMl={journey.waterTargetMl}
          actions={[
            { label: '+250', onPress: () => logWater(date, 250), accessibilityLabel: 'Add 250 millilitres of water' },
            { label: '+500', onPress: () => logWater(date, 500), accessibilityLabel: 'Add 500 millilitres of water' },
          ]}
        />
      </View>

      <SectionHeader title="Daily routine" trailing={`${model.habits.filter((h) => h.done).length + (sleepMet ? 1 : 0)}/${model.habits.length + 1}`} />
      <RowGroup>
        <SimpleRow
          title="Sleep"
          visual={KIND_VISUAL.sleep}
          subtitle={model.sleepMinutes === null ? 'Not logged' : `${formatDuration(model.sleepMinutes)} / ${formatDuration(journey.sleepTargetMin)}`}
          subtitleTone={sleepMet ? 'accent' : 'muted'}
          onPress={() => setSheet('sleep')}
          trailing={model.sleepMinutes !== null ? <Checkmark checked={sleepMet} partial /> : undefined}
        />
        {model.habits.map((item) => (
          <HabitRow key={item.habit.id} item={item} onToggle={() => toggleHabit(item.habit, date)} onOpen={() => setHabitItem(item)} />
        ))}
        {journey.activities.length > 0 || activities.length > 0 ? (
          <SimpleRow
            title={activities.length ? activities.map((a) => ACTIVITY_LABEL[a.activity]).join(' · ') : 'Activity'}
            visual={ACTIVITY_VISUAL}
            subtitle={
              activities.length
                ? formatDuration(activities.reduce((s, a) => s + a.minutes, 0))
                : `Log ${journey.activities.map((a) => ACTIVITY_LABEL[a].toLowerCase()).join(', ')}`
            }
            subtitleTone={activities.length ? 'accent' : 'muted'}
            onPress={() => setSheet('activity')}
          />
        ) : null}
      </RowGroup>
      {model.habits.length === 0 ? (
        <Text variant="caption" color="muted" style={styles.hint}>
          Add habits like skincare or reading in Profile → Habits.
        </Text>
      ) : null}

      {checkpoint && !checkpointLogged ? (
        <Card style={styles.checkpoint} onPress={() => router.push('/progress/measurement')} accessibilityHint="Opens measurements">
          <IconBadge icon={Camera} tone="neutral" />
          <View style={styles.bannerBody}>
            <Text variant="label" color="muted">
              Checkpoint · Day {checkpoint}
            </Text>
            <Text variant="bodyMedium">Log measurements and photos.</Text>
          </View>
          <ChevronRight size={18} color={colors.textMuted} />
        </Card>
      ) : null}

      {model.isToday ? (
        <>
          <SectionHeader title="Consistency" trailing={`${formatPercent(model.streaks.consistency)} journey`} />
          <ConsistencyCard current={model.streaks.current} longest={model.streaks.longest} showedUpRate={model.showedUpRate} last7={model.last7} />
        </>
      ) : null}

      <AmountLogSheet
        visible={sheet === 'protein'}
        onClose={() => setSheet(null)}
        title="Protein"
        summary={`${Math.round(model.proteinG)} / ${journey.proteinTargetG} g`}
        progress={proteinProgress}
        unit="g"
        presets={[10, 20, 30, 40]}
        formatPreset={(n) => `+${n}g`}
        onAdd={(n) => logProtein(date, n)}
        entries={proteinEntries}
        onRemove={removeProteinLog}
        maxCustom={300}
      />
      <AmountLogSheet
        visible={sheet === 'water'}
        onClose={() => setSheet(null)}
        title="Water"
        summary={`${formatLiters(model.waterMl)} / ${formatLiters(journey.waterTargetMl)} L · ${formatPercent(waterProgress)}`}
        progress={waterProgress}
        unit="ml"
        presets={[250, 330, 500, 750]}
        formatPreset={(n) => `+${n}`}
        onAdd={(n) => logWater(date, n)}
        entries={waterEntries}
        onRemove={removeWaterLog}
        maxCustom={3000}
      />
      <SleepSheet visible={sheet === 'sleep'} onClose={() => setSheet(null)} initial={model.sleepMinutes} target={journey.sleepTargetMin} onSave={(m) => setSleep(date, m)} />
      <ActivitySheet
        visible={sheet === 'activity'}
        onClose={() => setSheet(null)}
        preferred={journey.activities}
        entries={activities}
        onAdd={(a, m) => addActivity(date, a, m)}
        onRemove={removeActivity}
      />
      <HabitSheet item={openHabit} date={date} onClose={() => setHabitItem(null)} />
      <QuickLogSheet visible={quickLogOpen} onClose={() => onQuickLogClose?.()} onSelect={onQuickLog} />
    </View>
  );
}

const useStyles = makeStyles((t) => ({
  block: { marginTop: t.spacing.md },
  metrics: { flexDirection: 'row', gap: t.spacing.sm },
  banner: { flexDirection: 'row', alignItems: 'center', gap: t.spacing.md, marginBottom: t.spacing.md },
  checkpoint: { flexDirection: 'row', alignItems: 'center', gap: t.spacing.md, marginTop: t.spacing.xl },
  bannerBody: { flex: 1, gap: 2 },
  hint: { marginTop: t.spacing.xs, marginLeft: t.spacing.xxs },
}));
