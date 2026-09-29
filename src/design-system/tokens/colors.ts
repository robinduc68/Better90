/**
 * Semantic color tokens. Components must use these names — never raw hex values.
 * Dark mode is the primary design target; light mode mirrors the same semantics.
 */
export interface ColorTokens {
  background: string;
  surface: string;
  surfaceSecondary: string;
  surfaceElevated: string;
  surfacePressed: string;
  border: string;
  borderStrong: string;
  textPrimary: string;
  textSecondary: string;
  textMuted: string;
  textDisabled: string;
  /** Fill color for primary actions and meaningful progress. */
  accent: string;
  accentPressed: string;
  /** Accent used for text, icons and thin strokes on neutral surfaces. */
  accentForeground: string;
  /** Low-emphasis accent tint (partial states, selected chips). */
  accentMuted: string;
  accentSubtle: string;
  /** Text/icon color placed on top of an accent fill. */
  onAccent: string;
  success: string;
  warning: string;
  danger: string;
  dangerMuted: string;
  info: string;
  track: string;
  overlay: string;
  tabBar: string;
  skeleton: string;
  skeletonHighlight: string;
  /** Restrained semantic hues for icons, small indicators and charts — never large fills. */
  tones: Record<Tone, { fg: string; bg: string }>;
}

export type Tone = 'brand' | 'water' | 'sleep' | 'activity' | 'positive' | 'neutral';

const accent = '#B7F34A';
const accentPressed = '#9FD82F';

export const darkColors: ColorTokens = {
  background: '#090A0C',
  surface: '#111318',
  surfaceSecondary: '#171A20',
  surfaceElevated: '#1D2027',
  surfacePressed: '#22262E',
  border: 'rgba(255,255,255,0.07)',
  borderStrong: 'rgba(255,255,255,0.12)',
  textPrimary: '#F5F7FA',
  textSecondary: '#A7ADB7',
  textMuted: '#6F7682',
  textDisabled: '#474C55',
  accent,
  accentPressed,
  accentForeground: accent,
  accentMuted: 'rgba(183,243,74,0.14)',
  accentSubtle: 'rgba(183,243,74,0.38)',
  onAccent: '#0B0E06',
  success: '#54D68B',
  warning: '#F4C95D',
  danger: '#F06B6B',
  dangerMuted: 'rgba(240,107,107,0.12)',
  info: '#6EA8FE',
  track: 'rgba(255,255,255,0.08)',
  overlay: 'rgba(0,0,0,0.62)',
  tabBar: '#0E1014',
  skeleton: '#171A20',
  skeletonHighlight: '#1F232A',
  tones: {
    brand: { fg: accent, bg: 'rgba(183,243,74,0.12)' },
    water: { fg: '#6EA8FE', bg: 'rgba(110,168,254,0.13)' },
    sleep: { fg: '#9B9BF5', bg: 'rgba(155,155,245,0.13)' },
    activity: { fg: '#F5A45B', bg: 'rgba(245,164,91,0.13)' },
    positive: { fg: '#54D68B', bg: 'rgba(84,214,139,0.12)' },
    neutral: { fg: '#A7ADB7', bg: 'rgba(255,255,255,0.06)' },
  },
};

export const lightColors: ColorTokens = {
  background: '#F6F7F8',
  surface: '#FFFFFF',
  surfaceSecondary: '#F0F2F4',
  surfaceElevated: '#FFFFFF',
  surfacePressed: '#E8EBEE',
  border: 'rgba(0,0,0,0.07)',
  borderStrong: 'rgba(0,0,0,0.12)',
  textPrimary: '#121417',
  textSecondary: '#555C66',
  textMuted: '#89909A',
  textDisabled: '#BFC4CA',
  accent,
  accentPressed,
  accentForeground: '#4A7A06',
  accentMuted: 'rgba(122,182,20,0.14)',
  accentSubtle: 'rgba(122,182,20,0.42)',
  onAccent: '#0B0E06',
  success: '#1F9D57',
  warning: '#B7861B',
  danger: '#D14545',
  dangerMuted: 'rgba(209,69,69,0.10)',
  info: '#2F6FD6',
  track: 'rgba(0,0,0,0.07)',
  overlay: 'rgba(10,12,14,0.45)',
  tabBar: '#FFFFFF',
  skeleton: '#ECEEF1',
  skeletonHighlight: '#F5F6F8',
  tones: {
    brand: { fg: '#4A7A06', bg: 'rgba(163,222,52,0.20)' },
    water: { fg: '#2F7DE1', bg: 'rgba(47,125,225,0.10)' },
    sleep: { fg: '#5B5BD6', bg: 'rgba(91,91,214,0.10)' },
    activity: { fg: '#D9691C', bg: 'rgba(232,121,43,0.11)' },
    positive: { fg: '#1F9D57', bg: 'rgba(31,157,87,0.10)' },
    neutral: { fg: '#555C66', bg: '#F0F2F4' },
  },
};

/** Fixed brand palette used by the share card, which is always rendered dark. */
export const brandColors = {
  ink: '#090A0C',
  inkRaised: '#111318',
  paper: '#F5F7FA',
  paperMuted: '#A7ADB7',
  paperFaint: '#6F7682',
  lime: accent,
  limeTrack: 'rgba(183,243,74,0.16)',
} as const;
