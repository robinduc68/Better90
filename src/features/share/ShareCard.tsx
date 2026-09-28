import { forwardRef } from 'react';
import { StyleSheet, View } from 'react-native';

import { brandColors, fontFamily, Text } from '@/design-system';
import { formatPercent } from '@/domain';
import { PrivatePhoto } from '@/features/progress/components/PrivatePhoto';

import type { ShareStats } from './useShareStats';

export interface ShareOptions {
  journeyDay: boolean;
  consistency: boolean;
  workouts: boolean;
  strength: boolean;
  weight: boolean;
  waist: boolean;
  photo: boolean;
}

/** Private values are opt-in: weight, measurements and photos default to off. */
export const DEFAULT_SHARE_OPTIONS: ShareOptions = {
  journeyDay: true,
  consistency: true,
  workouts: true,
  strength: true,
  weight: false,
  waist: false,
  photo: false,
};

const BASE = 360;

function signed(v: number, unit: string) {
  return `${v > 0 ? '+' : v < 0 ? '−' : '±'}${Math.abs(v)} ${unit}`;
}

/**
 * Designed 9:16 social asset — not a dashboard screenshot. Always dark,
 * brand palette, large type, few metrics. Rendered at `width` and captured
 * at 1080×1920.
 */
export const ShareCard = forwardRef<View, { stats: ShareStats; options: ShareOptions; width: number }>(function ShareCard({ stats, options, width }, ref) {
  const k = width / BASE;
  const px = (n: number) => Math.round(n * k * 10) / 10;
  const type = (size: number, weight: keyof typeof fontFamily, extra: object = {}) => ({
    fontFamily: fontFamily[weight],
    fontSize: px(size),
    lineHeight: px(size * 1.12),
    ...extra,
  });

  const metrics: { value: string; label: string }[] = [];
  if (options.workouts) metrics.push({ value: String(stats.workouts), label: stats.workouts === 1 ? 'Workout' : 'Workouts' });
  if (options.consistency) metrics.push({ value: formatPercent(stats.consistency), label: 'Consistency' });
  if (options.weight && stats.weightDeltaKg !== null) metrics.push({ value: signed(stats.weightDeltaKg, 'kg'), label: 'Body weight' });
  if (options.waist && stats.waistDeltaCm !== null) metrics.push({ value: signed(stats.waistDeltaCm, 'cm'), label: 'Waist' });
  const showPhoto = options.photo && stats.latestPhoto;
  const statement = stats.dayNumber >= stats.totalDays ? `${stats.totalDays} days\ncompleted.` : `${stats.dayNumber} ${stats.dayNumber === 1 ? 'day' : 'days'}\nof showing up.`;

  return (
    <View ref={ref} collapsable={false} style={[styles.card, { width, height: (width * 16) / 9, padding: px(28) }]}>
      <View style={styles.row}>
        <Text style={type(15, 'extrabold', { color: brandColors.paper, letterSpacing: px(2.4) })}>
          LEVEL<Text style={type(15, 'extrabold', { color: brandColors.lime, letterSpacing: px(0.6) })}>90</Text>
        </Text>
        {options.journeyDay ? (
          <Text style={type(11, 'semibold', { color: brandColors.paperMuted, letterSpacing: px(1.4) })}>
            {stats.totalDays}-DAY JOURNEY
          </Text>
        ) : null}
      </View>

      <View style={{ marginTop: px(showPhoto ? 22 : 56) }}>
        {options.journeyDay ? (
          <>
            <Text style={type(13, 'semibold', { color: brandColors.paperMuted, letterSpacing: px(2) })}>DAY</Text>
            <View style={[styles.row, styles.baseline]}>
              <Text style={type(96, 'extrabold', { color: brandColors.paper, letterSpacing: px(-4), lineHeight: px(100) })}>{stats.dayNumber}</Text>
              <Text style={type(28, 'bold', { color: brandColors.paperFaint, marginLeft: px(6) })}>/ {stats.totalDays}</Text>
            </View>
            <View style={[styles.track, { height: px(5), borderRadius: px(3), marginTop: px(10) }]}>
              <View style={{ width: `${Math.round(stats.fraction * 100)}%`, height: '100%', borderRadius: px(3), backgroundColor: brandColors.lime }} />
            </View>
          </>
        ) : null}
        <Text style={type(34, 'extrabold', { color: brandColors.paper, textTransform: 'uppercase', letterSpacing: px(-0.8), marginTop: px(22), lineHeight: px(38) })}>
          {statement}
        </Text>
      </View>

      {showPhoto && stats.latestPhoto ? (
        <PrivatePhoto photo={stats.latestPhoto} style={{ flex: 1, marginTop: px(18), borderRadius: px(18) }} />
      ) : (
        <View style={styles.flex} />
      )}

      {metrics.length > 0 ? (
        <View style={[styles.metrics, { marginTop: px(20), rowGap: px(18) }]}>
          {metrics.slice(0, 4).map((m) => (
            <View key={m.label} style={styles.metric}>
              <Text style={type(38, 'extrabold', { color: brandColors.paper, letterSpacing: px(-1.2) })} numberOfLines={1} adjustsFontSizeToFit>
                {m.value}
              </Text>
              <Text style={type(10.5, 'semibold', { color: brandColors.paperMuted, letterSpacing: px(1.6), textTransform: 'uppercase', marginTop: px(2) })}>{m.label}</Text>
            </View>
          ))}
        </View>
      ) : null}

      {options.strength && stats.bestLift ? (
        <View style={[styles.lift, { marginTop: px(18), paddingTop: px(16), borderTopWidth: StyleSheet.hairlineWidth }]}>
          <Text style={type(30, 'extrabold', { color: brandColors.lime, letterSpacing: px(-0.8) })}>+{Math.round(stats.bestLift.deltaKg * 10) / 10} KG</Text>
          <Text style={type(10.5, 'semibold', { color: brandColors.paperMuted, letterSpacing: px(1.6), textTransform: 'uppercase', marginTop: px(2) })}>{stats.bestLift.name}</Text>
        </View>
      ) : null}

      <View style={[styles.row, { marginTop: px(24) }]}>
        <Text style={type(13, 'bold', { color: brandColors.paper, letterSpacing: px(1.6) })}>KEEP GOING.</Text>
        <Text style={type(11, 'semibold', { color: brandColors.paperFaint, letterSpacing: px(1) })}>@LEVEL90</Text>
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  card: { backgroundColor: brandColors.ink, overflow: 'hidden' },
  flex: { flex: 1 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  baseline: { alignItems: 'baseline', justifyContent: 'flex-start' },
  track: { backgroundColor: brandColors.limeTrack, overflow: 'hidden' },
  metrics: { flexDirection: 'row', flexWrap: 'wrap' },
  metric: { width: '50%', paddingRight: 8 },
  lift: { borderTopColor: 'rgba(255,255,255,0.14)' },
});
