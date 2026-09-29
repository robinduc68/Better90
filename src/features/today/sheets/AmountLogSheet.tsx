import { X } from 'lucide-react-native';
import { useState } from 'react';
import { View } from 'react-native';

import { BottomSheet, Button, IconButton, makeStyles, NumericInput, ProgressBar, QuickAddButton, Text } from '@/design-system';

export interface LogEntry {
  id: string;
  label: string;
  time: string;
}

interface AmountLogSheetProps {
  visible: boolean;
  onClose: () => void;
  title: string;
  summary: string;
  progress: number;
  unit: string;
  presets: number[];
  formatPreset: (n: number) => string;
  onAdd: (amount: number) => void;
  entries: LogEntry[];
  onRemove: (id: string) => void;
  maxCustom: number;
}

/** Amount sheet for protein and water: presets, a custom amount, and today's entries. */
export function AmountLogSheet({
  visible,
  onClose,
  title,
  summary,
  progress,
  unit,
  presets,
  formatPreset,
  onAdd,
  entries,
  onRemove,
  maxCustom,
}: AmountLogSheetProps) {
  const styles = useStyles();
  const [custom, setCustom] = useState<number | null>(null);
  const invalid = custom !== null && (custom <= 0 || custom > maxCustom);

  const addCustom = () => {
    if (custom === null || invalid) return;
    onAdd(custom);
    setCustom(null);
  };

  return (
    <BottomSheet visible={visible} onClose={onClose} title={title} subtitle={summary}>
      <ProgressBar value={progress} height={4} />
      <View style={styles.presets}>
        {presets.map((p) => (
          <QuickAddButton key={p} label={formatPreset(p)} onPress={() => onAdd(p)} style={styles.preset} />
        ))}
      </View>
      <View style={styles.customRow}>
        <NumericInput
          value={custom}
          onChangeValue={setCustom}
          unit={unit}
          decimals={false}
          placeholder="Custom"
          style={styles.customInput}
          invalid={invalid}
          returnKeyType="done"
          onSubmitEditing={addCustom}
          accessibilityLabel={`Custom amount in ${unit}`}
        />
        <Button label="Add" size="md" onPress={addCustom} disabled={custom === null || invalid} />
      </View>
      {invalid ? (
        <Text variant="caption" color="danger">
          Enter an amount up to {maxCustom} {unit}.
        </Text>
      ) : null}
      {entries.length > 0 ? (
        <View>
          <Text variant="label" color="muted" style={styles.entriesLabel}>
            Today
          </Text>
          {entries.map((e) => (
            <View key={e.id} style={styles.entry}>
              <Text variant="bodyMedium" tabular style={styles.entryLabel}>
                {e.label}
              </Text>
              <Text variant="caption" color="muted" tabular>
                {e.time}
              </Text>
              <IconButton icon={X} onPress={() => onRemove(e.id)} accessibilityLabel={`Remove ${e.label} at ${e.time}`} />
            </View>
          ))}
        </View>
      ) : null}
    </BottomSheet>
  );
}

const useStyles = makeStyles((t) => ({
  presets: { flexDirection: 'row', gap: t.spacing.xs },
  preset: { flex: 1, minHeight: 48 },
  customRow: { flexDirection: 'row', gap: t.spacing.xs, alignItems: 'center' },
  customInput: { flex: 1 },
  entriesLabel: { marginBottom: t.spacing.xxs },
  entry: { flexDirection: 'row', alignItems: 'center', gap: t.spacing.sm, minHeight: 48, borderBottomWidth: 1, borderBottomColor: t.colors.border },
  entryLabel: { flex: 1 },
}));
