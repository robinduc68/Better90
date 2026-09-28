import { forwardRef, useState } from 'react';
import { TextInput, View, type TextInputProps } from 'react-native';

import { makeStyles, useTheme } from '../../theme';
import { Text } from '../Text';

interface TextFieldProps extends TextInputProps {
  label?: string;
  error?: string;
  hint?: string;
}

export const TextField = forwardRef<TextInput, TextFieldProps>(function TextField(
  { label, error, hint, style, onFocus, onBlur, ...rest },
  ref,
) {
  const styles = useStyles();
  const theme = useTheme();
  const [focused, setFocused] = useState(false);
  return (
    <View style={styles.root}>
      {label ? (
        <Text variant="smallMedium" color="secondary">
          {label}
        </Text>
      ) : null}
      <TextInput
        ref={ref}
        placeholderTextColor={theme.colors.textMuted}
        onFocus={(e) => {
          setFocused(true);
          onFocus?.(e);
        }}
        onBlur={(e) => {
          setFocused(false);
          onBlur?.(e);
        }}
        accessibilityLabel={rest.accessibilityLabel ?? label}
        style={[theme.typography.body, styles.input, focused && styles.focused, !!error && styles.invalid, style]}
        {...rest}
      />
      {error ? (
        <Text variant="caption" color="danger" accessibilityLiveRegion="polite">
          {error}
        </Text>
      ) : hint ? (
        <Text variant="caption" color="muted">
          {hint}
        </Text>
      ) : null}
    </View>
  );
});

const useStyles = makeStyles((t) => ({
  root: { gap: t.spacing.xs },
  input: {
    minHeight: 52,
    borderRadius: t.radius.md,
    backgroundColor: t.colors.surfaceSecondary,
    borderWidth: 1,
    borderColor: 'transparent',
    paddingHorizontal: t.spacing.md,
    color: t.colors.textPrimary,
  },
  focused: { borderColor: t.colors.accent, backgroundColor: t.colors.surfaceElevated },
  invalid: { borderColor: t.colors.danger },
}));
