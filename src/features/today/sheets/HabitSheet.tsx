import { useEffect, useState } from 'react';
import { View } from 'react-native';

import { BottomSheet, Button, Checkmark, Chip, makeStyles, NumericInput, PressableScale, ProgressBar, QuickAddButton, Text } from '@/design-system';
import { habitValueLabel, type ISODate } from '@/domain';

import { setHabitValue, toggleHabit, toggleHabitStep } from '../actions';
import type { HabitItem } from '../useDayModel';

interface HabitSheetProps {
  item: HabitItem | null;
  date: ISODate;
  onClose: () => void;
}

/** Checklist for routines; quick adds for duration/count habits. */
export function HabitSheet({ item, date, onClose }: HabitSheetProps) {
  if (!item) return <BottomSheet visible={false} onClose={onClose}>{null}</BottomSheet>;
  return item.habit.kind === 'boolean' ? (
    <RoutineSheet item={item} date={date} onClose={onClose} />
  ) : (
    <ValueSheet item={item} date={date} onClose={onClose} />
  );
}

function RoutineSheet({ item, date, onClose }: { item: HabitItem; date: ISODate; onClose: () => void }) {
  const styles = useStyles();
  const { habit, log, steps, tags, done } = item;
  const ids = steps.map((s) => s.id);
  return (
    <BottomSheet
      visible
      onClose={onClose}
      title={habit.name}
      subtitle={done ? 'Complete' : `${steps.filter((s) => log?.stepsDone.includes(s.id)).length} of ${steps.length} steps`}
      footer={
        <Button
          label={done ? 'Mark not done' : 'Mark all done'}
          variant={done ? 'secondary' : 'primary'}
          onPress={() => {
            toggleHabit(habit, date);
            onClose();
          }}
        />
      }
    >
      {tags.length > 0 ? (
        <View style={styles.tags}>
          {tags.map((t) => (
            <Chip key={t} label={t} tone="info" />
          ))}
        </View>
      ) : null}
      <View>
        {steps.map((s) => {
          const checked = !!log?.stepsDone.includes(s.id);
          return (
            <PressableScale
              key={s.id}
              onPress={() => toggleHabitStep(habit, date, s.id, ids)}
              pressedScale={1}
              pressedOpacity={0.7}
              style={styles.step}
              accessibilityRole="checkbox"
              accessibilityState={{ checked }}
              accessibilityLabel={s.label}
            >
              <Text variant="bodyMedium" color={checked ? 'secondary' : 'primary'} style={styles.stepLabel}>
                {s.label}
              </Text>
              {s.tag ? <Chip label={s.tag} tone="info" /> : null}
              <Checkmark checked={checked} size={26} />
            </PressableScale>
          );
        })}
      </View>
    </BottomSheet>
  );
}

function ValueSheet({ item, date, onClose }: { item: HabitItem; date: ISODate; onClose: () => void }) {
  const styles = useStyles();
  const { habit, log } = item;
  const current = log?.value ?? 0;
  const target = habit.target ?? 1;
  const isDuration = habit.kind === 'duration';
  const unit = isDuration ? 'min' : (habit.unit ?? '');
  const presets = isDuration ? [15, 30, 60] : target >= 5000 ? [1000, 2500, 5000] : [1, 5, 10];
  const [exact, setExact] = useState<number | null>(current);
  useEffect(() => setExact(current), [current]);

  const set = (v: number) => setHabitValue(habit, date, Math.max(0, Math.round(v)));

  return (
    <BottomSheet
      visible
      onClose={onClose}
      title={habit.name}
      subtitle={habitValueLabel(habit, log)}
      footer={
        <View style={styles.footer}>
          <Button label="Reset" variant="ghost" size="md" onPress={() => set(0)} disabled={current === 0} />
          <Button
            label={current >= target ? 'Done' : 'Mark complete'}
            onPress={() => {
              if (current < target) set(target);
              onClose();
            }}
            style={styles.flex}
          />
        </View>
      }
    >
      <ProgressBar value={current / target} height={4} />
      <View style={styles.presets}>
        {presets.map((p) => (
          <QuickAddButton key={p} label={`+${p.toLocaleString('en-US')}${isDuration ? ' min' : ''}`} onPress={() => set(current + p)} style={styles.flex} />
        ))}
      </View>
      <View style={styles.exactRow}>
        <Text variant="smallMedium" color="secondary" style={styles.flex}>
          Set total
        </Text>
        <NumericInput
          value={exact}
          onChangeValue={setExact}
          decimals={false}
          unit={unit}
          style={styles.exactInput}
          returnKeyType="done"
          onSubmitEditing={() => exact !== null && set(exact)}
          onBlur={() => exact !== null && exact !== current && set(exact)}
          accessibilityLabel={`Total ${unit}`}
        />
      </View>
    </BottomSheet>
  );
}

const useStyles = makeStyles((t) => ({
  tags: { flexDirection: 'row', gap: t.spacing.xs },
  step: { flexDirection: 'row', alignItems: 'center', gap: t.spacing.sm, minHeight: 56, borderBottomWidth: 1, borderBottomColor: t.colors.border },
  stepLabel: { flex: 1 },
  presets: { flexDirection: 'row', gap: t.spacing.xs },
  flex: { flex: 1 },
  exactRow: { flexDirection: 'row', alignItems: 'center', gap: t.spacing.sm },
  exactInput: { width: 140 },
  footer: { flexDirection: 'row', gap: t.spacing.xs, alignItems: 'center' },
}));
