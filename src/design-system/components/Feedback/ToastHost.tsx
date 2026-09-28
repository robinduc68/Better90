import { useEffect } from 'react';
import { View } from 'react-native';
import Animated, { FadeInDown, FadeOutDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { makeStyles } from '../../theme';
import { PressableScale } from '../Control/PressableScale';
import { Text } from '../Text';
import { useToastStore } from './toastStore';

const TOAST_MS = 3500;

/** Single, non-blocking toast anchored above the tab bar. */
export function ToastHost({ bottomOffset = 96 }: { bottomOffset?: number }) {
  const styles = useStyles();
  const insets = useSafeAreaInsets();
  const current = useToastStore((s) => s.current);
  const dismiss = useToastStore((s) => s.dismiss);

  useEffect(() => {
    if (!current) return;
    const timer = setTimeout(dismiss, TOAST_MS);
    return () => clearTimeout(timer);
  }, [current, dismiss]);

  if (!current) return null;
  return (
    <View pointerEvents="box-none" style={[styles.wrap, { bottom: insets.bottom + bottomOffset }]}>
      <Animated.View key={current.id} entering={FadeInDown.duration(220)} exiting={FadeOutDown.duration(180)} style={styles.toast} accessibilityLiveRegion="polite" accessibilityRole="alert">
        <Text variant="smallMedium" style={styles.message} numberOfLines={2}>
          {current.message}
        </Text>
        {current.actionLabel && current.onAction ? (
          <PressableScale
            onPress={() => {
              current.onAction?.();
              dismiss();
            }}
            hitSlop={8}
            style={styles.action}
            accessibilityLabel={current.actionLabel}
          >
            <Text variant="smallMedium" color="accent">
              {current.actionLabel}
            </Text>
          </PressableScale>
        ) : null}
      </Animated.View>
    </View>
  );
}

const useStyles = makeStyles((t) => ({
  wrap: { position: 'absolute', left: t.spacing.md, right: t.spacing.md, alignItems: 'center' },
  toast: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: t.spacing.md,
    maxWidth: 480,
    width: '100%',
    minHeight: 48,
    paddingHorizontal: t.spacing.md,
    paddingVertical: t.spacing.sm,
    borderRadius: t.radius.lg,
    backgroundColor: t.colors.surfaceElevated,
    borderWidth: 1,
    borderColor: t.colors.borderStrong,
  },
  message: { flex: 1 },
  action: { minHeight: 32, justifyContent: 'center', paddingHorizontal: t.spacing.xxs },
}));
