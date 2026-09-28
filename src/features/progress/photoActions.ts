import { toast } from '@/design-system';
import type { PhotoPose } from '@/domain';
import { newId } from '@/lib/id';
import { nowISO, today } from '@/lib/now';
import { analytics } from '@/services/analytics';
import { deleteLocalPhoto, pickPhoto, storePhotoPrivately, type PhotoSource } from '@/services/photos';
import { useAppStore } from '@/store';

export async function addProgressPhoto(source: PhotoSource, pose: PhotoPose, dayNumber: number): Promise<boolean> {
  const result = await pickPhoto(source);
  if (result.status === 'denied') {
    toast.show(source === 'camera' ? 'Camera access is off. Enable it in Settings to take photos.' : 'Photo access is off. Enable it in Settings to choose photos.');
    return false;
  }
  if (result.status === 'cancelled') return false;
  const id = newId();
  try {
    const localUri = await storePhotoPrivately(result.uri, id);
    const replaced = useAppStore.getState().addPhoto({ id, date: today(), dayNumber, pose, localUri, storagePath: null, createdAt: nowISO() });
    replaced.forEach((p) => deleteLocalPhoto(p.localUri));
    analytics.track('progress_photo_added', { pose, day_number: dayNumber });
    toast.show('Photo saved privately');
    return true;
  } catch {
    toast.show("Couldn't save the photo. Try again.");
    return false;
  }
}

export function removeProgressPhoto(id: string) {
  const photo = useAppStore.getState().photos.find((p) => p.id === id);
  if (!photo) return;
  deleteLocalPhoto(photo.localUri);
  useAppStore.getState().deletePhoto(id);
}
