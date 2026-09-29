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
    shadowOpacity: level === 1 ? 0.035 : 0.07,
    shadowRadius: level === 1 ? 6 : 16,
    shadowOffset: { width: 0, height: level === 1 ? 1 : 6 },
    elevation: level === 1 ? 1 : 3,
  };
}
