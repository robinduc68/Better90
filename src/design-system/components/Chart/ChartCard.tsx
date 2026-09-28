import type { ReactNode } from 'react';
import { View } from 'react-native';

import { makeStyles } from '../../theme';
import { Card } from '../Card';
import { Text } from '../Text';

interface ChartCardProps {
  title: string;
  summary?: string;
  delta?: string;
  children: ReactNode;
}

export function ChartCard({ title, summary, delta, children }: ChartCardProps) {
  const styles = useStyles();
  return (
    <Card>
      <View style={styles.header}>
        <Text variant="label" color="muted">
          {title}
        </Text>
        {delta ? (
          <Text variant="smallMedium" color="accent" tabular>
            {delta}
          </Text>
        ) : null}
      </View>
      {summary ? (
        <Text variant="bodyMedium" color="secondary" tabular style={styles.summary}>
          {summary}
        </Text>
      ) : null}
      <View style={styles.body}>{children}</View>
    </Card>
  );
}

const useStyles = makeStyles((t) => ({
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  summary: { marginTop: t.spacing.xxs },
  body: { marginTop: t.spacing.md },
}));
