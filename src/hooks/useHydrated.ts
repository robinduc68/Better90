import { useEffect, useState } from 'react';

import { useActiveWorkoutStore, useAppStore } from '@/store';

/** True once both persisted stores have loaded from disk. */
export function useHydrated(): boolean {
  const [ready, setReady] = useState(() => useAppStore.persist.hasHydrated() && useActiveWorkoutStore.persist.hasHydrated());
  useEffect(() => {
    if (ready) return;
    const check = () => {
      if (useAppStore.persist.hasHydrated() && useActiveWorkoutStore.persist.hasHydrated()) setReady(true);
    };
    const a = useAppStore.persist.onFinishHydration(check);
    const b = useActiveWorkoutStore.persist.onFinishHydration(check);
    check();
    return () => {
      a();
      b();
    };
  }, [ready]);
  return ready;
}
