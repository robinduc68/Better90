import { useQuery } from '@tanstack/react-query';
import { Image } from 'expo-image';
import { ImageOff } from 'lucide-react-native';
import type { ReactNode } from 'react';
import { View, type StyleProp, type ViewStyle } from 'react-native';

import { Skeleton, useTheme } from '@/design-system';
import { getRemote } from '@/repositories';
import type { PhotoBucket } from '@/repositories/remote/RemoteRepository';

const SIGNED_URL_TTL_SEC = 60 * 10;

interface PrivateImageProps {
  cacheKey: string;
  localUri: string | null;
  storagePath: string | null;
  bucket: PhotoBucket;
  style?: StyleProp<ViewStyle>;
  accessibilityLabel: string;
  /** Rendered when no image is available (instead of a broken-image icon). */
  fallback?: ReactNode;
}

/**
 * Private user image: on-device file first, otherwise a short-lived signed URL.
 * Never a public URL.
 */
export function PrivateImage({ cacheKey, localUri, storagePath, bucket, style, accessibilityLabel, fallback }: PrivateImageProps) {
  const { colors } = useTheme();
  const needsRemote = !localUri && !!storagePath;
  const signed = useQuery({
    queryKey: ['signed-image', bucket, storagePath],
    queryFn: () => getRemote()!.signedPhotoUrl(storagePath!, SIGNED_URL_TTL_SEC, bucket),
    enabled: needsRemote && !!getRemote(),
    staleTime: (SIGNED_URL_TTL_SEC - 60) * 1000,
    gcTime: SIGNED_URL_TTL_SEC * 1000,
  });
  const uri = localUri ?? signed.data ?? null;
  return (
    <View style={[{ overflow: 'hidden', backgroundColor: colors.surfaceSecondary }, style]}>
      {uri ? (
        <Image source={{ uri, cacheKey }} style={{ width: '100%', height: '100%' }} contentFit="cover" transition={150} cachePolicy={localUri ? 'none' : 'memory'} accessibilityLabel={accessibilityLabel} />
      ) : needsRemote && signed.isLoading ? (
        <Skeleton width="100%" height={400} />
      ) : (
        (fallback ?? (
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }} accessibilityLabel="Image unavailable on this device">
            <ImageOff size={20} color={colors.textMuted} />
          </View>
        ))
      )}
    </View>
  );
}
