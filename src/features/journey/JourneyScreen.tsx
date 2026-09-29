import { router } from 'expo-router';
import { useCallback } from 'react';
import { View } from 'react-native';

import { AppScreen, Card, makeStyles, PressableScale, ProgressRing, SectionHeader, StatCard, Text } from '@/design-system';
import { DEFAULT_SCORING, formatPercent } from '@/domain';
import { useTodayDate } from '@/hooks';

import { JourneyDay } from './components/JourneyDay';
import { useJourneyModel, type CalendarDay } from './useJourneyModel';

export function JourneyScreen() {
  const styles = useStyles();
  const today = useTodayDate();
  const model = useJourneyModel(today);
  const openDay = useCallback((d: CalendarDay) => router.push({ pathname: '/journey/day/[date]', params: { date: d.date } }), []);
  if (!model) return null;
  const { progress, streaks } = model;

  return (
    <AppScreen>
      <View style={styles.header}>
        <Text variant="h1" accessibilityRole="header">
          Your journey
        </Text>
      </View>

      <Card style={styles.hero}>
        <ProgressRing value={progress.fraction} size={104} strokeWidth={8} accessibilityLabel={`Day ${progress.dayNumber} of ${progress.totalDays}`}>
          <Text variant="metricM">{formatPercent(progress.fraction)}</Text>
          <Text variant="caption" color="muted">
            complete
          </Text>
        </ProgressRing>
        <View style={styles.heroBody}>
          <Text variant="label" color="muted">
            Day
          </Text>
          <Text variant="h2" tabular>
            {progress.dayNumber} / {progress.totalDays}
          </Text>
          <Text variant="small" color="secondary">
            {progress.daysRemaining > 0 ? `${progress.daysRemaining} to go. Keep stacking days.` : 'Final day.'}
          </Text>
        </View>
      </Card>

      <View style={styles.stats}>
        <StatCard label="Streak" value={String(streaks.current)} caption={streaks.current === 1 ? 'day' : 'days'} />
        <StatCard label="Longest" value={String(streaks.longest)} caption="days" />
        <StatCard label="This week" value={formatPercent(model.weeklyConsistency)} caption="consistency" />
      </View>

      <SectionHeader title="Calendar" trailing={`${formatPercent(streaks.consistency)} overall`} />
      <View style={styles.calendar}>
        {model.weeks.map((week, w) => (
          <View key={w} style={styles.weekRow}>
            <PressableScale
              onPress={() => router.push({ pathname: '/journey/week/[week]', params: { week: String(w + 1) } })}
              disabled={w + 1 > model.currentWeek}
              style={styles.weekLabel}
              accessibilityLabel={`Week ${w + 1} report`}
              accessibilityState={{ disabled: w + 1 > model.currentWeek }}
            >
              <Text variant="caption" color={w + 1 <= model.currentWeek ? 'secondary' : 'disabled'} tabular>
                W{w + 1}
              </Text>
            </PressableScale>
            {Array.from({ length: 7 }, (_, i) => {
              const day = week[i];
              return day ? <JourneyDay key={day.date} day={day} onPress={openDay} /> : <View key={`pad-${i}`} style={styles.pad} />;
            })}
          </View>
        ))}
      </View>
      <View style={styles.legend}>
        <Legend swatch="completed" label="Completed" />
        <Legend swatch="partial" label="Partial" />
        <Legend swatch="missed" label="Not logged" />
      </View>
      <Text variant="caption" color="muted" style={styles.note}>
        A day counts toward your streak at {formatPercent(DEFAULT_SCORING.thresholds.streak)} or more. It doesn’t need to be perfect.
      </Text>

      <SectionHeader title="Weekly reports" />
      <View style={styles.reports}>
        {Array.from({ length: model.currentWeek }, (_, i) => model.currentWeek - i).map((w) => {
          const week = model.weeks[w - 1] ?? [];
          const scored = week.filter((d) => d.score !== null && d.state !== 'future');
          const avg = scored.length ? scored.reduce((s, d) => s + (d.score ?? 0), 0) / scored.length : 0;
          return (
            <Card key={w} padding="md" onPress={() => router.push({ pathname: '/journey/week/[week]', params: { week: String(w) } })} style={styles.reportRow}>
              <Text variant="bodySemibold" style={styles.flex}>
                Week {w}
                {w === model.currentWeek ? <Text variant="caption" color="muted">  · in progress</Text> : null}
              </Text>
              <Text variant="metricS" color={avg >= 0.85 ? 'accent' : 'primary'}>
                {formatPercent(avg)}
              </Text>
            </Card>
          );
        })}
      </View>
    </AppScreen>
  );
}

function Legend({ swatch, label }: { swatch: 'completed' | 'partial' | 'missed'; label: string }) {
  const styles = useStyles();
  return (
    <View style={styles.legendItem}>
      <View style={[styles.swatch, swatch === 'completed' && styles.swatchDone, swatch === 'partial' && styles.swatchPartial]} />
      <Text variant="caption" color="muted">
        {label}
      </Text>
    </View>
  );
}

const useStyles = makeStyles((t) => ({
  flex: { flex: 1 },
  header: { paddingTop: t.spacing.md, marginBottom: t.spacing.md },
  hero: { flexDirection: 'row', alignItems: 'center', gap: t.spacing.lg },
  heroBody: { flex: 1, gap: t.spacing.xxs },
  stats: { flexDirection: 'row', gap: t.spacing.xs, marginTop: t.spacing.sm },
  calendar: { gap: t.spacing.xs },
  weekRow: { flexDirection: 'row', alignItems: 'center', gap: t.spacing.xs },
  weekLabel: { width: 28, minHeight: 36, justifyContent: 'center' },
  pad: { flex: 1, aspectRatio: 1 },
  legend: { flexDirection: 'row', gap: t.spacing.md, marginTop: t.spacing.md, paddingLeft: 36 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: t.spacing.xs },
  swatch: { width: 12, height: 12, borderRadius: 3, backgroundColor: t.colors.surfaceSecondary, borderWidth: 1, borderColor: t.colors.border },
  swatchDone: { backgroundColor: t.colors.accent, borderColor: t.colors.accent },
  swatchPartial: { backgroundColor: t.colors.accentMuted, borderColor: t.colors.accentSubtle },
  note: { marginTop: t.spacing.sm, paddingLeft: 36 },
  reports: { gap: t.spacing.xs },
  reportRow: { flexDirection: 'row', alignItems: 'center' },
}));
