import { router } from 'expo-router';
import { ChevronLeft, X } from 'lucide-react-native';
import type { ReactNode } from 'react';
import { View } from 'react-native';

import { makeStyles } from '../../theme';
import { IconButton } from '../Button';
import { Text } from '../Text';

interface AppHeaderProps {
  title?: string;
  subtitle?: string;
  /** "back" shows a chevron, "close" shows an X (modals). */
  leading?: 'back' | 'close' | 'none';
  onLeadingPress?: () => void;
  trailing?: ReactNode;
  center?: ReactNode;
}

export function AppHeader({ title, subtitle, leading = 'back', onLeadingPress, trailing, center }: AppHeaderProps) {
  const styles = useStyles();
  const handleLeading = onLeadingPress ?? (() => (router.canGoBack() ? router.back() : router.replace('/')));
  return (
    <View style={styles.root}>
      <View style={styles.side}>
        {leading !== 'none' ? (
          <IconButton
            icon={leading === 'close' ? X : ChevronLeft}
            onPress={handleLeading}
            accessibilityLabel={leading === 'close' ? 'Close' : 'Back'}
          />
        ) : null}
      </View>
      <View style={styles.center}>
        {center ?? (
          <>
            {title ? (
              <Text variant="bodySemibold" numberOfLines={1} align="center" accessibilityRole="header">
                {title}
              </Text>
            ) : null}
            {subtitle ? (
              <Text variant="caption" color="muted" numberOfLines={1} align="center" tabular>
                {subtitle}
              </Text>
            ) : null}
          </>
        )}
      </View>
      <View style={[styles.side, styles.trailing]}>{trailing}</View>
    </View>
  );
}

const useStyles = makeStyles((t) => ({
  root: { flexDirection: 'row', alignItems: 'center', minHeight: 56, paddingHorizontal: t.spacing.xs },
  side: { minWidth: 88, flexDirection: 'row', alignItems: 'center' },
  trailing: { justifyContent: 'flex-end' },
  center: { flex: 1, alignItems: 'center' },
}));
