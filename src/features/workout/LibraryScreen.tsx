import { router, useLocalSearchParams } from 'expo-router';
import { Search } from 'lucide-react-native';
import { useMemo, useState } from 'react';
import { FlatList, ScrollView, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { EXERCISES, LIBRARY_FILTERS } from '@/data/exercises';
import { AppHeader, Button, EmptyState, FilterChip, makeStyles, toast, useTheme } from '@/design-system';
import type { Exercise } from '@/domain';
import { useActiveWorkoutStore, useAppStore } from '@/store';

import { ExerciseRow } from './components/ExerciseRow';

type Mode = 'browse' | 'template' | 'session';

export function LibraryScreen() {
  const styles = useStyles();
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ mode?: Mode; templateId?: string }>();
  const mode: Mode = params.mode ?? 'browse';
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState('all');
  const [selected, setSelected] = useState<string[]>([]);

  const results = useMemo(() => {
    const groups = LIBRARY_FILTERS.find((f) => f.key === filter)?.groups ?? null;
    const q = query.trim().toLowerCase();
    return EXERCISES.filter((e) => (!groups || groups.includes(e.muscleGroup)) && (!q || e.name.toLowerCase().includes(q) || e.secondaryMuscles.some((m) => m.toLowerCase().includes(q))));
  }, [query, filter]);

  const picking = mode !== 'browse';

  const onPress = (e: Exercise) => {
    if (!picking) {
      router.push({ pathname: '/workout/exercise/[id]', params: { id: e.id } });
      return;
    }
    setSelected((s) => (s.includes(e.id) ? s.filter((x) => x !== e.id) : [...s, e.id]));
  };

  const confirm = () => {
    if (mode === 'template' && params.templateId) {
      const add = useAppStore.getState().addTemplateExercise;
      selected.forEach((id) => add(params.templateId!, id));
    } else if (mode === 'session') {
      const history = useAppStore.getState().sessions;
      const add = useActiveWorkoutStore.getState().addExercise;
      selected.forEach((id) => add(id, history));
    }
    toast.show(`Added ${selected.length} ${selected.length === 1 ? 'exercise' : 'exercises'}`);
    router.back();
  };

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <AppHeader title={picking ? 'Add exercises' : 'Exercise library'} leading={picking ? 'close' : 'back'} />
      <View style={styles.searchWrap}>
        <View style={styles.search}>
          <Search size={18} color={theme.colors.textMuted} />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Search exercises"
            placeholderTextColor={theme.colors.textMuted}
            style={[theme.typography.body, styles.searchInput]}
            autoCorrect={false}
            returnKeyType="search"
            accessibilityLabel="Search exercises"
            clearButtonMode="while-editing"
          />
        </View>
      </View>
      <View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filters} keyboardShouldPersistTaps="handled">
          {LIBRARY_FILTERS.map((f) => (
            <FilterChip key={f.key} label={f.label} selected={filter === f.key} onPress={() => setFilter(f.key)} />
          ))}
        </ScrollView>
      </View>
      <FlatList
        data={results}
        keyExtractor={(e) => e.id}
        renderItem={({ item }) => <ExerciseRow exercise={item} onPress={onPress} selectable={picking} selected={selected.includes(item.id)} />}
        contentContainerStyle={[styles.list, { paddingBottom: insets.bottom + (picking ? 120 : 24) }]}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        initialNumToRender={14}
        ItemSeparatorComponent={() => <View style={styles.sep} />}
        ListEmptyComponent={<EmptyState title="No matches" message="Try a different name or muscle group." />}
      />
      {picking ? (
        <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 16) }]}>
          <Button
            label={selected.length ? `Add ${selected.length} ${selected.length === 1 ? 'exercise' : 'exercises'}` : 'Select exercises'}
            disabled={selected.length === 0}
            onPress={confirm}
          />
        </View>
      ) : null}
    </View>
  );
}

const useStyles = makeStyles((t) => ({
  root: { flex: 1, backgroundColor: t.colors.background },
  searchWrap: { paddingHorizontal: t.layout.screenPadding, paddingBottom: t.spacing.sm },
  search: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: t.spacing.xs,
    minHeight: 48,
    paddingHorizontal: t.spacing.md,
    borderRadius: t.radius.md,
    backgroundColor: t.colors.surfaceSecondary,
  },
  searchInput: { flex: 1, color: t.colors.textPrimary, paddingVertical: t.spacing.xs },
  filters: { gap: t.spacing.xs, paddingHorizontal: t.layout.screenPadding, paddingBottom: t.spacing.sm },
  list: { paddingHorizontal: t.layout.screenPadding },
  sep: { height: 1, backgroundColor: t.colors.border, marginLeft: 64 },
  footer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: t.layout.screenPadding,
    paddingTop: t.spacing.sm,
    backgroundColor: t.colors.background,
    borderTopWidth: 1,
    borderTopColor: t.colors.border,
  },
}));
