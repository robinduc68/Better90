import { randomUUID } from 'expo-crypto';

/** Client-generated UUIDs make every write idempotent for offline sync. */
export function newId(): string {
  return randomUUID();
}
