import { View } from 'react-native';

import { makeStyles, Text } from '@/design-system';

export function StepHeader({ eyebrow, title, subtitle }: { eyebrow?: string; title: string; subtitle?: string }) {
  const styles = useStyles();
  return (
    <View style={styles.root}>
      {eyebrow ? (
        <Text variant="label" color="accent">
          {eyebrow}
        </Text>
      ) : null}
      <Text variant="h1" accessibilityRole="header">
        {title}
      </Text>
      {subtitle ? (
        <Text variant="body" color="secondary">
          {subtitle}
        </Text>
      ) : null}
    </View>
  );
}

const useStyles = makeStyles((t) => ({
  root: { gap: t.spacing.xs, marginTop: t.spacing.xl, marginBottom: t.spacing.xl },
}));
