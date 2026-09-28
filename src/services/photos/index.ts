import { Directory, File, Paths } from 'expo-file-system';
import * as ImagePicker from 'expo-image-picker';
import { Platform } from 'react-native';

/**
 * Progress photos are copied into the app's private document directory.
 * They are never written to the shared photo library.
 */
const PHOTO_DIR = 'progress-photos';

function photoDir(): Directory {
  const dir = new Directory(Paths.document, PHOTO_DIR);
  if (!dir.exists) dir.create({ intermediates: true, idempotent: true });
  return dir;
}

export type PhotoSource = 'camera' | 'library';

export type PickResult = { status: 'picked'; uri: string } | { status: 'cancelled' } | { status: 'denied'; source: PhotoSource };

export async function pickPhoto(source: PhotoSource): Promise<PickResult> {
  const options: ImagePicker.ImagePickerOptions = {
    mediaTypes: ['images'],
    quality: 0.8,
    allowsEditing: true,
    aspect: [3, 4],
    exif: false,
  };
  if (source === 'camera') {
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (!perm.granted) return { status: 'denied', source };
    const res = await ImagePicker.launchCameraAsync({ ...options, cameraType: ImagePicker.CameraType.back });
    return res.canceled || !res.assets[0] ? { status: 'cancelled' } : { status: 'picked', uri: res.assets[0].uri };
  }
  const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!perm.granted) return { status: 'denied', source };
  const res = await ImagePicker.launchImageLibraryAsync(options);
  return res.canceled || !res.assets[0] ? { status: 'cancelled' } : { status: 'picked', uri: res.assets[0].uri };
}

/** Copies a picked image into private storage and returns its new URI. */
export async function storePhotoPrivately(sourceUri: string, photoId: string): Promise<string> {
  if (Platform.OS === 'web') return sourceUri;
  const dest = new File(photoDir(), `${photoId}.jpg`);
  if (dest.exists) dest.delete();
  await new File(sourceUri).copy(dest);
  return dest.uri;
}

export function deleteLocalPhoto(uri: string | null) {
  if (!uri || Platform.OS === 'web') return;
  try {
    const f = new File(uri);
    if (f.exists) f.delete();
  } catch {
    // Already gone — nothing to do.
  }
}

export async function readPhotoBytes(uri: string): Promise<Uint8Array> {
  return new File(uri).bytes();
}

export function deleteAllLocalPhotos() {
  if (Platform.OS === 'web') return;
  const dir = new Directory(Paths.document, PHOTO_DIR);
  if (dir.exists) dir.delete();
}
