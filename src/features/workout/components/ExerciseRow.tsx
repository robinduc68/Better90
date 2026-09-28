import { ChevronRight } from 'lucide-react-native';
import { memo } from 'react';
import { View } from 'react-native';

import { EQUIPMENT_LABEL, MUSCLE_GROUP_LABEL } from '@/data/exercises';
import { Checkmark, makeStyles, PressableScale, Text, useTheme } from '@/design-system';
import type { Exercise } from '@/domain';

import { ExerciseImage } from './ExerciseImage';

interface ExerciseRowProps {
  exercise: Exercise;
  onPress: (exercise: Exercise) => void;
  selected?: boolean;
  selectable?: boolean;
}

export const ExerciseRow = memo(function ExerciseRow({ exercise, onPress, selected = false, selectable = false }: ExerciseRowProps) {
  const styles = useStyles();
  const { colors } = useTheme();
  const meta = `${MUSCLE_GROUP_LABEL[exercise.muscleGroup]} • ${EQUIPMENT_LABEL[exercise.equipment]}`;
  return (
    <PressableScale
      onPress={() => onPress(exercise)}
      pressedScale={1}
      pressedOpacity={0.7}
      style={styles.row}
      accessibilityRole={selectable ? 'checkbox' : 'button'}
      accessibilityState={selectable ? { checked: selected } : undefined}
      accessibilityLabel={`${exercise.name}, ${meta}`}
    >
      <ExerciseImage exercise={exercise} variant="thumb" />
      <View style={styles.body}>
        <Text variant="bodyMedium" numberOfLines={1}>
          {exercise.name}
        </Text>
        <Text variant="caption" color="muted" numberOfLines={1}>
          {meta}
        </Text>
      </View>
      {selectable ? <Checkmark checked={selected} size={26} /> : <ChevronRight size={18} color={colors.textMuted} />}
    </PressableScale>
  );
});

const useStyles = makeStyles((t) => ({
  row: { flexDirection: 'row', alignItems: 'center', gap: t.spacing.sm, minHeight: 68, paddingVertical: t.spacing.xs },
  body: { flex: 1, gap: 2 },
}));
