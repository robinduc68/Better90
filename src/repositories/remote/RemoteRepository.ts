import type { SyncEntity } from '@/store/types';

import type { RemoteSnapshot, Row } from './mappers';

/** Both buckets are private; objects live under "<user_id>/". */
export type PhotoBucket = 'progress-photos' | 'meal-photos';

/**
 * Backend boundary. The app talks to this interface only, so Supabase can be
 * replaced by another backend without touching features or domain code.
 */
export interface RemoteRepository {
  upsert(entity: SyncEntity, records: object[], userId: string): Promise<void>;
  remove(entity: SyncEntity, ids: string[], userId: string): Promise<void>;
  pullAll(userId: string): Promise<RemoteSnapshot>;
  uploadPhoto(path: string, bytes: Uint8Array, contentType: string, bucket?: PhotoBucket): Promise<void>;
  /** Short-lived signed URL; photos are never publicly addressable. */
  signedPhotoUrl(path: string, expiresInSec: number, bucket?: PhotoBucket): Promise<string>;
  removePhotos(paths: string[], bucket?: PhotoBucket): Promise<void>;
  deleteAccount(): Promise<void>;
}

export type { RemoteSnapshot, Row };
