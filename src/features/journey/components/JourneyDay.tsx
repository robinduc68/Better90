import { Check } from 'lucide-react-native';
import { memo } from 'react';
import { View } from 'react-native';

import { makeStyles, PressableScale, Text, useTheme } from '@/design-system';
import { formatPercent } from '@/domain';

import type { CalendarDay } from '../useJourneyModel';

const STATE_LABEL = {
  completed: 'completed',
  partial: 'partly done',
  missed: 'not logged',
  today: 'today',
  future: 'upcoming',
  outside: '',
} as const;

/**
 * Day cell. State is conveyed by shape + glyph + text, not color alone.
 * Missed days are neutral — never red.
 */
export const JourneyDay = memo(function JourneyDay({ day, onPress }: { day: CalendarDay; onPress: (day: CalendarDay) => void }) {
  const styles = useStyles();
  const { colors } = useTheme();
  const tappable = day.state !== 'future' && day.state !== 'outside';
  const pct = day.score !== null ? formatPercent(day.score) : null;
  return (
    <PressableScale
      disabled={!tappable}
      onPress={() => onPress(day)}
      style={[
        styles.cell,
        day.state === 'completed' && styles.completed,
        day.state === 'partial' && styles.partial,
        day.state === 'missed' && styles.missed,
        day.state === 'today' && styles.today,
        day.state === 'future' && styles.future,
      ]}
      accessibilityLabel={`Day ${day.dayNumber}, ${STATE_LABEL[day.state]}${pct && day.state !== 'future' ? `, ${pct}` : ''}`}
      accessibilityState={{ disabled: !tappable }}
    >
      {day.state === 'completed' ? (
        <Check size={16} color={colors.onAccent} strokeWidth={3} />
      ) : (
        <Text variant="caption" color={day.state === 'future' ? 'disabled' : day.state === 'missed' ? 'muted' : 'primary'} tabular>
          {day.dayNumber}
        </Text>
      )}
      {(day.state === 'partial' || day.state === 'today') && day.score !== null && day.score > 0 ? (
        <View style={styles.meter}>
          <View style={[styles.meterFill, { width: `${Math.round(day.score * 100)}%` }]} />
        </View>
      ) : null}
    </PressableScale>
  );
});

const useStyles = makeStyles((t) => ({
  cell: {
    flex: 1,
    aspectRatio: 1,
    borderRadius: t.radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: t.colors.surfaceSecondary,
  },
  completed: { backgroundColor: t.colors.accent },
  partial: { backgroundColor: t.colors.accentMuted, borderWidth: 1, borderColor: t.colors.accentSubtle },
  missed: { backgroundColor: t.colors.surfaceSecondary },
  today: { backgroundColor: t.colors.surface, borderWidth: 2, borderColor: t.colors.accent },
  future: { backgroundColor: 'transparent', borderWidth: 1, borderColor: t.colors.border },
  meter: { position: 'absolute', left: 6, right: 6, bottom: 5, height: 3, borderRadius: 2, backgroundColor: t.colors.track, overflow: 'hidden' },
  meterFill: { height: 3, borderRadius: 2, backgroundColor: t.colors.accent },
}));
