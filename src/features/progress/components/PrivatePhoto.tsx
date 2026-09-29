import type { StyleProp, ViewStyle } from 'react-native';

import type { ProgressPhoto } from '@/domain';
import { PrivateImage } from '@/features/media/PrivateImage';

/** Progress photo from the private device file or a short-lived signed URL. */
export function PrivatePhoto({ photo, style }: { photo: ProgressPhoto; style?: StyleProp<ViewStyle> }) {
  return (
    <PrivateImage
      cacheKey={photo.id}
      localUri={photo.localUri}
      storagePath={photo.storagePath}
      bucket="progress-photos"
      style={style}
      accessibilityLabel={`${photo.pose} progress photo, day ${photo.dayNumber}`}
    />
  );
}
