import type { LucideIcon } from 'lucide-react-native';
import { View, type StyleProp, type ViewStyle } from 'react-native';

import { useTheme } from '../../theme';
import type { Tone } from '../../tokens';

interface IconBadgeProps {
  icon: LucideIcon;
  tone?: Tone;
  size?: 'sm' | 'md' | 'lg';
  /** Plain icon without the soft container. */
  bare?: boolean;
  style?: StyleProp<ViewStyle>;
}

const BOX = { sm: 28, md: 36, lg: 44 } as const;
const ICON = { sm: 16, md: 19, lg: 22 } as const;

/** Semantic icon in a soft tinted container. Decorative: hidden from screen readers. */
export function IconBadge({ icon: Icon, tone = 'neutral', size = 'md', bare = false, style }: IconBadgeProps) {
  const { colors, radius } = useTheme();
  const c = colors.tones[tone];
  if (bare) return <Icon size={ICON[size]} color={c.fg} strokeWidth={2} />;
  return (
    <View
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={[{ width: BOX[size], height: BOX[size], borderRadius: size === 'sm' ? radius.sm : radius.md, backgroundColor: c.bg, alignItems: 'center', justifyContent: 'center' }, style]}
    >
      <Icon size={ICON[size]} color={c.fg} strokeWidth={2} />
    </View>
  );
}
