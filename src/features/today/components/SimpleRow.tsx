import { ChevronRight } from 'lucide-react-native';
import type { ReactNode } from 'react';
import { View } from 'react-native';

import { makeStyles, PressableScale, Text, useTheme } from '@/design-system';

interface SimpleRowProps {
  title: string;
  subtitle: string;
  subtitleTone?: 'muted' | 'accent';
  onPress: () => void;
  trailing?: ReactNode;
  accessibilityLabel?: string;
}

/** Row matching HabitRow's rhythm, for sleep and activities. */
export function SimpleRow({ title, subtitle, subtitleTone = 'muted', onPress, trailing, accessibilityLabel }: SimpleRowProps) {
  const styles = useStyles();
  const { colors } = useTheme();
  return (
    <PressableScale onPress={onPress} pressedScale={1} pressedOpacity={0.7} style={styles.row} accessibilityLabel={accessibilityLabel ?? `${title}, ${subtitle}`}>
      <View style={styles.body}>
        <Text variant="bodyMedium" numberOfLines={1}>
          {title}
        </Text>
        <Text variant="caption" color={subtitleTone} tabular numberOfLines={1}>
          {subtitle}
        </Text>
      </View>
      <View style={styles.trailing}>{trailing ?? <ChevronRight size={18} color={colors.textMuted} />}</View>
    </PressableScale>
  );
}

const useStyles = makeStyles((t) => ({
  row: { flexDirection: 'row', alignItems: 'center', minHeight: t.layout.rowHeight },
  body: { flex: 1, gap: 3, paddingLeft: t.spacing.md, paddingVertical: t.spacing.xs },
  trailing: { width: 60, alignItems: 'center', justifyContent: 'center' },
}));
