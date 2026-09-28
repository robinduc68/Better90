import type { ReactNode } from 'react';
import { KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import Animated, { FadeIn, FadeOut, SlideInDown, SlideOutDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useReducedMotion } from '../../hooks';
import { makeStyles } from '../../theme';
import { Text } from '../Text';

interface BottomSheetProps {
  visible: boolean;
  onClose: () => void;
  title?: string;
  subtitle?: string;
  children: ReactNode;
  /** Pinned below the content, above the keyboard. */
  footer?: ReactNode;
}

/**
 * Lightweight contextual sheet (quick entry, edit set, options).
 * Keyboard-aware so inputs and the confirm action stay visible.
 */
export function BottomSheet({ visible, onClose, title, subtitle, children, footer }: BottomSheetProps) {
  const styles = useStyles();
  const insets = useSafeAreaInsets();
  const reduceMotion = useReducedMotion();

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onClose} statusBarTranslucent navigationBarTranslucent>
      {visible ? (
        <View style={styles.fill}>
          <Animated.View entering={FadeIn.duration(200)} exiting={FadeOut.duration(180)} style={styles.backdrop}>
            <Pressable style={styles.fill} onPress={onClose} accessibilityRole="button" accessibilityLabel="Close sheet" />
          </Animated.View>
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.avoider} pointerEvents="box-none">
            <Animated.View
              entering={reduceMotion ? FadeIn.duration(150) : SlideInDown.duration(300)}
              exiting={reduceMotion ? FadeOut.duration(150) : SlideOutDown.duration(250)}
              style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, 16) }]}
              accessibilityViewIsModal
            >
              <View style={styles.handle} />
              {title ? (
                <View style={styles.header}>
                  <Text variant="h3" accessibilityRole="header">
                    {title}
                  </Text>
                  {subtitle ? (
                    <Text variant="small" color="secondary">
                      {subtitle}
                    </Text>
                  ) : null}
                </View>
              ) : null}
              <ScrollView bounces={false} keyboardShouldPersistTaps="handled" contentContainerStyle={styles.content} style={styles.scroll}>
                {children}
              </ScrollView>
              {footer ? <View style={styles.footer}>{footer}</View> : null}
            </Animated.View>
          </KeyboardAvoidingView>
        </View>
      ) : null}
    </Modal>
  );
}

const useStyles = makeStyles((t) => ({
  fill: { flex: 1 },
  backdrop: { ...StyleSheet.absoluteFill, backgroundColor: t.colors.overlay },
  avoider: { flex: 1, justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: t.colors.surface,
    borderTopLeftRadius: t.radius.xl,
    borderTopRightRadius: t.radius.xl,
    borderWidth: 1,
    borderColor: t.colors.border,
    maxHeight: '88%',
    width: '100%',
    maxWidth: 560,
    alignSelf: 'center',
  },
  handle: {
    alignSelf: 'center',
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: t.colors.borderStrong,
    marginTop: t.spacing.xs,
    marginBottom: t.spacing.xs,
  },
  header: { paddingHorizontal: t.spacing.lg, paddingTop: t.spacing.xs, paddingBottom: t.spacing.sm, gap: t.spacing.xxs },
  scroll: { flexGrow: 0 },
  content: { paddingHorizontal: t.spacing.lg, paddingBottom: t.spacing.md, gap: t.spacing.md },
  footer: { paddingHorizontal: t.spacing.lg, paddingTop: t.spacing.xs },
}));

