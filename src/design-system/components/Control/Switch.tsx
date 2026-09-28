import { Switch as RNSwitch, type SwitchProps } from 'react-native';

import { useTheme } from '../../theme';

export function Switch(props: SwitchProps) {
  const { colors, scheme } = useTheme();
  const thumb = scheme === 'light' ? '#FFFFFF' : props.value ? colors.onAccent : colors.textSecondary;
  return (
    <RNSwitch
      trackColor={{ false: colors.track, true: colors.accent }}
      thumbColor={thumb}
      ios_backgroundColor={colors.track}
      {...props}
    />
  );
}
