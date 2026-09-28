import type { TextStyle } from 'react-native';

export type ColorScheme = 'dark' | 'light';

export const fontFamily = {
  regular: 'Inter_400Regular',
  medium: 'Inter_500Medium',
  semibold: 'Inter_600SemiBold',
  bold: 'Inter_700Bold',
  extrabold: 'Inter_800ExtraBold',
} as const;

type Variant = Pick<TextStyle, 'fontFamily' | 'fontSize' | 'lineHeight' | 'letterSpacing' | 'textTransform'> & {
  tabular?: boolean;
};

/**
 * Type scale. Weight establishes hierarchy — do not bold everything.
 * Metric variants use tabular numerals so values align vertically.
 */
export const typography = {
  /** Onboarding / milestone / share-card statements. */
  hero: { fontFamily: fontFamily.extrabold, fontSize: 44, lineHeight: 50, letterSpacing: -1.4 },
  display: { fontFamily: fontFamily.extrabold, fontSize: 34, lineHeight: 40, letterSpacing: -0.8 },
  h1: { fontFamily: fontFamily.bold, fontSize: 28, lineHeight: 34, letterSpacing: -0.6 },
  h2: { fontFamily: fontFamily.bold, fontSize: 22, lineHeight: 28, letterSpacing: -0.4 },
  h3: { fontFamily: fontFamily.semibold, fontSize: 18, lineHeight: 24, letterSpacing: -0.2 },
  body: { fontFamily: fontFamily.regular, fontSize: 16, lineHeight: 22 },
  bodyMedium: { fontFamily: fontFamily.medium, fontSize: 16, lineHeight: 22 },
  bodySemibold: { fontFamily: fontFamily.semibold, fontSize: 16, lineHeight: 22 },
  small: { fontFamily: fontFamily.regular, fontSize: 14, lineHeight: 19 },
  smallMedium: { fontFamily: fontFamily.medium, fontSize: 14, lineHeight: 19 },
  caption: { fontFamily: fontFamily.medium, fontSize: 12, lineHeight: 16 },
  /** Uppercase section/overline label. */
  label: {
    fontFamily: fontFamily.semibold,
    fontSize: 12,
    lineHeight: 16,
    letterSpacing: 1.1,
    textTransform: 'uppercase',
  },
  metricXL: { fontFamily: fontFamily.bold, fontSize: 40, lineHeight: 46, letterSpacing: -1.2, tabular: true },
  metricL: { fontFamily: fontFamily.bold, fontSize: 32, lineHeight: 38, letterSpacing: -0.9, tabular: true },
  metricM: { fontFamily: fontFamily.bold, fontSize: 24, lineHeight: 30, letterSpacing: -0.5, tabular: true },
  metricS: { fontFamily: fontFamily.semibold, fontSize: 17, lineHeight: 22, letterSpacing: -0.2, tabular: true },
} satisfies Record<string, Variant>;

export type TypographyVariant = keyof typeof typography;
