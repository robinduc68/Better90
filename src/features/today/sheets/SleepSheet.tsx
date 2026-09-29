import { useState } from 'react';
import { View } from 'react-native';

import { BottomSheet, Button, makeStyles, QuickAddButton, Stepper } from '@/design-system';
import { formatDuration } from '@/domain';

interface SleepSheetProps {
  visible: boolean;
  onClose: () => void;
  initial: number | null;
  target: number;
  onSave: (minutes: number | null) => void;
}

const PRESETS = [360, 420, 450, 480];

export function SleepSheet({ visible, onClose, initial, target, onSave }: SleepSheetProps) {
  const styles = useStyles();
  const [value, setValue] = useState(initial ?? target);
  // Reset the draft each time the sheet opens.
  const [wasVisible, setWasVisible] = useState(visible);
  if (visible !== wasVisible) {
    setWasVisible(visible);
    if (visible) setValue(initial ?? target);
  }

  return (
    <BottomSheet
      visible={visible}
      onClose={onClose}
      title="Sleep"
      subtitle={`Last night · target ${formatDuration(target)}`}
      footer={
        <View style={styles.footer}>
          {initial !== null ? (
            <Button
              label="Clear"
              variant="ghost"
              size="md"
              onPress={() => {
                onSave(null);
                onClose();
              }}
            />
          ) : null}
          <Button
            label="Save"
            onPress={() => {
              onSave(value);
              onClose();
            }}
            style={styles.save}
          />
        </View>
      }
    >
      <Stepper label="Hours slept" value={value} onChange={setValue} step={15} min={0} max={960} format={formatDuration} />
      <View style={styles.presets}>
        {PRESETS.map((p) => (
          <QuickAddButton key={p} label={formatDuration(p)} onPress={() => setValue(p)} style={styles.preset} emphasis={p === value ? 'accent' : 'default'} />
        ))}
      </View>
    </BottomSheet>
  );
}

const useStyles = makeStyles((t) => ({
  presets: { flexDirection: 'row', gap: t.spacing.xs },
  preset: { flex: 1 },
  footer: { flexDirection: 'row', gap: t.spacing.xs, alignItems: 'center' },
  save: { flex: 1 },
}));
