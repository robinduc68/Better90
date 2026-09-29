import { router, useLocalSearchParams } from 'expo-router';
import { Camera, Images, Plus, Sparkles, Trash2, X } from 'lucide-react-native';
import { useEffect, useRef, useState } from 'react';
import { View } from 'react-native';

import { MealIllustration, mealArtFor } from '@/assets/illustrations';
import {
  AppHeader,
  AppScreen,
  Button,
  Card,
  Chip,
  ConfirmSheet,
  IconButton,
  makeStyles,
  NumericInput,
  SegmentedControl,
  Skeleton,
  Text,
  TextField,
  useTheme,
} from '@/design-system';
import { MEAL_TYPE_LABEL, MEAL_TYPES, mealTypeForTime, todayISO, type MealItem, type MealSource, type MealType } from '@/domain';
import { PrivateImage } from '@/features/media/PrivateImage';
import { newId } from '@/lib/id';
import { nowISO } from '@/lib/now';
import { deleteLocalPhoto } from '@/services/photos';
import { nutritionAnalysis, type MealAnalysisResult } from '@/services/nutrition';
import { useAppStore } from '@/store';

import { captureMealPhoto, deleteMeal, saveMeal } from './actions';

type Status = 'idle' | 'analyzing' | 'estimated' | 'unavailable' | 'failed';

const clampOrNull = (v: number | null, max: number) => (v === null ? null : Math.max(0, Math.min(max, v)));

/**
 * One screen for manual entry, editing, and reviewing a photo estimate.
 * Estimates are always labeled and every value stays editable.
 */
