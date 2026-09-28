import { create } from 'zustand';

export type SyncStatus = 'local' | 'idle' | 'syncing' | 'offline' | 'error';

interface SyncStatusState {
  status: SyncStatus;
  lastError: string | null;
  online: boolean;
  set: (patch: Partial<Omit<SyncStatusState, 'set'>>) => void;
}

export const useSyncStatus = create<SyncStatusState>((set) => ({
  status: 'local',
  lastError: null,
  online: true,
  set: (patch) => set(patch),
}));
