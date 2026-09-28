import type { ViewStyle } from 'react-native';

import type { ColorScheme } from './typography';

/**
 * Dark mode uses surface contrast and borders instead of shadows.
 * Light mode gets a very soft shadow on elevated surfaces only.
 */
export function elevation(scheme: ColorScheme, level: 0 | 1 | 2): ViewStyle {
  if (scheme === 'dark' || level === 0) return {};
  return {
    shadowColor: '#0B0D10',
    shadowOpacity: level === 1 ? 0.04 : 0.08,
    shadowRadius: level === 1 ? 8 : 18,
    shadowOffset: { width: 0, height: level === 1 ? 2 : 6 },
    elevation: level === 1 ? 1 : 4,
  };
}
