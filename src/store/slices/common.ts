import type { StoreApi } from 'zustand';

import type { AppState } from '../appStore';

export type SetState = StoreApi<AppState>['setState'];
export type GetState = StoreApi<AppState>['getState'];

export function upsertById<T extends { id: string }>(list: T[], item: T): T[] {
  const idx = list.findIndex((x) => x.id === item.id);
  if (idx === -1) return [...list, item];
  const next = list.slice();
  next[idx] = item;
  return next;
}
