import { useEffect } from 'react';
import { useServerStore } from '@/stores/serverStore';

/** Starts the 2-second server tick loop. Mount once at the app root. */
export function useServerTick() {
  const tickServer = useServerStore((s) => s.tickServer);

  useEffect(() => {
    const id = setInterval(tickServer, 2000);
    return () => clearInterval(id);
  }, [tickServer]);
}
