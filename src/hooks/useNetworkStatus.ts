import { useSyncStatus } from '@/services/sync/syncStatus';

export function useIsOffline(): boolean {
  return useSyncStatus((s) => !s.online);
}
