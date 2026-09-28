import * as Sharing from 'expo-sharing';
import type { RefObject } from 'react';
import { Platform, type View } from 'react-native';
import { captureRef } from 'react-native-view-shot';

export const SHARE_CARD_SIZE = { width: 1080, height: 1920 } as const;

export const shareSupported = Platform.OS !== 'web';

/** Renders the share card view to a 1080×1920 PNG in the cache directory. */
export async function captureShareCard(ref: RefObject<View | null>): Promise<string> {
  return captureRef(ref, { format: 'png', quality: 1, result: 'tmpfile', ...SHARE_CARD_SIZE });
}

export type SaveResult = 'saved' | 'denied' | 'unsupported';

export async function saveToPhotos(uri: string): Promise<SaveResult> {
  if (!shareSupported) return 'unsupported';
  // Loaded lazily: the media-library native module doesn't exist on web.
  const MediaLibrary = await import('expo-media-library');
  const perm = await MediaLibrary.requestPermissionsAsync(true, ['photo']);
  if (!perm.granted) return 'denied';
  await MediaLibrary.Asset.create(uri);
  return 'saved';
}

export async function shareImage(uri: string): Promise<boolean> {
  if (!shareSupported || !(await Sharing.isAvailableAsync())) return false;
  await Sharing.shareAsync(uri, { mimeType: 'image/png', dialogTitle: 'Share your progress', UTI: 'public.png' });
  return true;
}
