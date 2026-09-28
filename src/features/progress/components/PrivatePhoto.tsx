import { useQuery } from '@tanstack/react-query';
import { Image } from 'expo-image';
import { ImageOff } from 'lucide-react-native';
import { View, type StyleProp, type ViewStyle } from 'react-native';

import { Skeleton, useTheme } from '@/design-system';
import type { ProgressPhoto } from '@/domain';
import { getRemote } from '@/repositories';

const SIGNED_URL_TTL_SEC = 60 * 10;

/**
 * Shows a progress photo from the private on-device file, or — for photos
 * restored from backup — via a short-lived signed URL. Never a public URL.
 */
export function PrivatePhoto({ photo, style }: { photo: ProgressPhoto; style?: StyleProp<ViewStyle> }) {
  const { colors } = useTheme();
  const needsRemote = !photo.localUri && !!photo.storagePath;
  const signed = useQuery({
    queryKey: ['signed-photo', photo.storagePath],
    queryFn: () => getRemote()!.signedPhotoUrl(photo.storagePath!, SIGNED_URL_TTL_SEC),
    enabled: needsRemote && !!getRemote(),
    staleTime: (SIGNED_URL_TTL_SEC - 60) * 1000,
    gcTime: SIGNED_URL_TTL_SEC * 1000,
  });

  const uri = photo.localUri ?? signed.data ?? null;
  return (
    <View style={[{ overflow: 'hidden', backgroundColor: colors.surfaceSecondary }, style]}>
      {uri ? (
        <Image
          source={{ uri, cacheKey: photo.id }}
          style={{ width: '100%', height: '100%' }}
          contentFit="cover"
          transition={150}
          cachePolicy={photo.localUri ? 'none' : 'memory'}
          accessibilityLabel={`${photo.pose} progress photo, day ${photo.dayNumber}`}
        />
      ) : needsRemote && signed.isLoading ? (
        <Skeleton width="100%" height={400} />
      ) : (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }} accessibilityLabel="Photo unavailable on this device">
          <ImageOff size={20} color={colors.textMuted} />
        </View>
      )}
    </View>
  );
}
