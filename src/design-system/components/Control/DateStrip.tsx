import { memo } from 'react';
import { View } from 'react-native';

import { makeStyles } from '../../theme';
import { Text } from '../Text';
import { PressableScale } from './PressableScale';

export interface DateStripDay {
  key: string;
  weekday: string;
  day: string;
  disabled?: boolean;
  /** Small indicator under the date (e.g. target reached). */
  marked?: boolean;
}

interface DateStripProps {
  days: DateStripDay[];
  selected: string;
  onSelect: (key: string) => void;
  tone?: 'accent' | 'water';
}

/** Compact week selector: Mon 21 … Sun 27. */
export const DateStrip = memo(function DateStrip({ days, selected, onSelect, tone = 'accent' }: DateStripProps) {
  const styles = useStyles();
  return (
    <View style={styles.row} accessibilityRole="tablist">
      {days.map((d) => {
        const on = d.key === selected;
        return (
          <PressableScale
            key={d.key}
            onPress={() => onSelect(d.key)}
            disabled={d.disabled}
            style={[styles.day, on && (tone === 'water' ? styles.onWater : styles.on)]}
            accessibilityRole="tab"
            accessibilityState={{ selected: on, disabled: !!d.disabled }}
            accessibilityLabel={`${d.weekday} ${d.day}`}
          >
            <Text variant="caption" color={on ? (tone === 'water' ? 'primary' : 'onAccent') : d.disabled ? 'disabled' : 'muted'}>
              {d.weekday}
            </Text>
            <Text variant="bodySemibold" color={on ? (tone === 'water' ? 'primary' : 'onAccent') : d.disabled ? 'disabled' : 'primary'} tabular>
              {d.day}
            </Text>
            <View style={[styles.mark, d.marked && (tone === 'water' ? styles.markWater : styles.markOn)]} />
          </PressableScale>
        );
      })}
    </View>
  );
});

const useStyles = makeStyles((t) => ({
  row: { flexDirection: 'row', justifyContent: 'space-between', gap: t.spacing.xxs },
  day: { flex: 1, alignItems: 'center', paddingVertical: t.spacing.xs, borderRadius: t.radius.lg, gap: 2 },
  on: { backgroundColor: t.colors.accent },
  onWater: { backgroundColor: t.colors.tones.water.bg },
  mark: { width: 5, height: 5, borderRadius: 3, backgroundColor: 'transparent', marginTop: 2 },
  markOn: { backgroundColor: t.colors.accentForeground },
  markWater: { backgroundColor: t.colors.tones.water.fg },
}));
