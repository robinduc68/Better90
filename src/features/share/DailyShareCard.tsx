import { forwardRef } from 'react';
import { StyleSheet, View } from 'react-native';

import { brandColors, fontFamily, Text } from '@/design-system';
import { formatPercent } from '@/domain';
import type { TaskView } from '@/features/today/taskDetail';

export interface DailyShareOptions {
  showRemaining: boolean;
  showAmounts: boolean;
}

const BASE = 360;
const MAX_ROWS = 6;

/** 9:16 "what I did today" card. Always dark, brand palette, no private data unless opted in. */
export const DailyShareCard = forwardRef<View, { dayNumber: number; totalDays: number; score: number; tasks: TaskView[]; options: DailyShareOptions; width: number }>(
  function DailyShareCard({ dayNumber, totalDays, score, tasks, options, width }, ref) {
    const k = width / BASE;
    const px = (n: number) => Math.round(n * k * 10) / 10;
    const type = (size: number, weight: keyof typeof fontFamily, extra: object = {}) => ({ fontFamily: fontFamily[weight], fontSize: px(size), lineHeight: px(size * 1.15), ...extra });
    const done = tasks.filter((t) => t.item.done);
    const all = [...done, ...(options.showRemaining ? tasks.filter((t) => !t.item.done) : [])];
    const rows = all.slice(0, MAX_ROWS);
    const more = all.length - rows.length;

    return (
      <View ref={ref} collapsable={false} style={[styles.card, { width, height: (width * 16) / 9, padding: px(28) }]}>
        <View style={styles.row}>
          <Text style={type(15, 'extrabold', { color: brandColors.paper, letterSpacing: px(2.4) })}>
            LEVEL<Text style={type(15, 'extrabold', { color: brandColors.lime, letterSpacing: px(0.6) })}>90</Text>
          </Text>
          <Text style={type(12, 'bold', { color: brandColors.paperMuted, letterSpacing: px(1.4) })}>
            DAY {dayNumber} / {totalDays}
          </Text>
        </View>

        <View style={{ marginTop: px(44) }}>
          <Text style={type(84, 'extrabold', { color: brandColors.lime, letterSpacing: px(-3), lineHeight: px(88) })}>{formatPercent(score)}</Text>
          <Text style={type(14, 'bold', { color: brandColors.paper, letterSpacing: px(2), marginTop: px(4) })}>TODAY COMPLETE</Text>
          <View style={[styles.track, { height: px(5), borderRadius: px(3), marginTop: px(14) }]}>
            <View style={{ width: `${Math.round(Math.min(1, dayNumber / totalDays) * 100)}%`, height: '100%', borderRadius: px(3), backgroundColor: brandColors.paperFaint }} />
          </View>
        </View>

        <View style={{ marginTop: px(30), gap: px(10) }}>
          {rows.map((t) => {
            const isDone = t.item.done;
            return (
              <View key={t.item.key} style={[styles.row, { gap: px(10) }]}>
                <View style={[styles.mark, { width: px(20), height: px(20), borderRadius: px(10) }, isDone ? styles.markDone : { borderWidth: px(1.5), borderColor: brandColors.paperFaint }]}>
                  {isDone ? <Text style={type(11, 'extrabold', { color: brandColors.ink, lineHeight: px(13) })}>✓</Text> : null}
                </View>
                <Text style={type(16, isDone ? 'semibold' : 'medium', { color: isDone ? brandColors.paper : brandColors.paperMuted, flex: 1 })} numberOfLines={1}>
                  {t.item.label}
                </Text>
                {options.showAmounts && t.detail ? (
                  <Text style={type(12.5, 'medium', { color: brandColors.paperFaint })} numberOfLines={1}>
                    {t.detail}
                  </Text>
                ) : null}
              </View>
            );
          })}
          {more > 0 ? <Text style={type(12.5, 'medium', { color: brandColors.paperFaint, marginLeft: px(30) })}>+{more} more</Text> : null}
        </View>

        <View style={[styles.flex, { minHeight: px(20) }]} />
        <Text style={type(26, 'extrabold', { color: brandColors.paper, letterSpacing: px(-0.6), lineHeight: px(30) })}>
          {dayNumber} {dayNumber === 1 ? 'DAY' : 'DAYS'} INTO{'\n'}MY {totalDays}-DAY JOURNEY
        </Text>
        <View style={[styles.row, { marginTop: px(18) }]}>
          <Text style={type(13, 'bold', { color: brandColors.lime, letterSpacing: px(1.6) })}>KEEP GOING.</Text>
          <Text style={type(11, 'semibold', { color: brandColors.paperFaint, letterSpacing: px(1) })}>@LEVEL90</Text>
        </View>
      </View>
    );
  },
);

const styles = StyleSheet.create({
  card: { backgroundColor: brandColors.ink, overflow: 'hidden' },
  flex: { flex: 1 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  track: { backgroundColor: brandColors.limeTrack, overflow: 'hidden' },
  mark: { alignItems: 'center', justifyContent: 'center' },
  markDone: { backgroundColor: brandColors.lime },
});
