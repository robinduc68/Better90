import { useLocalSearchParams } from 'expo-router';
import { Droplets, Pencil, X } from 'lucide-react-native';
import { useMemo, useState } from 'react';
import { View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { GlassDot, WaterGlass } from '@/assets/illustrations';
import {
  AnimatedNumber,
  AppHeader,
  AppScreen,
  BottomSheet,
  Button,
  Card,
  DateStrip,
  IconBadge,
  IconButton,
  makeStyles,
  NumericInput,
  PressableScale,
  SectionHeader,
  Text,
  useTheme,
} from '@/design-system';
import { formatShortDate, type ISODate } from '@/domain';
import { weekStripDays } from '@/features/nutrition/useNutritionDay';
import { logWater } from '@/features/today/actions';
import { useTodayDate } from '@/hooks';
import { useAppStore } from '@/store';

const GLASS_ML = 250;
const time = (iso: string) => new Date(iso).toTimeString().slice(0, 5);

export function WaterScreen() {
  const styles = useStyles();
  const { colors } = useTheme();
  const today = useTodayDate();
  const params = useLocalSearchParams<{ date?: string }>();
  const [date, setDate] = useState<ISODate>(params.date && params.date <= today ? params.date : today);
  const waterLogs = useAppStore((s) => s.waterLogs);
  const target = useAppStore((s) => s.journey?.waterTargetMl ?? 2500);
  const start = useAppStore((s) => s.journey?.startDate);
  const removeWaterLog = useAppStore((s) => s.removeWaterLog);
  const updateWaterLog = useAppStore((s) => s.updateWaterLog);
  const [editing, setEditing] = useState<{ id: string; ml: number | null } | null>(null);

  const logs = useMemo(() => waterLogs.filter((l) => l.date === date).sort((a, b) => b.loggedAt.localeCompare(a.loggedAt)), [waterLogs, date]);
  const total = logs.reduce((s, l) => s + l.ml, 0);
  const strip = useMemo(() => {
    const totalFor = (d: ISODate) => waterLogs.filter((l) => l.date === d).reduce((s, l) => s + l.ml, 0);
    return weekStripDays(today, (d) => totalFor(d) >= target, start);
  }, [today, waterLogs, target, start]);
  const glasses = Math.max(1, Math.ceil(target / GLASS_ML));
  const filled = Math.min(glasses, Math.floor(total / GLASS_ML));
  const pct = target ? Math.round((total / target) * 100) : 0;

  return (
    <AppScreen header={<AppHeader title="Water" subtitle={date === today ? 'Today' : formatShortDate(date)} />}>
      <DateStrip days={strip} selected={date} onSelect={setDate} tone="water" />

      <Card variant="elevated" style={styles.hero}>
        <View style={styles.heroText}>
          <Text variant="label" style={styles.waterLabel}>
            Hydration
          </Text>
          <AnimatedNumber value={total} format={(v) => Math.round(v).toLocaleString('en-US')} variant="metricXL" style={styles.value} />
          <Text variant="bodyMedium" color="secondary" tabular>
            of {target.toLocaleString('en-US')} ml
          </Text>
          <Text variant="smallMedium" style={styles.waterLabel} tabular>
            {total >= target ? 'Target reached' : `${pct}% · ${Math.max(0, target - total).toLocaleString('en-US')} ml to go`}
          </Text>
        </View>
        <WaterGlass fill={target ? total / target : 0} height={176} />
      </Card>

      <View style={styles.glasses} accessible accessibilityLabel={`${filled} of ${glasses} glasses`}>
        {Array.from({ length: glasses }, (_, i) => (
          <GlassDot key={i} filled={i < filled} />
        ))}
      </View>

      <SectionHeader title="Quick add" />
      <View style={styles.quick}>
        {[250, 500, 1000].map((ml) => (
          <PressableScale key={ml} onPress={() => logWater(date, ml)} style={styles.quickBtn} accessibilityLabel={`Add ${ml} millilitres`}>
            <Droplets size={18} color={colors.tones.water.fg} />
            <Text variant="bodySemibold" style={styles.waterLabel} tabular>
              +{ml >= 1000 ? `${ml / 1000} L` : `${ml} ml`}
            </Text>
          </PressableScale>
        ))}
      </View>

      <SectionHeader title={date === today ? 'Today' : formatShortDate(date)} trailing={logs.length ? `${logs.length} entries` : undefined} />
      {logs.length === 0 ? (
        <Text variant="small" color="muted">
          No water logged yet. A glass is a good start.
        </Text>
      ) : (
        <Card padding="md">
          {logs.map((l, i) => (
            <Animated.View key={l.id} entering={FadeInDown.duration(220)} style={[styles.logRow, i > 0 && styles.sep]}>
              <IconBadge icon={Droplets} tone="water" size="sm" />
              <Text variant="smallMedium" color="muted" tabular style={styles.time}>
                {time(l.loggedAt)}
              </Text>
              <Text variant="bodySemibold" tabular style={styles.flex}>
                {l.ml} ml
              </Text>
              <IconButton icon={Pencil} onPress={() => setEditing({ id: l.id, ml: l.ml })} accessibilityLabel={`Edit ${l.ml} millilitres at ${time(l.loggedAt)}`} />
              <IconButton icon={X} onPress={() => removeWaterLog(l.id)} accessibilityLabel={`Delete ${l.ml} millilitres at ${time(l.loggedAt)}`} />
            </Animated.View>
          ))}
        </Card>
      )}

      <BottomSheet
        visible={!!editing}
        onClose={() => setEditing(null)}
        title="Edit entry"
        footer={
          <Button
            label="Save"
            disabled={!editing?.ml || editing.ml <= 0 || editing.ml > 3000}
            onPress={() => {
              if (editing?.ml) updateWaterLog(editing.id, editing.ml);
              setEditing(null);
            }}
          />
        }
      >
        {editing ? (
          <NumericInput value={editing.ml} onChangeValue={(v) => setEditing({ ...editing, ml: v })} unit="ml" decimals={false} size="lg" autoFocus accessibilityLabel="Amount in millilitres" />
        ) : null}
      </BottomSheet>
    </AppScreen>
  );
}

const useStyles = makeStyles((t) => ({
  flex: { flex: 1 },
  hero: { flexDirection: 'row', alignItems: 'center', marginTop: t.spacing.lg, overflow: 'hidden' },
  heroText: { flex: 1, gap: t.spacing.xxs },
  waterLabel: { color: t.colors.tones.water.fg },
  value: { marginTop: t.spacing.xs },
  glasses: { flexDirection: 'row', flexWrap: 'wrap', gap: t.spacing.sm, justifyContent: 'center', marginTop: t.spacing.lg },
  quick: { flexDirection: 'row', gap: t.spacing.xs },
  quickBtn: {
    flex: 1,
    minHeight: 52,
    borderRadius: t.radius.lg,
    backgroundColor: t.colors.tones.water.bg,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: t.spacing.xs,
  },
  logRow: { flexDirection: 'row', alignItems: 'center', gap: t.spacing.sm, minHeight: 52 },
  sep: { borderTopWidth: 1, borderTopColor: t.colors.border },
  time: { width: 48 },
}));
