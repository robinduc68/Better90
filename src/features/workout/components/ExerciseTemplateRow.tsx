import { Play } from 'lucide-react-native';
import { memo } from 'react';
import { useWindowDimensions, View } from 'react-native';

import { MUSCLE_GROUP_LABEL } from '@/data/exercises';
import { Card, Chip, makeStyles, PressableScale, Text, useTheme } from '@/design-system';
import { estimateTemplateMinutes, type WorkoutTemplate } from '@/domain';

import { CroppedMuscleArt, templateMuscles } from '../artwork';

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const DAY_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export function scheduleLabel(t: Pick<WorkoutTemplate, 'weekdays'>) {
  if (t.weekdays.length === 0) return 'Unscheduled';
  const sorted = [...t.weekdays].sort((a, b) => ((a + 6) % 7) - ((b + 6) % 7));
  return sorted.length === 1 ? DAY_NAMES[sorted[0]!]! : sorted.map((d) => DAY_SHORT[d]).join(', ');
}

interface ExerciseTemplateRowProps {
  template: WorkoutTemplate;
  isToday: boolean;
  onOpen: () => void;
  onStart: () => void;
  startDisabled: boolean;
}

const HEIGHT = 132;

/** Template card: identity comes from a large cropped view of the muscles it trains. */
export const ExerciseTemplateRow = memo(function ExerciseTemplateRow({ template, isToday, onOpen, onStart, startDisabled }: ExerciseTemplateRowProps) {
  const styles = useStyles();
  const { colors } = useTheme();
  const { width } = useWindowDimensions();
  const artW = Math.round((Math.min(width, 560) - 40) * 0.34);
  const muscles = templateMuscles(template).slice(0, 3);
  const surface = isToday ? colors.surfaceElevated : colors.surface;
  return (
    <Card padding="none" variant={isToday ? 'elevated' : 'base'} style={[styles.card, isToday && styles.today]}>
      <CroppedMuscleArt template={template} width={artW} height={HEIGHT} fadeInto={surface} style={styles.art} />
      <PressableScale
        onPress={onOpen}
        pressedScale={1}
        pressedOpacity={0.75}
        style={[styles.body, { paddingRight: artW - 8 }]}
        accessibilityLabel={`${template.name}, ${template.exercises.length} exercises, ${scheduleLabel(template)}${isToday ? ', planned today' : ''}`}
        accessibilityHint="Edit workout"
      >
        <View style={styles.titleRow}>
          <Text variant="h3" numberOfLines={2} style={styles.flexShrink}>
            {template.name}
          </Text>
        </View>
        <Text variant="caption" color="secondary" tabular>
          {template.exercises.length} exercises · ~{estimateTemplateMinutes(template)} min
        </Text>
        <View style={styles.chips}>
          {muscles.map((g) => (
            <Text key={g} variant="label" color="muted" style={styles.muscle}>
              {MUSCLE_GROUP_LABEL[g]}
            </Text>
          ))}
        </View>
        <View style={styles.bottom}>
          {isToday ? <Chip label="Today" tone="accent" /> : null}
          <Text variant="caption" color="muted" numberOfLines={1}>
            {scheduleLabel(template)}
          </Text>
        </View>
      </PressableScale>
      <PressableScale
        onPress={onStart}
        disabled={startDisabled}
        style={[styles.play, isToday ? styles.playToday : styles.playNeutral, startDisabled && styles.disabled]}
        accessibilityLabel={`Start ${template.name}`}
        accessibilityState={{ disabled: startDisabled }}
      >
        <Play size={18} color={isToday ? colors.onAccent : colors.background} fill={isToday ? colors.onAccent : colors.background} />
      </PressableScale>
    </Card>
  );
});

const useStyles = makeStyles((t) => ({
  card: { minHeight: HEIGHT, overflow: 'hidden' },
  today: { borderColor: t.colors.accentSubtle },
  art: { position: 'absolute', right: 0, top: 0 },
  body: { padding: t.spacing.md, gap: 3, minHeight: HEIGHT },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: t.spacing.xs },
  flexShrink: { flexShrink: 1 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', columnGap: t.spacing.sm, marginTop: t.spacing.xs },
  muscle: { letterSpacing: 1 },
  bottom: { flexDirection: 'row', alignItems: 'center', gap: t.spacing.xs, marginTop: 'auto', paddingTop: t.spacing.xs },
  play: { position: 'absolute', right: t.spacing.md, bottom: t.spacing.md, width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  playToday: { backgroundColor: t.colors.accent },
  playNeutral: { backgroundColor: t.colors.textPrimary },
  disabled: { opacity: 0.4 },
}));
