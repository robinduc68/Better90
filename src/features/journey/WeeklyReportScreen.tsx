import { useLocalSearchParams } from 'expo-router';
import { View } from 'react-native';

import { AppHeader, AppScreen, Card, EmptyState, makeStyles, ProgressBar, SectionHeader, Text } from '@/design-system';
import { formatDuration, formatPercent, formatShortDate, formatSignedPercent, formatVolume, type HitCount } from '@/domain';
import { useTodayDate } from '@/hooks';

import { useWeeklyReport } from './useJourneyModel';

/** Editorial weekly summary. Neutral, encouraging language only. */
export function WeeklyReportScreen() {
  const styles = useStyles();
  const { week } = useLocalSearchParams<{ week: string }>();
  const today = useTodayDate();
  const n = Math.max(1, Number(week) || 1);
  const report = useWeeklyReport(n, today);

  if (!report || report.daysElapsed === 0) {
    return (
      <AppScreen header={<AppHeader title={`Week ${n}`} />}>
        <EmptyState title="Not started yet" message="This week's report fills in as the days happen." />
      </AppScreen>
    );
  }

  const rows: HitCount[] = [report.workouts, report.protein, report.water, ...report.habits];
  const headline =
    report.consistency >= 0.85 ? 'Strong week.' : report.consistency >= 0.6 ? 'Solid week.' : report.daysElapsed < 7 ? 'Week in progress.' : 'Every day counts. Next week is a fresh start.';

  return (
    <AppScreen header={<AppHeader title={`Week ${n}`} subtitle={`${formatShortDate(report.start)} – ${formatShortDate(report.end)}`} />}>
      <View style={styles.hero}>
        <Text variant="label" color="muted">
          Week {report.week}
          {!report.isComplete ? ' · in progress' : ''}
        </Text>
        <Text variant="hero" color="accent" style={styles.pct}>
          {formatPercent(report.consistency)}
        </Text>
        <Text variant="label" color="secondary">
          Consistency
        </Text>
        <Text variant="h3" style={styles.headline}>
          {headline}
        </Text>
        <Text variant="bodyMedium" color="secondary" tabular>
          {report.coreDone} / {report.coreTotal} core tasks completed
        </Text>
      </View>

      <SectionHeader title="Breakdown" />
      <Card>
        {rows.map((r, i) => (
          <View key={r.key} style={[styles.row, i > 0 && styles.rowBorder]} accessible accessibilityLabel={`${r.label}: ${r.hit} of ${r.of}`}>
            <View style={styles.rowHead}>
              <Text variant="bodyMedium" style={styles.flex} numberOfLines={1}>
                {r.label}
              </Text>
              <Text variant="metricS" tabular>
                {r.hit} / {r.of}
              </Text>
            </View>
            <ProgressBar value={r.of ? r.hit / r.of : 0} height={2} />
          </View>
        ))}
        <View style={[styles.row, styles.rowBorder]}>
          <View style={styles.rowHead}>
            <Text variant="bodyMedium" style={styles.flex}>
              Average sleep
            </Text>
            <Text variant="metricS">{formatDuration(report.averageSleepMin !== null ? Math.round(report.averageSleepMin) : null)}</Text>
          </View>
        </View>
      </Card>

      <View style={styles.highlights}>
        {report.strongest ? (
          <Card variant="flat" style={styles.highlight}>
            <Text variant="label" color="muted">
              Strongest
            </Text>
            <Text variant="h3" numberOfLines={2}>
              {report.strongest.label}
            </Text>
          </Card>
        ) : null}
        {report.focus ? (
          <Card variant="flat" style={styles.highlight}>
            <Text variant="label" color="muted">
              Focus next week
            </Text>
            <Text variant="h3" numberOfLines={2}>
              {report.focus.label}
            </Text>
          </Card>
        ) : null}
      </View>

      <SectionHeader title="Training" />
      <Card>
        <View style={styles.rowHead}>
          <Text variant="bodyMedium" style={styles.flex}>
            Volume
          </Text>
          <Text variant="metricS">{formatVolume(report.volume)}</Text>
        </View>
        {report.volumeDeltaPct !== null ? (
          <Text variant="small" color={report.volumeDeltaPct > 0 ? 'accent' : 'secondary'} tabular style={styles.sub}>
            {formatSignedPercent(report.volumeDeltaPct)} vs previous week
          </Text>
        ) : null}
        {report.prCount > 0 ? (
          <Text variant="small" color="secondary" style={styles.sub}>
            {report.prCount} personal {report.prCount === 1 ? 'record' : 'records'} this week
          </Text>
        ) : null}
      </Card>
    </AppScreen>
  );
}

const useStyles = makeStyles((t) => ({
  flex: { flex: 1 },
  hero: { paddingTop: t.spacing.lg, gap: t.spacing.xxs },
  pct: { marginTop: t.spacing.xs },
  headline: { marginTop: t.spacing.lg },
  row: { paddingVertical: t.spacing.sm, gap: t.spacing.xs },
  rowBorder: { borderTopWidth: 1, borderTopColor: t.colors.border },
  rowHead: { flexDirection: 'row', alignItems: 'center', gap: t.spacing.sm },
  highlights: { flexDirection: 'row', gap: t.spacing.sm, marginTop: t.spacing.md },
  highlight: { flex: 1, gap: t.spacing.xs },
  sub: { marginTop: t.spacing.xs },
}));
