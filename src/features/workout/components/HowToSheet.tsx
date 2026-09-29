import { View } from 'react-native';

import { EXERCISE_MOVEMENT, MOVEMENTS } from '@/assets/illustrations/exercises';
import { EQUIPMENT_LABEL, MUSCLE_GROUP_LABEL } from '@/data/exercises';
import { BottomSheet, Chip, makeStyles, Text } from '@/design-system';
import type { Exercise } from '@/domain';

import { ExerciseArtwork } from '../artwork';

/**
 * Concise how-to: start/finish frames, numbered cues, target muscles.
 * Frames are illustrations today; the slot can host animation/video later.
 */
export function HowToSheet({ exercise, onClose }: { exercise: Exercise | null; onClose: () => void }) {
  const styles = useStyles();
  const movement = exercise ? EXERCISE_MOVEMENT[exercise.id] : undefined;
  return (
    <BottomSheet visible={!!exercise} onClose={onClose} title={exercise?.name} subtitle={exercise ? `${EQUIPMENT_LABEL[exercise.equipment]}${movement ? ` · ${MOVEMENTS[movement].label}` : ''}` : undefined}>
      {exercise ? (
        <>
          <View style={styles.frames}>
            {(['start', 'end'] as const).map((f, i) => (
              <View key={f} style={styles.frame}>
                <ExerciseArtwork exercise={exercise} variant="hero" frame={f} style={styles.frameArt} />
                <Text variant="label" color="muted" align="center">
                  {i + 1} · {f === 'start' ? 'Start' : 'Finish'}
                </Text>
              </View>
            ))}
          </View>
          <View style={styles.steps}>
            {exercise.instructions.map((s, i) => (
              <View key={i} style={styles.step}>
                <View style={styles.num}>
                  <Text variant="caption" color="onAccent" tabular>
                    {i + 1}
                  </Text>
                </View>
                <Text variant="body" color="secondary" style={styles.flex}>
                  {s}
                </Text>
              </View>
            ))}
          </View>
          <View>
            <Text variant="label" color="muted">
              Target muscles
            </Text>
            <View style={styles.chips}>
              <Chip label={MUSCLE_GROUP_LABEL[exercise.muscleGroup]} tone="accent" />
              {exercise.secondaryMuscles.map((m) => (
                <Chip key={m} label={m} />
              ))}
            </View>
          </View>
          <Text variant="caption" color="muted">
            General cues, not personal coaching. Use a load you can control.
          </Text>
        </>
      ) : null}
    </BottomSheet>
  );
}

const useStyles = makeStyles((t) => ({
  flex: { flex: 1 },
  frames: { flexDirection: 'row', gap: t.spacing.sm },
  frame: { flex: 1, gap: t.spacing.xs },
  frameArt: { height: 170 },
  steps: { gap: t.spacing.sm },
  step: { flexDirection: 'row', gap: t.spacing.sm, alignItems: 'flex-start' },
  num: { width: 22, height: 22, borderRadius: 11, backgroundColor: t.colors.accent, alignItems: 'center', justifyContent: 'center', marginTop: 1 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: t.spacing.xs, marginTop: t.spacing.xs },
}));
