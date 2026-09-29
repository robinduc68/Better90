import { Check } from 'lucide-react-native';
import { View } from 'react-native';

import { makeStyles, Text, useTheme } from '@/design-system';

export interface TimelineCheckpoint {
  day: number;
  state: 'done' | 'now' | 'upcoming' | 'past';
}

const NODE = 22;

/** ●────●────◉────○ — logged checkpoints in lime, the next one ringed. */
export function CheckpointTimeline({ checkpoints }: { checkpoints: TimelineCheckpoint[] }) {
  const styles = useStyles();
  const { colors } = useTheme();
  const nextIdx = checkpoints.findIndex((c) => c.state === 'now' || c.state === 'upcoming');
  const reached = nextIdx === -1 ? checkpoints.length - 1 : Math.max(0, nextIdx);
  const fill = checkpoints.length > 1 ? reached / (checkpoints.length - 1) : 0;
  const label = checkpoints
    .map((c) => `day ${c.day} ${c.state === 'done' ? 'logged' : c.state === 'now' ? 'due now' : c.state === 'past' ? 'not logged' : 'upcoming'}`)
    .join(', ');

  return (
    <View accessible accessibilityLabel={`Checkpoints: ${label}`}>
      <View style={styles.track}>
        <View style={styles.rail} />
        <View style={[styles.rail, styles.railDone, { right: undefined, width: `${fill * 100}%` }]} />
        {checkpoints.map((c, i) => (
          <View key={c.day} style={[styles.node, c.state === 'done' && styles.done, c.state === 'past' && styles.past, i === nextIdx && styles.next]}>
            {c.state === 'done' ? <Check size={12} color={colors.onAccent} strokeWidth={3} /> : null}
          </View>
        ))}
      </View>
      <View style={styles.labels}>
        {checkpoints.map((c, i) => (
          <Text key={c.day} variant="caption" color={i === nextIdx ? 'accent' : c.state === 'upcoming' ? 'muted' : 'secondary'} tabular style={styles.label}>
            {c.day}
          </Text>
        ))}
      </View>
    </View>
  );
}

const useStyles = makeStyles((t) => ({
  track: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', height: NODE + 4 },
  rail: { position: 'absolute', left: NODE / 2, right: NODE / 2, height: 2, backgroundColor: t.colors.border },
  railDone: { backgroundColor: t.colors.accent },
  node: { width: NODE, height: NODE, borderRadius: NODE / 2, borderWidth: 1.5, borderColor: t.colors.borderStrong, backgroundColor: t.colors.surface, alignItems: 'center', justifyContent: 'center' },
  done: { backgroundColor: t.colors.accent, borderColor: t.colors.accent },
  past: { backgroundColor: t.colors.surfaceSecondary },
  next: { borderColor: t.colors.accentForeground, borderWidth: 3 },
  labels: { flexDirection: 'row', justifyContent: 'space-between', marginTop: t.spacing.xs },
  label: { width: NODE + 8, marginHorizontal: -4, textAlign: 'center' },
}));
