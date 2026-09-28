import { CloudOff } from 'lucide-react-native';
import { View } from 'react-native';
import Animated, { FadeInUp, FadeOutUp } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { makeStyles, useTheme } from '../../theme';
import { Text } from '../Text';

/** Small, non-blocking offline indicator floating under the status bar. */
export function OfflineBanner({ visible, message = 'Changes will sync automatically.' }: { visible: boolean; message?: string }) {
  const styles = useStyles();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  if (!visible) return null;
  return (
    <View pointerEvents="none" style={[styles.wrap, { top: insets.top + 4 }]}>
      <Animated.View entering={FadeInUp.duration(250)} exiting={FadeOutUp.duration(200)} style={styles.pill} accessibilityLiveRegion="polite" accessible accessibilityLabel={`Offline. ${message}`}>
        <CloudOff size={14} color={colors.textSecondary} />
        <Text variant="label" color="secondary">
          Offline
        </Text>
        <Text variant="caption" color="muted" numberOfLines={1}>
          {message}
        </Text>
      </Animated.View>
    </View>
  );
}

const useStyles = makeStyles((t) => ({
  wrap: { position: 'absolute', left: 0, right: 0, alignItems: 'center', paddingHorizontal: t.spacing.md },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: t.spacing.xs,
    maxWidth: '100%',
    paddingHorizontal: t.spacing.sm,
    paddingVertical: t.spacing.xxs + 2,
    borderRadius: t.radius.pill,
    backgroundColor: t.colors.surfaceElevated,
    borderWidth: 1,
    borderColor: t.colors.borderStrong,
  },
}));
