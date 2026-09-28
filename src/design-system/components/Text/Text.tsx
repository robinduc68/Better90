import { Text as RNText, type TextProps as RNTextProps, type TextStyle } from 'react-native';

import { useTheme, type Theme } from '../../theme';
import type { TypographyVariant } from '../../tokens';

export type TextColor =
  | 'primary'
  | 'secondary'
  | 'muted'
  | 'disabled'
  | 'accent'
  | 'onAccent'
  | 'success'
  | 'warning'
  | 'danger'
  | 'info';

export interface TextProps extends RNTextProps {
  variant?: TypographyVariant;
  color?: TextColor;
  align?: TextStyle['textAlign'];
  tabular?: boolean;
}

export function resolveTextColor(theme: Theme, color: TextColor): string {
  const c = theme.colors;
  switch (color) {
    case 'primary':
      return c.textPrimary;
    case 'secondary':
      return c.textSecondary;
    case 'muted':
      return c.textMuted;
    case 'disabled':
      return c.textDisabled;
    case 'accent':
      return c.accentForeground;
    case 'onAccent':
      return c.onAccent;
    case 'success':
      return c.success;
    case 'warning':
      return c.warning;
    case 'danger':
      return c.danger;
    case 'info':
      return c.info;
  }
}

const METRIC_VARIANTS: ReadonlySet<TypographyVariant> = new Set(['metricXL', 'metricL', 'metricM', 'hero', 'display', 'h1']);

export function Text({ variant = 'body', color = 'primary', align, tabular, style, maxFontSizeMultiplier, ...rest }: TextProps) {
  const theme = useTheme();
  const { tabular: variantTabular, ...variantStyle } = theme.typography[variant] as TextStyle & { tabular?: boolean };
  const useTabular = tabular ?? variantTabular ?? false;
  return (
    <RNText
      maxFontSizeMultiplier={maxFontSizeMultiplier ?? (METRIC_VARIANTS.has(variant) ? 1.25 : 1.6)}
      style={[
        variantStyle,
        { color: resolveTextColor(theme, color) },
        align ? { textAlign: align } : null,
        useTabular ? { fontVariant: ['tabular-nums'] } : null,
        style,
      ]}
      {...rest}
    />
  );
}
