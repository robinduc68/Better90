import { router } from 'expo-router';
import { Camera, ChevronRight, Sparkles } from 'lucide-react-native';
import { useMemo, useState } from 'react';
import { View } from 'react-native';

import { ACTIVITY_LABEL } from '@/constants/goals';
import { Card, Checkmark, makeStyles, SectionHeader, StatCard, Text, useTheme } from '@/design-system';
import {
  activeCheckpoint,
  dateForDay,
  formatDuration,
  formatLiters,
  formatPercent,
  milestonesFor,
  type ISODate,
} from '@/domain';
import { useAppStore } from '@/store';

import { logProtein, logWater, setSleep, toggleHabit } from './actions';
import { DailySummary } from './components/DailySummary';
import { HabitRow } from './components/HabitRow';
import { MetricCard } from './components/MetricCard';
import { RowGroup } from './components/RowGroup';
import { SimpleRow } from './components/SimpleRow';
import { WorkoutCard } from './components/WorkoutCard';
import { ActivitySheet } from './sheets/ActivitySheet';
import { HabitSheet } from './sheets/HabitSheet';
import { QuickLogSheet, type LogEntry } from './sheets/QuickLogSheet';
import { SleepSheet } from './sheets/SleepSheet';
import type { DayModel, HabitItem } from './useDayModel';

const timeOf = (iso: string) => new Date(iso).toTimeString().slice(0, 5);

