import { View } from 'react-native';

import { useTheme } from '../../theme';
import { Text } from '../Text';

/** Typography-only wordmark: LEVEL90 with the "90" in the accent. */
export function Wordmark({ size = 'md', color }: { size?: 'sm' | 'md' | 'lg'; color?: { ink: string; accent: string } }) {
  const theme = useTheme();
  const fontSize = size === 'lg' ? 28 : size === 'md' ? 18 : 14;
  const ink = color?.ink ?? theme.colors.textPrimary;
  const accent = color?.accent ?? theme.colors.accentForeground;
  return (
    <View style={{ flexDirection: 'row', alignItems: 'baseline' }} accessible accessibilityLabel="Level90">
      <Text style={{ fontFamily: theme.typography.display.fontFamily, fontSize, lineHeight: fontSize * 1.2, letterSpacing: fontSize * 0.14, color: ink }}>
        LEVEL
      </Text>
      <Text style={{ fontFamily: theme.typography.display.fontFamily, fontSize, lineHeight: fontSize * 1.2, letterSpacing: fontSize * 0.04, color: accent }}>
        90
      </Text>
    </View>
  );
}
