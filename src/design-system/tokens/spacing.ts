/** 8pt-grid spacing scale. Screens must only use these values. */
export const spacing = {
  xxs: 4,
  xs: 8,
  sm: 12,
  md: 16,
  lg: 20,
  xl: 24,
  '2xl': 32,
  '3xl': 40,
  '4xl': 48,
  '5xl': 64,
} as const;

export type SpacingToken = keyof typeof spacing;

export const layout = {
  screenPadding: spacing.lg,
  screenPaddingDense: spacing.md,
  /** Minimum touch target (iOS 44, Android 48). */
  minTouch: 48,
  rowHeight: 60,
  buttonHeight: 54,
  buttonHeightSmall: 40,
  tabBarBaseHeight: 60,
} as const;
