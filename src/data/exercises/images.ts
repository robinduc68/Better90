import type { MediaSource } from '@/domain';

/**
 * Exercise imagery registry.
 *
 * - Bundled: `{ kind: 'local', asset: require('@/../assets/exercises/lat-pulldown.png') }`
 * - CDN later: `{ kind: 'remote', uri: 'https://cdn.example.com/exercises/lat-pulldown.webp' }`
 *
 * Only add images you own or have licensed. Exercises without an entry render
 * a designed placeholder (see ExerciseImage).
 */
export const exerciseImages: Partial<Record<string, MediaSource>> = {};

/** Optional CDN base; when set, exercises without a bundled image resolve to `${base}/${id}.webp`. */
export const EXERCISE_CDN_BASE: string | null = process.env.EXPO_PUBLIC_EXERCISE_CDN_URL ?? null;

export function resolveExerciseImage(id: string, image: MediaSource | null): MediaSource | null {
  if (image) return image;
  if (EXERCISE_CDN_BASE) return { kind: 'remote', uri: `${EXERCISE_CDN_BASE.replace(/\/$/, '')}/${id}.webp` };
  return null;
}
