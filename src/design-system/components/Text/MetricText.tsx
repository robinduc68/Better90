import { View, type ViewStyle } from 'react-native';

import { useTheme } from '../../theme';
import type { TypographyVariant } from '../../tokens';
import { Text, type TextColor } from './Text';

interface MetricTextProps {
  value: string;
  unit?: string;
  /** Secondary value such as a target: renders as " / 130g". */
  suffix?: string;
  size?: Extract<TypographyVariant, 'metricXL' | 'metricL' | 'metricM' | 'metricS'>;
  color?: TextColor;
  style?: ViewStyle;
  accessibilityLabel?: string;
}

const UNIT_VARIANT = {
  metricXL: 'h3',
  metricL: 'bodySemibold',
  metricM: 'smallMedium',
  metricS: 'caption',
} as const;

/** Large tabular number with a quieter unit/target, e.g. "108g / 130g". */
export function MetricText({ value, unit, suffix, size = 'metricM', color = 'primary', style, accessibilityLabel }: MetricTextProps) {
  const theme = useTheme();
  return (
    <View
      style={[{ flexDirection: 'row', alignItems: 'baseline', flexWrap: 'wrap' }, style]}
      accessible
      accessibilityLabel={accessibilityLabel ?? `${value}${unit ?? ''}${suffix ? ` of ${suffix}` : ''}`}
    >
      <Text variant={size} color={color}>
        {value}
      </Text>
      {unit ? (
        <Text variant={UNIT_VARIANT[size]} color="secondary" style={{ marginLeft: 2 }} tabular>
          {unit}
        </Text>
      ) : null}
      {suffix ? (
        <Text variant={UNIT_VARIANT[size]} color="muted" style={{ marginLeft: theme.spacing.xxs }} tabular>
          / {suffix}
        </Text>
      ) : null}
    </View>
  );
}
