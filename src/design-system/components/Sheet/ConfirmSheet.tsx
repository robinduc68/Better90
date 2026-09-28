import { View } from 'react-native';

import { makeStyles } from '../../theme';
import { Button } from '../Button';
import { Text } from '../Text';
import { BottomSheet } from './BottomSheet';

interface ConfirmSheetProps {
  visible: boolean;
  title: string;
  message: string;
  confirmLabel: string;
  cancelLabel?: string;
  destructive?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

/** Cross-platform confirmation (works on web, unlike Alert). */
export function ConfirmSheet({ visible, title, message, confirmLabel, cancelLabel = 'Cancel', destructive, onConfirm, onCancel }: ConfirmSheetProps) {
  const styles = useStyles();
  return (
    <BottomSheet
      visible={visible}
      onClose={onCancel}
      title={title}
      footer={
        <View style={styles.actions}>
          <Button label={confirmLabel} variant={destructive ? 'danger' : 'primary'} onPress={onConfirm} />
          <Button label={cancelLabel} variant="ghost" size="md" onPress={onCancel} />
        </View>
      }
    >
      <Text variant="body" color="secondary">
        {message}
      </Text>
    </BottomSheet>
  );
}

const useStyles = makeStyles((t) => ({
  actions: { gap: t.spacing.xxs },
}));