export function MealEditorScreen() {
  const styles = useStyles();
  const theme = useTheme();
  const params = useLocalSearchParams<{ id?: string; date?: string; type?: string; mealId?: string; photoUri?: string; analyze?: string }>();
  const existing = useAppStore((s) => (params.id ? s.meals.find((m) => m.id === params.id) : undefined));
  const isNew = !existing;
  const [mealId] = useState(() => existing?.id ?? params.mealId ?? newId());

  const [mealType, setMealType] = useState<MealType>(existing?.mealType ?? ((params.type as MealType) || mealTypeForTime(new Date())));
  const [name, setName] = useState(existing?.name ?? '');
  const [calories, setCalories] = useState<number | null>(existing?.calories ?? null);
  const [protein, setProtein] = useState<number | null>(existing?.proteinG ?? null);
  const [carbs, setCarbs] = useState<number | null>(existing?.carbsG ?? null);
  const [fat, setFat] = useState<number | null>(existing?.fatG ?? null);
  const [items, setItems] = useState<MealItem[]>(existing?.items ?? []);
  const [photoUri, setPhotoUri] = useState<string | null>(existing?.photoUri ?? params.photoUri ?? null);
  const [source, setSource] = useState<MealSource>(existing?.source ?? 'manual');
  const [confidence, setConfidence] = useState<number | null>(existing?.estimateConfidence ?? null);
  const [isMock, setIsMock] = useState(false);
  const [status, setStatus] = useState<Status>(existing?.source === 'photo_estimate' ? 'estimated' : 'idle');
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const applyEstimate = (r: MealAnalysisResult) => {
    setSource('photo_estimate');
    setConfidence(r.confidence ?? null);
    setIsMock(r.isMock);
    if (r.mealName) setName(r.mealName);
    setCalories(r.estimatedCalories ?? null);
    setProtein(r.estimatedProtein ?? null);
    setCarbs(r.estimatedCarbs ?? null);
    setFat(r.estimatedFat ?? null);
    setItems(
      (r.items ?? []).map((i) => ({ id: newId(), name: i.name, amount: i.estimatedAmount ?? null, calories: i.calories ?? null, proteinG: i.protein ?? null, carbsG: i.carbs ?? null, fatG: i.fat ?? null })),
    );
    setStatus('estimated');
  };

  const analyze = async (uri: string) => {
    setStatus('analyzing');
    const out = await nutritionAnalysis.analyzeMealImage(uri);
    if (out.status === 'ok') applyEstimate(out.result);
    else setStatus(out.status === 'unavailable' ? 'unavailable' : 'failed');
  };

  const started = useRef(false);
  useEffect(() => {
    if (started.current || !isNew || params.analyze !== '1' || !params.photoUri) return;
    started.current = true;
    void analyze(params.photoUri);
    // Run once for a freshly captured photo.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const addPhoto = async (src: 'camera' | 'library') => {
    const uri = await captureMealPhoto(src, mealId);
    if (!uri) return;
    setPhotoUri(uri);
    if (nutritionAnalysis.isAvailable()) void analyze(uri);
  };

  const sumItems = () => {
    const s = (k: 'calories' | 'proteinG' | 'carbsG' | 'fatG') => items.reduce((a, i) => a + (i[k] ?? 0), 0);
    setCalories(s('calories'));
    setProtein(s('proteinG'));
    setCarbs(s('carbsG'));
    setFat(s('fatG'));
  };

  const save = () => {
    if ([calories, protein, carbs, fat].every((v) => v === null) && !name.trim()) {
      setError('Add a name or at least one value.');
      return;
    }
    saveMeal(
      {
        id: mealId,
        date: existing?.date ?? params.date ?? todayISO(),
        mealType,
        name: name.trim() || MEAL_TYPE_LABEL[mealType],
        loggedAt: existing?.loggedAt ?? nowISO(),
        calories: clampOrNull(calories, 10000),
        proteinG: clampOrNull(protein, 1000),
        carbsG: clampOrNull(carbs, 1500),
        fatG: clampOrNull(fat, 500),
        items: items.filter((i) => i.name.trim()),
        photoUri,
        photoStoragePath: existing?.photoUri === photoUri ? (existing?.photoStoragePath ?? null) : null,
        source,
        estimateConfidence: confidence,
      },
      isNew,
    );
    router.back();
  };

  const cancel = () => {
    // A freshly captured photo that was never saved shouldn't linger on disk.
    if (isNew && photoUri) deleteLocalPhoto(photoUri);
    router.back();
  };

  const estimated = source === 'photo_estimate';
  const updateItem = (id: string, patch: Partial<MealItem>) => setItems((list) => list.map((i) => (i.id === id ? { ...i, ...patch } : i)));

  return (
    <AppScreen
      keyboardAware
      header={<AppHeader title={isNew ? 'Add meal' : 'Edit meal'} leading="close" onLeadingPress={cancel} />}
      footer={<Button label={estimated && isNew ? 'Confirm meal' : isNew ? 'Save meal' : 'Save changes'} onPress={save} disabled={status === 'analyzing'} />}
    >
      <View style={styles.photoWrap}>
        {photoUri || existing?.photoStoragePath ? (
          <PrivateImage cacheKey={mealId} localUri={photoUri} storagePath={existing?.photoStoragePath ?? null} bucket="meal-photos" style={styles.photo} accessibilityLabel="Meal photo" />
        ) : (
          <View style={[styles.photo, styles.photoEmpty]}>
            <MealIllustration variant={mealArtFor(mealType)} size={150} />
          </View>
        )}
        {status === 'analyzing' ? (
          <View style={styles.analyzing}>
            <Sparkles size={18} color={theme.colors.textPrimary} />
            <Text variant="bodyMedium">Estimating nutrition…</Text>
          </View>
        ) : null}
        <View style={styles.photoActions}>
          <IconButton icon={Camera} variant="surface" onPress={() => void addPhoto('camera')} accessibilityLabel="Take meal photo" />
          <IconButton icon={Images} variant="surface" onPress={() => void addPhoto('library')} accessibilityLabel="Choose meal photo" />
        </View>
      </View>

      {status === 'analyzing' ? (
        <View style={styles.skeletons}>
          <Skeleton height={20} width="60%" />
          <Skeleton height={48} />
          <Skeleton height={48} />
        </View>
      ) : null}
      {status === 'unavailable' ? (
        <Card variant="flat" style={styles.notice}>
          <Text variant="bodyMedium">Photo analysis isn’t connected yet</Text>
          <Text variant="small" color="secondary">
            Your photo is saved with the meal. Enter the values you know — even just protein is enough.
          </Text>
        </Card>
      ) : null}
      {status === 'failed' ? (
        <Card variant="flat" style={styles.notice}>
          <Text variant="bodyMedium">Couldn’t estimate this photo</Text>
          <Text variant="small" color="secondary">
            Enter the values manually, or try another photo.
          </Text>
        </Card>
      ) : null}
      {estimated ? (
        <Card variant="flat" style={styles.notice}>
          <View style={styles.row}>
            <Sparkles size={16} color={theme.colors.textSecondary} />
            <Text variant="label" color="secondary" style={styles.flex}>
              Estimated nutrition
            </Text>
            {isMock ? <Chip label="Dev mock data" tone="warning" /> : confidence !== null ? <Chip label={`${Math.round(confidence * 100)}% confidence`} /> : null}
          </View>
          <Text variant="small" color="secondary">
            AI estimate — adjust anything before saving. Values from photos are approximate.
          </Text>
        </Card>
      ) : null}

      {status !== 'analyzing' ? (
        <>
          <View style={styles.section}>
            <SegmentedControl options={MEAL_TYPES.map((m) => ({ value: m.key, label: m.label }))} value={mealType} onChange={setMealType} accessibilityLabel="Meal type" />
          </View>
          <TextField label="Meal" value={name} onChangeText={setName} placeholder={`e.g. ${mealType === 'breakfast' ? 'Oats & berries' : 'Chicken rice bowl'}`} maxLength={80} error={error ?? undefined} />
          <View style={styles.grid}>
            <Macro label="Protein" unit="g" value={protein} onChange={setProtein} emphasized />
            <Macro label="Calories" unit="kcal" value={calories} onChange={setCalories} />
            <Macro label="Carbs" unit="g" value={carbs} onChange={setCarbs} />
            <Macro label="Fat" unit="g" value={fat} onChange={setFat} />
          </View>
          <Text variant="caption" color="muted" style={styles.hint}>
            Every field is optional. Protein counts toward your daily target.
          </Text>

          <View style={styles.itemsHead}>
            <Text variant="label" color="muted">
              Items
            </Text>
            {items.length > 0 ? <Button label="Use item totals" variant="ghost" size="sm" onPress={sumItems} /> : null}
          </View>
          {items.map((it) => (
            <Card key={it.id} padding="md" style={styles.item}>
              <View style={styles.row}>
                <TextField value={it.name} onChangeText={(v) => updateItem(it.id, { name: v })} placeholder="Food" style={styles.itemName} accessibilityLabel="Food item" />
                <IconButton icon={X} onPress={() => setItems((l) => l.filter((x) => x.id !== it.id))} accessibilityLabel={`Remove ${it.name || 'item'}`} />
              </View>
              <TextField value={it.amount ?? ''} onChangeText={(v) => updateItem(it.id, { amount: v || null })} placeholder="Portion, e.g. 150 g" accessibilityLabel="Portion" />
              <View style={styles.itemMacros}>
                <NumericInput value={it.proteinG} onChangeValue={(v) => updateItem(it.id, { proteinG: v })} unit="P" placeholder="—" style={styles.flex} accessibilityLabel="Item protein grams" />
                <NumericInput value={it.carbsG} onChangeValue={(v) => updateItem(it.id, { carbsG: v })} unit="C" placeholder="—" style={styles.flex} accessibilityLabel="Item carbs grams" />
                <NumericInput value={it.fatG} onChangeValue={(v) => updateItem(it.id, { fatG: v })} unit="F" placeholder="—" style={styles.flex} accessibilityLabel="Item fat grams" />
                <NumericInput value={it.calories} onChangeValue={(v) => updateItem(it.id, { calories: v })} unit="kcal" decimals={false} placeholder="—" style={styles.flex} accessibilityLabel="Item calories" />
              </View>
            </Card>
          ))}
          <Button
            label="Add item"
            icon={Plus}
            variant="ghost"
            size="sm"
            onPress={() => setItems((l) => [...l, { id: newId(), name: '', amount: null, calories: null, proteinG: null, carbsG: null, fatG: null }])}
            style={styles.addItem}
          />

          {!isNew ? <Button label="Delete meal" variant="ghost" size="md" icon={Trash2} onPress={() => setConfirmDelete(true)} style={styles.delete} /> : null}
        </>
      ) : null}

      <ConfirmSheet
        visible={confirmDelete}
        title="Delete this meal?"
        message="It will be removed from today’s totals."
        confirmLabel="Delete meal"
        destructive
        onCancel={() => setConfirmDelete(false)}
        onConfirm={() => {
          setConfirmDelete(false);
          deleteMeal(mealId);
          router.back();
        }}
      />
    </AppScreen>
  );
}

function Macro({ label, unit, value, onChange, emphasized }: { label: string; unit: string; value: number | null; onChange: (v: number | null) => void; emphasized?: boolean }) {
  const styles = useStyles();
  return (
    <View style={styles.macro}>
      <Text variant="smallMedium" color={emphasized ? 'accent' : 'secondary'}>
        {label}
      </Text>
      <NumericInput value={value} onChangeValue={onChange} unit={unit} decimals={unit !== 'kcal'} size="lg" placeholder="—" accessibilityLabel={`${label} in ${unit}`} />
    </View>
  );
}

const useStyles = makeStyles((t) => ({
  flex: { flex: 1 },
  row: { flexDirection: 'row', alignItems: 'center', gap: t.spacing.xs },
  photoWrap: { borderRadius: t.radius.card, overflow: 'hidden' },
  photo: { width: '100%', aspectRatio: 4 / 3, borderRadius: t.radius.card },
  photoEmpty: { backgroundColor: t.colors.surfaceSecondary, alignItems: 'center', justifyContent: 'center' },
  analyzing: {
    position: 'absolute',
    left: t.spacing.md,
    bottom: t.spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: t.spacing.xs,
    paddingHorizontal: t.spacing.sm,
    paddingVertical: t.spacing.xs,
    borderRadius: t.radius.pill,
    backgroundColor: t.colors.surfaceElevated,
  },
  photoActions: { position: 'absolute', right: t.spacing.sm, top: t.spacing.sm, flexDirection: 'row', gap: t.spacing.xs },
  skeletons: { gap: t.spacing.sm, marginTop: t.spacing.lg },
  notice: { gap: t.spacing.xs, marginTop: t.spacing.md },
  section: { marginTop: t.spacing.lg, marginBottom: t.spacing.md },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: t.spacing.sm, marginTop: t.spacing.md },
  macro: { flexBasis: '47%', flexGrow: 1, gap: t.spacing.xs },
  hint: { marginTop: t.spacing.sm },
  itemsHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: t.spacing['2xl'], marginBottom: t.spacing.xs, minHeight: 36 },
  item: { gap: t.spacing.xs, marginBottom: t.spacing.xs },
  itemName: { flex: 1 },
  itemMacros: { flexDirection: 'row', gap: t.spacing.xxs },
  addItem: { alignSelf: 'flex-start' },
  delete: { marginTop: t.spacing['2xl'], alignSelf: 'center' },
}));
