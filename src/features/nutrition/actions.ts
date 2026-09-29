import { toast } from '@/design-system';
import type { Meal } from '@/domain';
import { analytics } from '@/services/analytics';
import { haptics } from '@/services/haptics';
import { deleteLocalPhoto, pickPhoto, storePhotoPrivately, type PhotoSource } from '@/services/photos';
import { useAppStore } from '@/store';

export function saveMeal(meal: Omit<Meal, 'updatedAt'>, isNew: boolean) {
  useAppStore.getState().saveMeal(meal);
  haptics.tick();
  if (isNew) analytics.track('protein_logged', { grams: meal.proteinG ?? 0, source: meal.source });
  toast.show(isNew ? `${meal.name} added` : 'Meal updated');
}

export function deleteMeal(id: string) {
  const removed = useAppStore.getState().deleteMeal(id);
  if (removed?.photoUri) deleteLocalPhoto(removed.photoUri);
}

/** Picks a meal photo and copies it into private app storage. */
export async function captureMealPhoto(source: PhotoSource, mealId: string): Promise<string | null> {
  const res = await pickPhoto(source, [1, 1]);
  if (res.status === 'denied') {
    toast.show(source === 'camera' ? 'Camera access is off. Enable it in Settings.' : 'Photo access is off. Enable it in Settings.');
    return null;
  }
  if (res.status === 'cancelled') return null;
  try {
    return await storePhotoPrivately(res.uri, mealId, 'meal');
  } catch {
    toast.show("Couldn't save the photo. Try again.");
    return null;
  }
}
