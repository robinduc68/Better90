import { View, type StyleProp, type ViewStyle } from 'react-native';

import { useTheme } from '../../theme';

interface SegmentedProgressProps {
  /** One entry per task, each 0–1. */
  segments: number[];
  height?: number;
  style?: StyleProp<ViewStyle>;
  accessibilityLabel?: string;
}

/** A segment per daily task: shows *which* share is done, not just a percentage. */
export function SegmentedProgress({ segments, height = 6, style, accessibilityLabel }: SegmentedProgressProps) {
  const { colors } = useTheme();
  const done = segments.filter((s) => s >= 1).length;
  return (
    <View
      style={[{ flexDirection: 'row', gap: 4 }, style]}
      accessible
      accessibilityRole="progressbar"
      accessibilityLabel={accessibilityLabel}
      accessibilityValue={{ min: 0, max: segments.length, now: done }}
    >
      {segments.map((v, i) => (
        <View key={i} style={{ flex: 1, height, borderRadius: height, backgroundColor: colors.track, overflow: 'hidden' }}>
          <View style={{ width: `${Math.round(Math.max(0, Math.min(1, v)) * 100)}%`, height, borderRadius: height, backgroundColor: v >= 1 ? colors.accent : colors.accentSubtle }} />
        </View>
      ))}
    </View>
  );
}