/** Body of a day: used by Today and by past-day detail in Journey. */
export function DayView({ model }: { model: DayModel }) {
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

  return (
    <View>
      {milestone ? (
        <Card variant="elevated" style={styles.banner} onPress={() => router.push({ pathname: '/milestone/[day]', params: { day: String(milestone) } })} accessibilityHint="Opens your milestone">
          <Sparkles size={18} color={colors.accentForeground} />
          <View style={styles.bannerBody}>
            <Text variant="label" color="accent">
              Day {milestone}
            </Text>
            <Text variant="bodyMedium">{milestone} days of showing up.</Text>
          </View>
          <ChevronRight size={18} color={colors.textMuted} />
        </Card>
      ) : null}

      <DailySummary score={model.score} nextLabel={model.nextLabel} isToday={model.isToday} streak={model.isToday ? model.streaks.current : 0} />

      <SectionHeader title={model.isToday ? "Today's workout" : 'Workout'} />
      <WorkoutCard
        isToday={model.isToday}
        planned={model.planned}
        scheduledToday={model.workoutPlanned}
        active={model.activeSession}
        completed={model.completedSession}
        hasTemplates={templatesCount > 0}
      />

      <SectionHeader title="Nutrition" />
      <View style={styles.metrics}>
        <MetricCard
          label="Protein"
          value={String(Math.round(model.proteinG))}
          unit="g"
          target={`${journey.proteinTargetG}g`}
          progress={journey.proteinTargetG ? model.proteinG / journey.proteinTargetG : 0}
          onPress={() => setSheet('protein')}
          accessibilityHint="Opens protein log"
          actions={[
            { label: '+10g', onPress: () => logProtein(date, 10), accessibilityLabel: 'Add 10 grams of protein' },
            { label: '+20g', onPress: () => logProtein(date, 20), accessibilityLabel: 'Add 20 grams of protein' },
          ]}
        />
        <MetricCard
          label="Water"
          value={formatLiters(model.waterMl)}
          unit="L"
          target={`${formatLiters(journey.waterTargetMl)}L`}
          progress={journey.waterTargetMl ? model.waterMl / journey.waterTargetMl : 0}
          onPress={() => setSheet('water')}
          accessibilityHint="Opens water log"
          actions={[
            { label: '+250', onPress: () => logWater(date, 250), accessibilityLabel: 'Add 250 millilitres of water' },
            { label: '+500', onPress: () => logWater(date, 500), accessibilityLabel: 'Add 500 millilitres of water' },
          ]}
        />
      </View>

      <SectionHeader title="Daily habits" trailing={model.habits.length ? `${model.habits.filter((h) => h.done).length}/${model.habits.length}` : undefined} />
      <RowGroup>
        <SimpleRow
          title="Sleep"
          subtitle={model.sleepMinutes === null ? 'Not logged' : `${formatDuration(model.sleepMinutes)} / ${formatDuration(journey.sleepTargetMin)}`}
          subtitleTone={sleepMet ? 'accent' : 'muted'}
          onPress={() => setSheet('sleep')}
          trailing={model.sleepMinutes !== null ? <Checkmark checked={sleepMet} partial /> : undefined}
        />
        {model.habits.map((item) => (
          <HabitRow key={item.habit.id} item={item} onToggle={() => toggleHabit(item.habit, date)} onOpen={() => setHabitItem(item)} />
        ))}
      </RowGroup>
      {model.habits.length === 0 ? (
        <Text variant="caption" color="muted" style={styles.hint}>
          Add habits like skincare or reading in Profile → Habits.
        </Text>
      ) : null}

      {journey.activities.length > 0 || activities.length > 0 ? (
        <>
          <SectionHeader title="Activity" />
          <RowGroup>
            <SimpleRow
              title={activities.length ? activities.map((a) => ACTIVITY_LABEL[a.activity]).join(' · ') : 'Log an activity'}
              subtitle={
                activities.length
                  ? formatDuration(activities.reduce((s, a) => s + a.minutes, 0))
                  : journey.activities.map((a) => ACTIVITY_LABEL[a]).join(', ')
              }
              subtitleTone={activities.length ? 'accent' : 'muted'}
              onPress={() => setSheet('activity')}
            />
          </RowGroup>
        </>
      ) : null}

      {checkpoint && !checkpointLogged ? (
        <Card style={styles.checkpoint} onPress={() => router.push('/progress/measurement')} accessibilityHint="Opens measurements">
          <Camera size={18} color={colors.textSecondary} />
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
          <SectionHeader title="Consistency" />
          <View style={styles.metrics}>
            <StatCard label="Current streak" value={`${model.streaks.current} ${model.streaks.current === 1 ? 'day' : 'days'}`} caption={`Best ${model.streaks.longest}`} />
            <StatCard label="Journey" value={formatPercent(model.streaks.consistency)} caption={`${model.streaks.showedUpDays} days showed up`} />
          </View>
        </>
      ) : null}

      <QuickLogSheet
        visible={sheet === 'protein'}
        onClose={() => setSheet(null)}
        title="Protein"
        summary={`${Math.round(model.proteinG)} / ${journey.proteinTargetG} g`}
        progress={journey.proteinTargetG ? model.proteinG / journey.proteinTargetG : 0}
        unit="g"
        presets={[10, 20, 30, 40]}
        formatPreset={(n) => `+${n}g`}
        onAdd={(n) => logProtein(date, n)}
        entries={proteinEntries}
        onRemove={removeProteinLog}
        maxCustom={300}
      />
      <QuickLogSheet
        visible={sheet === 'water'}
        onClose={() => setSheet(null)}
        title="Water"
        summary={`${formatLiters(model.waterMl)} / ${formatLiters(journey.waterTargetMl)} L · ${formatPercent(journey.waterTargetMl ? model.waterMl / journey.waterTargetMl : 0)}`}
        progress={journey.waterTargetMl ? model.waterMl / journey.waterTargetMl : 0}
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
    </View>
  );
}

const useStyles = makeStyles((t) => ({
  metrics: { flexDirection: 'row', gap: t.spacing.sm },
  banner: { flexDirection: 'row', alignItems: 'center', gap: t.spacing.md, marginBottom: t.spacing.md },
  checkpoint: { flexDirection: 'row', alignItems: 'center', gap: t.spacing.md, marginTop: t.spacing.xl },
  bannerBody: { flex: 1, gap: 2 },
  hint: { marginTop: t.spacing.xs, marginLeft: t.spacing.xxs },
}));
