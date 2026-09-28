import { forwardRef, useEffect, useState } from 'react';
import { Platform, TextInput, View, type StyleProp, type TextInputProps, type ViewStyle } from 'react-native';

import { makeStyles, useTheme } from '../../theme';
import { Text } from '../Text';
import { NUMERIC_ACCESSORY_ID } from './NumericDoneAccessory';

export interface NumericInputProps extends Omit<TextInputProps, 'value' | 'onChangeText' | 'keyboardType' | 'style'> {
  value: number | null;
  onChangeValue: (value: number | null) => void;
  unit?: string;
  decimals?: boolean;
  size?: 'md' | 'lg';
  align?: 'left' | 'center';
  style?: StyleProp<ViewStyle>;
  invalid?: boolean;
}

function toText(value: number | null): string {
  if (value === null || !Number.isFinite(value)) return '';
  return String(Math.round(value * 100) / 100);
}

/** Parses "37,5" or "37.5" — many locales use a comma decimal separator. */
export function parseNumeric(text: string, decimals: boolean): number | null {
  const normalized = text.replace(',', '.').replace(decimals ? /[^0-9.]/g : /[^0-9]/g, '');
  if (normalized === '' || normalized === '.') return null;
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : null;
}

/**
 * Numeric field with unit rendered inside the field ("65.8 kg").
 * Keeps its own text state so partial input like "37." is not lost.
 */
export const NumericInput = forwardRef<TextInput, NumericInputProps>(function NumericInput(
  { value, onChangeValue, unit, decimals = true, size = 'md', align = 'left', style, invalid, onFocus, onBlur, ...rest },
  ref,
) {
  const styles = useStyles();
  const theme = useTheme();
  const [text, setText] = useState(() => toText(value));
  const [focused, setFocused] = useState(false);

  useEffect(() => {
    if (!focused) setText(toText(value));
  }, [value, focused]);

  return (
    <View
      style={[
        styles.field,
        size === 'lg' ? styles.lg : styles.md,
        focused && styles.focused,
        invalid && styles.invalid,
        align === 'center' && styles.center,
        style,
      ]}
    >
      <TextInput
        ref={ref}
        value={text}
        onChangeText={(t) => {
          const cleaned = t.replace(',', '.');
          setText(cleaned);
          onChangeValue(parseNumeric(cleaned, decimals));
        }}
        keyboardType={decimals ? 'decimal-pad' : 'number-pad'}
        inputMode={decimals ? 'decimal' : 'numeric'}
        selectTextOnFocus
        inputAccessoryViewID={Platform.OS === 'ios' ? NUMERIC_ACCESSORY_ID : undefined}
        placeholderTextColor={theme.colors.textMuted}
        maxFontSizeMultiplier={1.3}
        onFocus={(e) => {
          setFocused(true);
          onFocus?.(e);
        }}
        onBlur={(e) => {
          setFocused(false);
          setText(toText(parseNumeric(text, decimals)));
          onBlur?.(e);
        }}
        style={[
          size === 'lg' ? theme.typography.metricM : theme.typography.metricS,
          styles.input,
          align === 'center' && { textAlign: 'center' },
          { fontVariant: ['tabular-nums'] },
        ]}
        {...rest}
      />
      {unit ? (
        <Text variant="smallMedium" color="muted" style={styles.unit}>
          {unit}
        </Text>
      ) : null}
    </View>
  );
});

const useStyles = makeStyles((t) => ({
  field: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: t.colors.surfaceSecondary,
    borderRadius: t.radius.md,
    borderWidth: 1,
    borderColor: 'transparent',
    paddingHorizontal: t.spacing.sm,
  },
  md: { minHeight: 48 },
  lg: { minHeight: 60, paddingHorizontal: t.spacing.md },
  center: { justifyContent: 'center' },
  focused: { borderColor: t.colors.accent, backgroundColor: t.colors.surfaceElevated },
  invalid: { borderColor: t.colors.danger },
  input: { flexGrow: 1, flexShrink: 1, minWidth: 24, color: t.colors.textPrimary, paddingVertical: t.spacing.xs },
  unit: { marginLeft: t.spacing.xxs },
}));
