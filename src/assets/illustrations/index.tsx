import { Image } from 'expo-image';
import { memo, useState } from 'react';
import { View, type StyleProp, type ViewStyle } from 'react-native';

import type { MealType } from '@/domain';

import { MealIllustration, type MealArt } from './nutrition/MealIllustration';

export { GlassDot, WaterGlass } from './hydration/WaterGlass';
export { MealIllustration, type MealArt } from './nutrition/MealIllustration';

/**
 * Central illustration registry. Screens reference illustrations by name,
 * never by require(). An entry can be a bundled/remote image (final artwork)
 * or an SVG renderer (current temporary artwork).
 */
type Entry = { kind: 'svg'; render: (size: number) => React.ReactNode } | { kind: 'image'; source: number | { uri: string } };

// TODO: Replace SVG entries with final Level90 artwork (kind: 'image') when available.
const REGISTRY: Record<'meal.bowl' | 'meal.breakfast' | 'meal.salmon' | 'meal.snack', Entry> = {
  'meal.bowl': { kind: 'svg', render: (s) => <MealIllustration variant="bowl" size={s} /> },
  'meal.breakfast': { kind: 'svg', render: (s) => <MealIllustration variant="breakfast" size={s} /> },
  'meal.salmon': { kind: 'svg', render: (s) => <MealIllustration variant="salmon" size={s} /> },
  'meal.snack': { kind: 'svg', render: (s) => <MealIllustration variant="snack" size={s} /> },
};

export type IllustrationName = keyof typeof REGISTRY;

const MEAL_ART: Record<MealType, IllustrationName> = {
  breakfast: 'meal.breakfast',
  lunch: 'meal.bowl',
  dinner: 'meal.salmon',
  snack: 'meal.snack',
};

export const mealIllustrationFor = (type: MealType): IllustrationName => MEAL_ART[type];
export const mealArtFor = (type: MealType): MealArt => (({ breakfast: 'breakfast', lunch: 'bowl', dinner: 'salmon', snack: 'snack' }) as const)[type];

interface AppIllustrationProps {
  name: IllustrationName;
  size: number;
  style?: StyleProp<ViewStyle>;
}

/** Fixed-size box: no layout shift while loading, and a graceful fallback on error. */
export const AppIllustration = memo(function AppIllustration({ name, size, style }: AppIllustrationProps) {
  const entry: Entry = REGISTRY[name];
  const [failed, setFailed] = useState(false);
  return (
    <View style={[{ width: size, height: size }, style]} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      {entry.kind === 'image' && !failed ? (
        <Image source={entry.source} style={{ width: size, height: size }} contentFit="contain" transition={150} onError={() => setFailed(true)} />
      ) : entry.kind === 'svg' ? (
        entry.render(size)
      ) : (
        <MealIllustration variant="bowl" size={size} />
      )}
    </View>
  );
});
