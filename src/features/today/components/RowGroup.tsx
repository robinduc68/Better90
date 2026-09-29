import { Children, Fragment, type ReactNode } from 'react';
import { View } from 'react-native';

import { makeStyles } from '@/design-system';

/** Grouped rows separated by hairlines — lighter than stacking cards. */
export function RowGroup({ children }: { children: ReactNode }) {
  const styles = useStyles();
  const items = Children.toArray(children).filter(Boolean);
  return (
    <View style={styles.group}>
      {items.map((child, i) => (
        <Fragment key={i}>
          {i > 0 ? <View style={styles.divider} /> : null}
          {child}
        </Fragment>
      ))}
    </View>
  );
}

const useStyles = makeStyles((t) => ({
  group: { backgroundColor: t.colors.surface, borderRadius: t.radius.card, borderWidth: 1, borderColor: t.colors.border, overflow: 'hidden' },
  divider: { height: 1, backgroundColor: t.colors.border, marginLeft: t.spacing.md + 36 + t.spacing.sm },
}));
