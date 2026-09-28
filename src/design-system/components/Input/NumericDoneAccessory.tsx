import { InputAccessoryView, Keyboard, Platform, View } from 'react-native';

import { makeStyles } from '../../theme';
import { Button } from '../Button';

export const NUMERIC_ACCESSORY_ID = 'l90-numeric-done';

/** iOS number pads have no return key; this adds a "Done" bar. Render once near the root. */
export function NumericDoneAccessory() {
  const styles = useStyles();
  if (Platform.OS !== 'ios') return null;
  return (
    <InputAccessoryView nativeID={NUMERIC_ACCESSORY_ID}>
      <View style={styles.bar}>
        <Button label="Done" variant="ghost" size="sm" onPress={() => Keyboard.dismiss()} />
      </View>
    </InputAccessoryView>
  );
}

const useStyles = makeStyles((t) => ({
  bar: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingHorizontal: t.spacing.xs,
    paddingVertical: t.spacing.xxs,
    backgroundColor: t.colors.surfaceElevated,
    borderTopWidth: 1,
    borderTopColor: t.colors.border,
  },
}));
