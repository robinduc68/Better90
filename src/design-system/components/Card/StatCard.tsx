import { View, type StyleProp, type ViewStyle } from 'react-native';

import { useTheme } from '../../theme';
import { Text, type TextColor } from '../Text';
import { Card } from './Card';

interface StatCardProps {
  label: string;
  value: string;
  caption?: string;
  captionColor?: TextColor;
  style?: StyleProp<ViewStyle>;
  variant?: 'base' | 'flat';
}

export function StatCard({ label, value, caption, captionColor = 'muted', style, variant = 'flat' }: StatCardProps) {
  const theme = useTheme();
  return (
    <Card variant={variant} padding="md" style={[{ flex: 1 }, style]} accessibilityLabel={`${label}: ${value}${caption ? `, ${caption}` : ''}`}>
      <Text variant="label" color="muted" numberOfLines={1}>
        {label}
      </Text>
      <View style={{ marginTop: theme.spacing.xs }}>
        <Text variant="metricM" numberOfLines={1} adjustsFontSizeToFit>
          {value}
        </Text>
      </View>
      {caption ? (
        <Text variant="caption" color={captionColor} style={{ marginTop: theme.spacing.xxs }} numberOfLines={2}>
          {caption}
        </Text>
      ) : null}
    </Card>
  );
}
