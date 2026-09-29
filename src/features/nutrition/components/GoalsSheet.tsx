import { useState } from 'react';
import { View } from 'react-native';

import { BottomSheet, Button, makeStyles, NumericInput, Text } from '@/design-system';
import { useAppStore } from '@/store';

/** Optional supporting targets. Protein stays the headline goal. */
export function GoalsSheet({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const styles = useStyles();
  const journey = useAppStore((s) => s.journey);
  const updateJourney = useAppStore((s) => s.updateJourney);
  const [kcal, setKcal] = useState<number | null>(journey?.calorieTargetKcal ?? null);
  const [carbs, setCarbs] = useState<number | null>(journey?.carbsTargetG ?? null);
  const [fat, setFat] = useState<number | null>(journey?.fatTargetG ?? null);
  const [opened, setOpened] = useState(visible);
  if (visible !== opened) {
    setOpened(visible);
    if (visible) {
      setKcal(journey?.calorieTargetKcal ?? null);
      setCarbs(journey?.carbsTargetG ?? null);
      setFat(journey?.fatTargetG ?? null);
    }
  }
  const field = (label: string, value: number | null, set: (v: number | null) => void, unit: string) => (
    <View style={styles.field}>
      <Text variant="smallMedium" color="secondary">
        {label}
      </Text>
      <NumericInput value={value} onChangeValue={set} unit={unit} decimals={false} placeholder="Not set" accessibilityLabel={`${label} in ${unit}`} />
    </View>
  );
  return (
    <BottomSheet
      visible={visible}
      onClose={onClose}
      title="Nutrition goals"
      subtitle={`Protein: ${journey?.proteinTargetG ?? 0} g (change in Profile). These are optional.`}
      footer={
        <Button
          label="Save goals"
          onPress={() => {
            updateJourney({ calorieTargetKcal: kcal, carbsTargetG: carbs, fatTargetG: fat });
            onClose();
          }}
        />
      }
    >
      {field('Calories', kcal, setKcal, 'kcal')}
      <View style={styles.row}>
        {field('Carbs', carbs, setCarbs, 'g')}
        {field('Fat', fat, setFat, 'g')}
      </View>
      <Text variant="caption" color="muted">
        Level90 isn’t a calorie counter. Goals only add context to your meals.
      </Text>
    </BottomSheet>
  );
}

const useStyles = makeStyles((t) => ({
  field: { flex: 1, gap: t.spacing.xs },
  row: { flexDirection: 'row', gap: t.spacing.sm },
}));
