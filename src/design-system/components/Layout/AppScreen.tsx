import type { ReactNode } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, View, type RefreshControlProps, type StyleProp, type ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { makeStyles } from '../../theme';

interface AppScreenProps {
  children: ReactNode;
  scroll?: boolean;
  /** Dense screens use 16px gutters instead of 20px. */
  dense?: boolean;
  /** Content pinned below the scroll view (e.g. primary action). */
  footer?: ReactNode;
  header?: ReactNode;
  /** Respect top safe area. Disable when a native header already handles it. */
  safeTop?: boolean;
  /** Extra bottom space so content clears the tab bar or footer. */
  bottomInset?: number;
  contentStyle?: StyleProp<ViewStyle>;
  refreshControl?: React.ReactElement<RefreshControlProps>;
  keyboardAware?: boolean;
}

export function AppScreen({
  children,
  scroll = true,
  dense = false,
  footer,
  header,
  safeTop = true,
  bottomInset = 0,
  contentStyle,
  refreshControl,
  keyboardAware = false,
}: AppScreenProps) {
  const styles = useStyles();
  const insets = useSafeAreaInsets();
  const padding = dense ? styles.dense : styles.regular;

  const body = scroll ? (
    <ScrollView
      style={styles.flex}
      contentContainerStyle={[padding, styles.scrollContent, { paddingBottom: bottomInset + (footer ? 16 : insets.bottom + 24) }, contentStyle]}
      keyboardShouldPersistTaps="handled"
      keyboardDismissMode="interactive"
      showsVerticalScrollIndicator={false}
      refreshControl={refreshControl}
      automaticallyAdjustKeyboardInsets
    >
      {children}
    </ScrollView>
  ) : (
    <View style={[styles.flex, padding, contentStyle]}>{children}</View>
  );

  const content = (
    <>
      {header}
      {body}
      {footer ? <View style={[padding, styles.footer, { paddingBottom: Math.max(insets.bottom, 16) }]}>{footer}</View> : null}
    </>
  );

  return (
    <View style={[styles.root, safeTop && { paddingTop: insets.top }]}>
      {keyboardAware ? (
        <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          {content}
        </KeyboardAvoidingView>
      ) : (
        content
      )}
    </View>
  );
}

const useStyles = makeStyles((t) => ({
  root: { flex: 1, backgroundColor: t.colors.background },
  flex: { flex: 1 },
  regular: { paddingHorizontal: t.layout.screenPadding },
  dense: { paddingHorizontal: t.layout.screenPaddingDense },
  scrollContent: { flexGrow: 1 },
  footer: { paddingTop: t.spacing.sm, backgroundColor: t.colors.background, borderTopWidth: 1, borderTopColor: t.colors.border },
}));
