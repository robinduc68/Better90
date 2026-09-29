import { router, useLocalSearchParams } from 'expo-router';
import { Plus, Target, Utensils, X } from 'lucide-react-native';
import { useMemo, useState } from 'react';
import { View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { MealIllustration } from '@/assets/illustrations';
import {
  AppHeader,
  AppScreen,
  Button,
  Card,
  DateStrip,
  IconBadge,
  IconButton,
  makeStyles,
  PressableScale,
  ProgressBar,
  SectionHeader,
  SegmentedControl,
  Text,
  useTheme,
} from '@/design-system';
import { addDays, formatShortDate, MEAL_TYPES, nutritionTotals, WEEKDAY_LETTER, weekday, type ISODate, type Meal, type MealType } from '@/domain';
import { logProtein } from '@/features/today/actions';
import { AmountLogSheet } from '@/features/today/sheets/AmountLogSheet';
import { useTodayDate } from '@/hooks';
import { newId } from '@/lib/id';
import { useAppStore } from '@/store';

import { captureMealPhoto } from './actions';
import { AddMealSheet, type AddMealChoice } from './components/AddMealSheet';
import { GoalsSheet } from './components/GoalsSheet';
import { MacroBar } from './components/MacroBar';
import { MealRow } from './components/MealRow';
import { useNutritionDay, weekStripDays } from './useNutritionDay';

type Tab = 'overview' | 'meals' | 'analysis';
const time = (iso: string) => new Date(iso).toTimeString().slice(0, 5);

export function NutritionScreen() {
  const styles = useStyles();
  const today = useTodayDate();
  const params = useLocalSearchParams<{ date?: string }>();
  const [date, setDate] = useState<ISODate>(params.date && params.date <= today ? params.date : today);
  const [tab, setTab] = useState<Tab>('overview');
  const [addOpen, setAddOpen] = useState(false);
  const [addType, setAddType] = useState<MealType | undefined>(undefined);
  const [proteinOpen, setProteinOpen] = useState(false);
  const [goalsOpen, setGoalsOpen] = useState(false);
  const day = useNutritionDay(date);
  const allLogs = useAppStore((s) => s.proteinLogs);
  const allMeals = useAppStore((s) => s.meals);
  const removeProteinLog = useAppStore((s) => s.removeProteinLog);
  const journeyStart = useAppStore((s) => s.journey?.startDate);

  const strip = useMemo(
    () => weekStripDays(today, (d) => day.targets.proteinG > 0 && nutritionTotals(d, allLogs, allMeals).proteinG >= day.targets.proteinG, journeyStart),
    [today, allLogs, allMeals, day.targets.proteinG, journeyStart],
  );

  const openMeal = (m: Meal) => router.push({ pathname: '/nutrition/meal', params: { id: m.id } });

  const choose = async (choice: AddMealChoice) => {
    setAddOpen(false);
    if (choice === 'quick_protein') return setProteinOpen(true);
    if (choice === 'manual') return router.push({ pathname: '/nutrition/meal', params: { date, type: addType ?? '' } });
    const mealId = newId();
    const photoUri = await captureMealPhoto(choice, mealId);
    if (photoUri) router.push({ pathname: '/nutrition/meal', params: { date, type: addType ?? '', mealId, photoUri, analyze: '1' } });
  };

  const openAdd = (type?: MealType) => {
    setAddType(type);
    setAddOpen(true);
  };

  return (
    <AppScreen header={<AppHeader title="Nutrition" subtitle={date === today ? 'Today' : formatShortDate(date)} trailing={<IconButton icon={Target} onPress={() => setGoalsOpen(true)} accessibilityLabel="Nutrition goals" />} />}>
      <DateStrip days={strip} selected={date} onSelect={setDate} />
      <View style={styles.tabs}>
        <SegmentedControl
          options={[
            { value: 'overview', label: 'Overview' },
            { value: 'meals', label: 'Meals' },
            { value: 'analysis', label: 'Analysis' },
          ]}
          value={tab}
          onChange={setTab}
          accessibilityLabel="Nutrition view"
        />
      </View>

      {tab === 'overview' ? (
        <Overview day={day} onAdd={() => openAdd()} onMeal={openMeal} onQuickProtein={() => setProteinOpen(true)} onRemoveQuick={removeProteinLog} />
      ) : tab === 'meals' ? (
        <MealsTab day={day} onAdd={openAdd} onMeal={openMeal} onRemoveQuick={removeProteinLog} />
      ) : (
        <Analysis today={today} target={day.targets.proteinG} />
      )}

      <AddMealSheet visible={addOpen} onClose={() => setAddOpen(false)} onChoose={(c) => void choose(c)} />
      <AmountLogSheet
        visible={proteinOpen}
        onClose={() => setProteinOpen(false)}
        title="Quick protein"
        summary={`${Math.round(day.totals.proteinG)} / ${day.targets.proteinG} g today`}
        progress={day.targets.proteinG ? day.totals.proteinG / day.targets.proteinG : 0}
        unit="g"
        presets={[10, 20, 30, 40]}
        formatPreset={(n) => `+${n}g`}
        onAdd={(n) => logProtein(date, n)}
        entries={day.quickLogs.map((l) => ({ id: l.id, label: `${l.grams} g`, time: time(l.loggedAt) })).reverse()}
        onRemove={removeProteinLog}
        maxCustom={300}
      />
      <GoalsSheet visible={goalsOpen} onClose={() => setGoalsOpen(false)} />
    </AppScreen>
  );
}

type Day = ReturnType<typeof useNutritionDay>;

function Overview({ day, onAdd, onMeal, onQuickProtein, onRemoveQuick }: { day: Day; onAdd: () => void; onMeal: (m: Meal) => void; onQuickProtein: () => void; onRemoveQuick: (id: string) => void }) {
  const styles = useStyles();
  const { totals, targets } = day;
  const pct = targets.proteinG ? Math.round((totals.proteinG / targets.proteinG) * 100) : 0;
  return (
    <View>
      <Card variant="elevated" style={styles.hero}>
        <View style={styles.heroArt} pointerEvents="none">
          <MealIllustration variant="bowl" size={168} />
        </View>
        <Text variant="label" color="accent">
          Protein
        </Text>
        <View style={styles.heroValue}>
          <Text variant="metricXL">{Math.round(totals.proteinG)}</Text>
          <Text variant="h3" color="muted" tabular>
            {' '}/ {targets.proteinG}g
          </Text>
        </View>
        <Text variant="smallMedium" color="secondary" tabular>
          {pct}% of today’s target
        </Text>
        <ProgressBar value={targets.proteinG ? totals.proteinG / targets.proteinG : 0} height={8} style={styles.heroBar} />
        <Text variant="caption" color="muted" tabular style={styles.kcal}>
          {Math.round(totals.calories).toLocaleString('en-US')} kcal logged{targets.calories ? ` / ${targets.calories.toLocaleString('en-US')}` : ''}
        </Text>
      </Card>

      <Card style={styles.macros}>
        <MacroBar label="Protein" value={totals.proteinG} target={targets.proteinG} unit="g" tone="accent" prominent />
        <MacroBar label="Carbs" value={totals.carbsG} target={targets.carbsG} unit="g" tone="activity" />
        <MacroBar label="Fat" value={totals.fatG} target={targets.fatG} unit="g" tone="sleep" />
        {targets.calories ? <MacroBar label="Calories" value={totals.calories} target={targets.calories} unit=" kcal" tone="water" /> : null}
      </Card>

      <View style={styles.mealsHead}>
        <Text variant="label" color="muted">
          Meals
        </Text>
        <Button label="Add meal" icon={Plus} variant="dark" size="sm" onPress={onAdd} />
      </View>
      {day.meals.length === 0 && day.quickLogs.length === 0 ? (
        <Card variant="flat" style={styles.empty}>
          <MealIllustration variant="breakfast" size={72} />
          <View style={styles.flex}>
            <Text variant="bodyMedium">Nothing logged yet</Text>
            <Text variant="caption" color="muted">
              Snap a photo of your plate, enter it manually, or add quick protein.
            </Text>
          </View>
        </Card>
      ) : (
        <Card padding="md">
          {day.meals.map((m, i) => (
            <Animated.View key={m.id} entering={FadeInDown.duration(250)} style={i > 0 && styles.sep}>
              <MealRow meal={m} onPress={onMeal} />
            </Animated.View>
          ))}
          <QuickRows logs={day.quickLogs} onRemove={onRemoveQuick} separated={day.meals.length > 0} />
        </Card>
      )}
      <Button label="Quick protein" icon={Utensils} variant="ghost" size="md" onPress={onQuickProtein} style={styles.quick} />
    </View>
  );
}

function QuickRows({ logs, onRemove, separated }: { logs: Day['quickLogs']; onRemove: (id: string) => void; separated: boolean }) {
  const styles = useStyles();
  if (logs.length === 0) return null;
  return (
    <View style={separated && styles.sep}>
      {logs.map((l) => (
        <View key={l.id} style={styles.quickRow}>
          <IconBadge icon={Utensils} tone="activity" size="sm" />
          <Text variant="smallMedium" style={styles.flex}>
            Quick protein
          </Text>
          <Text variant="caption" color="muted" tabular>
            {time(l.loggedAt)}
          </Text>
          <Text variant="smallMedium" color="accent" tabular>
            {l.grams}g
          </Text>
          <IconButton icon={X} onPress={() => onRemove(l.id)} accessibilityLabel={`Remove ${l.grams} grams of protein`} />
        </View>
      ))}
    </View>
  );
}

function MealsTab({ day, onAdd, onMeal, onRemoveQuick }: { day: Day; onAdd: (t: MealType) => void; onMeal: (m: Meal) => void; onRemoveQuick: (id: string) => void }) {
  const styles = useStyles();
  const { colors } = useTheme();
  return (
    <View>
      {MEAL_TYPES.map(({ key, label }) => {
        const meals = day.meals.filter((m) => m.mealType === key);
        const kcal = meals.reduce((s, m) => s + (m.calories ?? 0), 0);
        return (
          <View key={key}>
            <SectionHeader title={label} trailing={meals.length ? `${Math.round(kcal)} kcal` : undefined} />
            <Card padding="md">
              {meals.map((m, i) => (
                <View key={m.id} style={i > 0 && styles.sep}>
                  <MealRow meal={m} onPress={onMeal} />
                </View>
              ))}
              <PressableScale onPress={() => onAdd(key)} pressedScale={1} pressedOpacity={0.7} style={[styles.addRow, meals.length > 0 && styles.sep]} accessibilityLabel={`Add ${label.toLowerCase()}`}>
                <Plus size={18} color={colors.textSecondary} />
                <Text variant="smallMedium" color="secondary">
                  Add {label.toLowerCase()}
                </Text>
              </PressableScale>
            </Card>
          </View>
        );
      })}
      {day.quickLogs.length > 0 ? (
        <>
          <SectionHeader title="Quick protein" />
          <Card padding="md">
            <QuickRows logs={day.quickLogs} onRemove={onRemoveQuick} separated={false} />
          </Card>
        </>
      ) : null}
    </View>
  );
}

function Analysis({ today, target }: { today: ISODate; target: number }) {
  const styles = useStyles();
  const logs = useAppStore((s) => s.proteinLogs);
  const meals = useAppStore((s) => s.meals);
  const days = useMemo(() => Array.from({ length: 7 }, (_, i) => addDays(today, i - 6)).map((d) => ({ date: d, ...nutritionTotals(d, logs, meals) })), [today, logs, meals]);
  const max = Math.max(target, ...days.map((d) => d.proteinG), 1);
  const hit = days.filter((d) => target > 0 && d.proteinG >= target).length;
  const avg = days.reduce((s, d) => s + d.proteinG, 0) / days.length;
  const mealDays = days.filter((d) => d.mealCount > 0);
  const avgKcal = mealDays.length ? mealDays.reduce((s, d) => s + d.calories, 0) / mealDays.length : null;
  return (
    <View>
      <Card variant="elevated">
        <Text variant="label" color="muted">
          Protein · last 7 days
        </Text>
        <View style={styles.chart} accessible accessibilityLabel={`Protein target reached on ${hit} of 7 days, average ${Math.round(avg)} grams`}>
          <View style={[styles.targetLine, { bottom: (target / max) * 120 }]} />
          {days.map((d) => (
            <View key={d.date} style={styles.barCol}>
              <View style={[styles.bar, { height: Math.max(3, (d.proteinG / max) * 120) }, d.proteinG >= target && target > 0 ? styles.barHit : null]} />
              <Text variant="caption" color={d.date === today ? 'primary' : 'muted'}>
                {WEEKDAY_LETTER[weekday(d.date)]}
              </Text>
            </View>
          ))}
        </View>
        <Text variant="caption" color="muted">
          Line = {target} g target
        </Text>
      </Card>
      <View style={styles.stats}>
        <Card variant="flat" padding="md" style={styles.stat}>
          <Text variant="metricM">{hit}/7</Text>
          <Text variant="caption" color="muted">
            days protein target hit
          </Text>
        </Card>
        <Card variant="flat" padding="md" style={styles.stat}>
          <Text variant="metricM">{Math.round(avg)}g</Text>
          <Text variant="caption" color="muted">
            average protein
          </Text>
        </Card>
      </View>
      <Card variant="flat" padding="md" style={styles.kcalCard}>
        <Text variant="metricS">{avgKcal !== null ? `${Math.round(avgKcal).toLocaleString('en-US')} kcal` : '—'}</Text>
        <Text variant="caption" color="muted">
          average on days with logged meals. Photo estimates are approximate.
        </Text>
      </Card>
    </View>
  );
}

const useStyles = makeStyles((t) => ({
  flex: { flex: 1 },
  tabs: { marginTop: t.spacing.md, marginBottom: t.spacing.md },
  hero: { overflow: 'hidden', minHeight: 188 },
  heroArt: { position: 'absolute', right: -36, top: -22 },
  heroValue: { flexDirection: 'row', alignItems: 'baseline', marginTop: t.spacing.xs },
  heroBar: { marginTop: t.spacing.md, maxWidth: '62%' },
  kcal: { marginTop: t.spacing.sm },
  macros: { marginTop: t.spacing.sm, gap: t.spacing.md },
  mealsHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: t.spacing['2xl'], marginBottom: t.spacing.sm },
  empty: { flexDirection: 'row', alignItems: 'center', gap: t.spacing.md },
  sep: { borderTopWidth: 1, borderTopColor: t.colors.border },
  quickRow: { flexDirection: 'row', alignItems: 'center', gap: t.spacing.sm, minHeight: 52 },
  quick: { alignSelf: 'center', marginTop: t.spacing.sm },
  addRow: { flexDirection: 'row', alignItems: 'center', gap: t.spacing.xs, minHeight: 48 },
  chart: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', height: 150, marginTop: t.spacing.md, marginBottom: t.spacing.xs, paddingBottom: 22 },
  targetLine: { position: 'absolute', left: 0, right: 0, height: 1, borderStyle: 'dashed', borderTopWidth: 1, borderColor: t.colors.borderStrong, marginBottom: 22 },
  barCol: { alignItems: 'center', gap: t.spacing.xxs, flex: 1 },
  bar: { width: 18, borderRadius: 6, backgroundColor: t.colors.accentSubtle },
  barHit: { backgroundColor: t.colors.accent },
  stats: { flexDirection: 'row', gap: t.spacing.sm, marginTop: t.spacing.sm },
  stat: { flex: 1, gap: 2 },
  kcalCard: { marginTop: t.spacing.sm, gap: 2 },
}));
