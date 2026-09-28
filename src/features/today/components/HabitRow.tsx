import { View } from 'react-native';

import { Checkmark, Chip, makeStyles, PressableScale, ProgressRing, Text } from '@/design-system';
import { habitValueLabel } from '@/domain';

import type { HabitItem } from '../useDayModel';

interface HabitRowProps {
  item: HabitItem;
  onToggle: () => void;
  onOpen: () => void;
}

/**
 * Clean row, not a card. Boolean habits complete in one tap on the check;
 * checklist routines open their steps from the row; duration/count habits
 * open quick-add from the row.
 */
export function HabitRow({ item, onToggle, onOpen }: HabitRowProps) {
  const styles = useStyles();
  const { habit, log, steps, tags, done, progress } = item;
  const isBoolean = habit.kind === 'boolean';
  const stepsDone = steps.filter((s) => log?.stepsDone.includes(s.id)).length;

  const subtitle = isBoolean
    ? steps.length > 0
      ? `${stepsDone} / ${steps.length} steps`
      : done
        ? 'Done'
        : 'Not done'
    : habitValueLabel(habit, log);

  const rowPress = isBoolean && steps.length === 0 ? onToggle : onOpen;

  return (
    <View style={styles.row}>
      <PressableScale
        onPress={rowPress}
        pressedScale={1}
        pressedOpacity={0.7}
        style={styles.main}
        accessibilityRole={isBoolean && steps.length === 0 ? 'checkbox' : 'button'}
        accessibilityState={isBoolean && steps.length === 0 ? { checked: done } : undefined}
        accessibilityLabel={`${habit.name}, ${subtitle}${done ? ', complete' : ''}`}
        accessibilityHint={isBoolean && steps.length === 0 ? 'Double tap to toggle' : 'Opens details'}
      >
        <View style={styles.body}>
          <Text variant="bodyMedium" numberOfLines={1}>
            {habit.name}
          </Text>
          <View style={styles.meta}>
            <Text variant="caption" color={done ? 'accent' : 'muted'} tabular>
              {subtitle}
            </Text>
            {tags.map((tag) => (
              <Chip key={tag} label={tag} tone="info" />
            ))}
          </View>
        </View>
      </PressableScale>
      {isBoolean ? (
        <PressableScale
          onPress={onToggle}
          hitSlop={8}
          style={styles.trailing}
          accessibilityRole="checkbox"
          accessibilityState={{ checked: done }}
          accessibilityLabel={`Mark ${habit.name} ${done ? 'not done' : 'done'}`}
        >
          <Checkmark checked={done} partial={stepsDone > 0} />
        </PressableScale>
      ) : (
        <PressableScale onPress={onOpen} hitSlop={8} style={styles.trailing} accessibilityLabel={`Log ${habit.name}`}>
          {done ? (
            <Checkmark checked />
          ) : (
            <ProgressRing value={progress} size={28} strokeWidth={3} />
          )}
        </PressableScale>
      )}
    </View>
  );
}

const useStyles = makeStyles((t) => ({
  row: { flexDirection: 'row', alignItems: 'center', minHeight: t.layout.rowHeight },
  main: { flex: 1, minHeight: t.layout.rowHeight, justifyContent: 'center', paddingLeft: t.spacing.md, paddingVertical: t.spacing.xs },
  body: { gap: 3 },
  meta: { flexDirection: 'row', alignItems: 'center', gap: t.spacing.xs, flexWrap: 'wrap' },
  trailing: { width: 60, minHeight: t.layout.rowHeight, alignItems: 'center', justifyContent: 'center' },
}));
