import { Controller, type FieldPath } from 'react-hook-form';
import { View } from 'react-native';

import { makeStyles, NumericInput, Stepper, Text } from '@/design-system';
import { formatDuration, formatLiters } from '@/domain';

import { StepHeader } from '../components/StepHeader';
import type { OnboardingValues } from '../schema';
import type { StepProps } from './types';

function MeasureField({ form, name, label, unit }: StepProps & { name: FieldPath<OnboardingValues>; label: string; unit: string }) {
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
          <NumericInput
            value={(field.value as number | null) ?? null}
            onChangeValue={field.onChange}
            unit={unit}
            size="lg"
            placeholder="—"
            invalid={!!fieldState.error}
            accessibilityLabel={`${label} in ${unit}`}
          />
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

export function BaselineStep({ form }: StepProps) {
  const styles = useStyles();
  return (
    <View>
      <StepHeader eyebrow="Your baseline" title="Where are you starting?" subtitle="Private to you. Skip anything you'd rather not add." />
      <View style={styles.row}>
        <MeasureField form={form} name="heightCm" label="Height" unit="cm" />
        <MeasureField form={form} name="weightKg" label="Weight" unit="kg" />
      </View>
      <Text variant="label" color="muted" style={styles.optional}>
        Optional
      </Text>
      <View style={styles.row}>
        <MeasureField form={form} name="waistCm" label="Waist" unit="cm" />
        <MeasureField form={form} name="chestCm" label="Chest" unit="cm" />
      </View>
      <View style={[styles.row, styles.rowGap]}>
        <MeasureField form={form} name="armCm" label="Arm" unit="cm" />
        <View style={styles.field} />
      </View>
    </View>
  );
}

export function TargetsStep({ form }: StepProps) {
  const styles = useStyles();
  return (
    <View>
      <StepHeader eyebrow="Daily targets" title="Your daily targets" subtitle="Starting points. Adjust anytime in Profile." />
      <View style={styles.targets}>
        <TargetBlock label="Protein">
          <Controller
            control={form.control}
            name="proteinTargetG"
            render={({ field }) => <Stepper label="Protein target" value={field.value} onChange={field.onChange} step={5} min={40} max={300} unit="g" />}
          />
        </TargetBlock>
        <TargetBlock label="Water">
          <Controller
            control={form.control}
            name="waterTargetMl"
            render={({ field }) => (
              <Stepper label="Water target" value={field.value} onChange={field.onChange} step={250} min={1000} max={5000} format={formatLiters} unit="L" />
            )}
          />
        </TargetBlock>
        <TargetBlock label="Sleep">
          <Controller
            control={form.control}
            name="sleepTargetMin"
            render={({ field }) => (
              <Stepper label="Sleep target" value={field.value} onChange={field.onChange} step={15} min={300} max={600} format={formatDuration} />
            )}
          />
        </TargetBlock>
      </View>
    </View>
  );
}

function TargetBlock({ label, children }: { label: string; children: React.ReactNode }) {
  const styles = useStyles();
  return (
    <View style={styles.target}>
      <Text variant="label" color="muted">
        {label}
      </Text>
      {children}
    </View>
  );
}

const useStyles = makeStyles((t) => ({
  row: { flexDirection: 'row', gap: t.spacing.sm },
  rowGap: { marginTop: t.spacing.md },
  field: { flex: 1, gap: t.spacing.xs },
  optional: { marginTop: t.spacing.xl, marginBottom: t.spacing.sm },
  targets: { gap: t.spacing.sm },
  target: {
    gap: t.spacing.sm,
    padding: t.spacing.md,
    borderRadius: t.radius.card,
    backgroundColor: t.colors.surface,
    borderWidth: 1,
    borderColor: t.colors.border,
  },
}));
