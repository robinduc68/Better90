import { ChevronRight } from 'lucide-react-native';
import { View } from 'react-native';

import { makeStyles, MiniSparkline, PressableScale, Text, useTheme } from '@/design-system';
import { formatKg } from '@/domain';

interface StrengthRowProps {
  name: string;
  first: number;
  latest: number;
  series: number[];
  onPress: () => void;
}

/** "Lat Pulldown · 30 → 37.5 kg · +25%" with a sparkline of top sets. */
export function StrengthRow({ name, first, latest, series, onPress }: StrengthRowProps) {
  const styles = useStyles();
  const { colors } = useTheme();
  const pct = first > 0 ? Math.round(((latest - first) / first) * 100) : null;
  const up = latest > first;
  return (
    <PressableScale onPress={onPress} pressedScale={1} pressedOpacity={0.7} style={styles.row} accessibilityLabel={`${name}, ${formatKg(first)} to ${formatKg(latest)}${pct !== null ? `, ${pct} percent` : ''}`}>
      <View style={styles.flex}>
        <Text variant="bodyMedium" numberOfLines={1}>
          {name}
        </Text>
        <Text variant="caption" color="muted" tabular>
          {formatKg(first, false)} → {formatKg(latest)}
        </Text>
      </View>
      <MiniSparkline values={series} tone={up ? 'positive' : 'neutral'} />
      <Text variant="smallMedium" color={up ? 'success' : 'secondary'} tabular style={styles.pct}>
        {pct === null ? '' : `${pct > 0 ? '+' : ''}${pct}%`}
      </Text>
      <ChevronRight size={16} color={colors.textMuted} />
    </PressableScale>
  );
}

const useStyles = makeStyles((t) => ({
  row: { flexDirection: 'row', alignItems: 'center', gap: t.spacing.sm, minHeight: 60, paddingHorizontal: t.spacing.md },
  flex: { flex: 1 },
  pct: { width: 48, textAlign: 'right' },
}));
