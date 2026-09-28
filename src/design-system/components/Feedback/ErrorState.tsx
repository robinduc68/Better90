import { CircleAlert } from 'lucide-react-native';
import { View } from 'react-native';

import { makeStyles, useTheme } from '../../theme';
import { Button } from '../Button';
import { Text } from '../Text';

interface ErrorStateProps {
  title: string;
  message: string;
  onRetry?: () => void;
  retryLabel?: string;
}

/** Actionable error: what happened, what we did about it, what the user can do. */
export function ErrorState({ title, message, onRetry, retryLabel = 'Retry' }: ErrorStateProps) {
  const styles = useStyles();
  const { colors } = useTheme();
  return (
    <View style={styles.root} accessibilityRole="alert">
      <View style={styles.row}>
        <CircleAlert size={20} color={colors.warning} />
        <View style={styles.body}>
          <Text variant="bodySemibold">{title}</Text>
          <Text variant="small" color="secondary">
            {message}
          </Text>
        </View>
      </View>
      {onRetry ? <Button label={retryLabel} onPress={onRetry} variant="secondary" size="sm" style={styles.retry} /> : null}
    </View>
  );
}

const useStyles = makeStyles((t) => ({
  root: { backgroundColor: t.colors.surfaceSecondary, borderRadius: t.radius.lg, padding: t.spacing.md, gap: t.spacing.sm },
  row: { flexDirection: 'row', gap: t.spacing.sm },
  body: { flex: 1, gap: t.spacing.xxs },
  retry: { alignSelf: 'flex-start', marginLeft: t.spacing['2xl'] },
}));
