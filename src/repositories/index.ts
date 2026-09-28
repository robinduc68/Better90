import { getSupabase } from '@/services/supabase/client';

import type { RemoteRepository } from './remote/RemoteRepository';
import { createSupabaseRemote } from './remote/supabaseRemote';

let remote: RemoteRepository | null | undefined;

/** The configured backend, or null in local-only builds. */
export function getRemote(): RemoteRepository | null {
  if (remote === undefined) {
    const db = getSupabase();
    remote = db ? createSupabaseRemote(db) : null;
  }
  return remote;
}

export type { RemoteRepository } from './remote/RemoteRepository';
