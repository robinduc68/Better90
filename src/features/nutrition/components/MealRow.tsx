import { ChevronRight, Sparkles } from 'lucide-react-native';
import { memo } from 'react';
import { View } from 'react-native';

import { MealIllustration, mealArtFor } from '@/assets/illustrations';
import { makeStyles, PressableScale, Text, useTheme } from '@/design-system';
import { MEAL_TYPE_LABEL, type Meal } from '@/domain';
import { PrivateImage } from '@/features/media/PrivateImage';

const time = (iso: string) => new Date(iso).toTimeString().slice(0, 5);
const g = (v: number | null) => (v === null ? '—' : `${Math.round(v)}g`);

/** Meal with its photo (or a food illustration), kcal and macros. */
export const MealRow = memo(function MealRow({ meal, onPress }: { meal: Meal; onPress: (m: Meal) => void }) {
  const styles = useStyles();
  const { colors } = useTheme();
  const art = <MealIllustration variant={mealArtFor(meal.mealType)} size={64} />;
  return (
    <PressableScale onPress={() => onPress(meal)} pressedScale={1} pressedOpacity={0.75} style={styles.row} accessibilityLabel={`${meal.name}, ${meal.calories ?? 'unknown'} calories, ${meal.proteinG ?? 0} grams protein`}>
      <View style={styles.thumb}>
        {meal.photoUri || meal.photoStoragePath ? (
          <PrivateImage cacheKey={meal.id} localUri={meal.photoUri} storagePath={meal.photoStoragePath} bucket="meal-photos" style={styles.photo} accessibilityLabel={`Photo of ${meal.name}`} fallback={art} />
        ) : (
          art
        )}
      </View>
      <View style={styles.body}>
        <View style={styles.titleRow}>
          <Text variant="bodySemibold" numberOfLines={1} style={styles.flexShrink}>
            {meal.name}
          </Text>
          {meal.source === 'photo_estimate' ? <Sparkles size={13} color={colors.textMuted} accessibilityLabel="Estimated from photo" /> : null}
        </View>
        <Text variant="caption" color="muted" tabular>
          {MEAL_TYPE_LABEL[meal.mealType]} · {time(meal.loggedAt)}
          {meal.calories !== null ? ` · ${Math.round(meal.calories)} kcal` : ''}
        </Text>
        <View style={styles.macros}>
          <Text variant="caption" color="accent" tabular>
            {g(meal.proteinG)} protein
          </Text>
          <Text variant="caption" color="muted" tabular>
            {g(meal.carbsG)} carbs · {g(meal.fatG)} fat
          </Text>
        </View>
      </View>
      <ChevronRight size={18} color={colors.textMuted} />
    </PressableScale>
  );
});

const useStyles = makeStyles((t) => ({
  row: { flexDirection: 'row', alignItems: 'center', gap: t.spacing.md, paddingVertical: t.spacing.sm },
  thumb: { width: 64, height: 64, borderRadius: t.radius.lg, overflow: 'hidden', alignItems: 'center', justifyContent: 'center' },
  photo: { width: 64, height: 64, borderRadius: t.radius.lg },
  body: { flex: 1, gap: 2 },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: t.spacing.xxs },
  flexShrink: { flexShrink: 1 },
  macros: { flexDirection: 'row', gap: t.spacing.xs, flexWrap: 'wrap' },
}));
