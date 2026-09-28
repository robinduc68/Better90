import { zodResolver } from '@hookform/resolvers/zod';
import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { View } from 'react-native';
import { z } from 'zod';

import { AppHeader, AppScreen, Button, makeStyles, NumericInput, SegmentedControl, Text, toast } from '@/design-system';
import { activeCheckpoint, addDays, formatDayDate, journeyProgress, todayISO } from '@/domain';
import { newId } from '@/lib/id';
import { useAppStore } from '@/store';

import { MEASURES, type MeasureKey } from './useProgressModel';

const range = (min: number, max: number, label: string) =>
  z.number().min(min, `${label} looks too low`).max(max, `${label} looks too high`).nullable();

const schema = z
  .object({
    weightKg: range(20, 400, 'Weight'),
    waistCm: range(30, 250, 'Waist'),
    chestCm: range(40, 250, 'Chest'),
    leftArmCm: range(10, 80, 'Arm'),
    rightArmCm: range(10, 80, 'Arm'),
    bodyFatPct: range(2, 70, 'Body fat'),
  })
  .refine((v) => Object.values(v).some((x) => x !== null), { message: 'Add at least one measurement', path: ['weightKg'] });

type Values = z.infer<typeof schema>;

export function MeasurementScreen() {
  const styles = useStyles();
  const journey = useAppStore((s) => s.journey);
  const measurements = useAppStore((s) => s.measurements);
  const saveMeasurement = useAppStore((s) => s.saveMeasurement);
  const today = todayISO();
  const [dateOffset, setDateOffset] = useState(0);
  const date = addDays(today, dateOffset);
  const existing = measurements.find((m) => m.date === date);
  const last = useMemo(() => [...measurements].filter((m) => m.date <= date).sort((a, b) => b.date.localeCompare(a.date))[0], [measurements, date]);

  const defaults: Values = {
    weightKg: existing?.weightKg ?? last?.weightKg ?? null,
    waistCm: existing?.waistCm ?? last?.waistCm ?? null,
    chestCm: existing?.chestCm ?? last?.chestCm ?? null,
    leftArmCm: existing?.leftArmCm ?? last?.leftArmCm ?? null,
    rightArmCm: existing?.rightArmCm ?? last?.rightArmCm ?? null,
    bodyFatPct: existing?.bodyFatPct ?? last?.bodyFatPct ?? null,
  };
  const form = useForm<Values>({ resolver: zodResolver(schema), values: defaults, mode: 'onBlur' });

  const checkpoint = journey ? activeCheckpoint(journey.durationDays, journeyProgress(journey, date).dayNumber) : null;

  const submit = form.handleSubmit((v) => {
    saveMeasurement({ id: existing?.id ?? newId(), date, ...v });
    toast.show('Measurements saved');
    router.back();
  });

  return (
    <AppScreen
      keyboardAware
      header={<AppHeader title="Measurements" subtitle={formatDayDate(date)} leading="close" />}
      footer={<Button label={existing ? 'Update' : 'Save'} onPress={submit} />}
    >
      <SegmentedControl
        options={[
          { value: 0, label: 'Today' },
          { value: -1, label: 'Yesterday' },
        ]}
        value={dateOffset}
        onChange={setDateOffset}
        accessibilityLabel="Date"
      />
      <Text variant="small" color="muted" style={styles.intro}>
        {checkpoint ? `Checkpoint · Day ${checkpoint}. ` : ''}
        {last ? 'Prefilled with your last values — change what moved.' : 'Add what you like. Everything is optional and private.'}
      </Text>
      <View style={styles.grid}>
        {MEASURES.map((m) => (
          <Field key={m.key} name={m.key} label={m.label} unit={m.unit} form={form} />
        ))}
      </View>
    </AppScreen>
  );
}

function Field({ name, label, unit, form }: { name: MeasureKey; label: string; unit: string; form: ReturnType<typeof useForm<Values>> }) {
  const styles = useStyles();
  return (
    <Controller
      control={form.control}
      name={name}
      render={({ field, fieldState }) => (
        <View style={styles.field}>
          <Text variant="smallMedium" color="secondary">
            {label}
          </Text>
          <NumericInput value={field.value} onChangeValue={field.onChange} onBlur={field.onBlur} unit={unit} size="lg" placeholder="—" invalid={!!fieldState.error} accessibilityLabel={`${label} in ${unit}`} />
          {fieldState.error ? (
            <Text variant="caption" color="danger">
              {fieldState.error.message}
            </Text>
          ) : null}
        </View>
      )}
    />
  );
}

const useStyles = makeStyles((t) => ({
  intro: { marginTop: t.spacing.md, marginBottom: t.spacing.lg },
  grid: { flexDirection: 'row', flexWrap: 'wrap', rowGap: t.spacing.md, columnGap: t.spacing.sm },
  field: { width: '48%', flexGrow: 1, gap: t.spacing.xs },
}));
