import { router } from 'expo-router';
import { View } from 'react-native';

import { MealIllustration, WaterGlass } from '@/assets/illustrations';
import { AnimatedNumber, Card, makeStyles, PressableScale, ProgressBar, Text, useTheme } from '@/design-system';
import { formatLiters, type ISODate } from '@/domain';

interface QuickAction {
  label: string;
  onPress: () => void;
  accessibilityLabel: string;
}

function Quick({ actions, tone }: { actions: QuickAction[]; tone: 'brand' | 'water' }) {
  const styles = useStyles();
  const { colors } = useTheme();
  return (
    <View style={styles.actions}>
      {actions.map((a) => (
        <PressableScale
          key={a.label}
          onPress={a.onPress}
          hitSlop={4}
          style={[styles.quick, { backgroundColor: tone === 'water' ? colors.tones.water.bg : colors.surfaceSecondary }]}
          accessibilityLabel={a.accessibilityLabel}
        >
          <Text variant="smallMedium" style={{ color: tone === 'water' ? colors.tones.water.fg : colors.textPrimary }} tabular numberOfLines={1}>
            {a.label}
          </Text>
        </PressableScale>
      ))}
    </View>
  );
}

/** Food, not supplements: a real-meal illustration anchors the protein target. */
export function NutritionCard({ date, proteinG, targetG, calories, actions }: { date: ISODate; proteinG: number; targetG: number; calories: number; actions: QuickAction[] }) {
  const styles = useStyles();
  const progress = targetG ? proteinG / targetG : 0;
  return (
    <Card variant="elevated" padding="none" style={styles.card}>
      <PressableScale
        onPress={() => router.push({ pathname: '/nutrition', params: { date } })}
        pressedScale={1}
        pressedOpacity={0.85}
        style={styles.body}
        accessibilityLabel={`Nutrition: ${Math.round(proteinG)} of ${targetG} grams protein, ${Math.round(progress * 100)}%`}
        accessibilityHint="Opens nutrition"
      >
        <View style={styles.artFood} pointerEvents="none">
          <MealIllustration variant="bowl" size={116} />
        </View>
        <Text variant="label" color="muted">
          Nutrition
        </Text>
        <View style={styles.valueRow}>
          <AnimatedNumber value={proteinG} format={(v) => String(Math.round(v))} variant="metricL" />
          <Text variant="bodySemibold" color="secondary">
            g
          </Text>
        </View>
        <Text variant="caption" color="secondary" tabular>
          protein / {targetG}g
        </Text>
        <ProgressBar value={progress} height={6} style={styles.bar} />
        <Text variant="caption" color="muted" tabular style={styles.meta}>
          {Math.round(progress * 100)}%{calories > 0 ? ` · ${Math.round(calories).toLocaleString('en-US')} kcal` : ''}
        </Text>
      </PressableScale>
      <Quick actions={actions} tone="brand" />
    </Card>
  );
}

export function WaterCard({ date, waterMl, targetMl, actions }: { date: ISODate; waterMl: number; targetMl: number; actions: QuickAction[] }) {
  const styles = useStyles();
  const { colors } = useTheme();
  const progress = targetMl ? waterMl / targetMl : 0;
  return (
    <Card variant="elevated" padding="none" style={styles.card}>
      <PressableScale
        onPress={() => router.push({ pathname: '/water', params: { date } })}
        pressedScale={1}
        pressedOpacity={0.85}
        style={styles.body}
        accessibilityLabel={`Water: ${formatLiters(waterMl)} of ${formatLiters(targetMl)} litres, ${Math.round(progress * 100)}%`}
        accessibilityHint="Opens water"
      >
        <View style={styles.artWater} pointerEvents="none">
          <WaterGlass fill={progress} height={104} />
        </View>
        <Text variant="label" style={{ color: colors.tones.water.fg }}>
          Water
        </Text>
        <View style={styles.valueRow}>
          <AnimatedNumber value={waterMl} format={formatLiters} variant="metricL" />
          <Text variant="bodySemibold" color="secondary">
            L
          </Text>
        </View>
        <Text variant="caption" color="secondary" tabular>
          / {formatLiters(targetMl)}L
        </Text>
        <ProgressBar value={progress} height={6} tone="water" style={styles.bar} />
        <Text variant="caption" color="muted" tabular style={styles.meta}>
          {progress >= 1 ? 'Target reached' : `${Math.round(progress * 100)}%`}
        </Text>
      </PressableScale>
      <Quick actions={actions} tone="water" />
    </Card>
  );
}

const useStyles = makeStyles((t) => ({
  card: { flex: 1, minWidth: 0, overflow: 'hidden' },
  body: { padding: t.spacing.md, paddingBottom: 0, minHeight: 168 },
  artFood: { position: 'absolute', right: -34, top: -30 },
  artWater: { position: 'absolute', right: 8, top: 10 },
  valueRow: { flexDirection: 'row', alignItems: 'baseline', marginTop: t.spacing['2xl'] },
  bar: { marginTop: t.spacing.sm },
  meta: { marginTop: t.spacing.xs },
  actions: { flexDirection: 'row', gap: t.spacing.xs, padding: t.spacing.md, paddingTop: t.spacing.sm },
  quick: { flex: 1, minHeight: 40, borderRadius: t.radius.pill, alignItems: 'center', justifyContent: 'center' },
}));
