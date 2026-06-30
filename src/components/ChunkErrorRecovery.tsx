'use client';
import { useEffect } from 'react';

// After a deploy, a cached page can hold script tags pointing at JS chunks
// that no longer exist on the server (filenames are content-hashed per build).
// If that happens, force one reload to fetch the current page — this is the
// single most common cause of "nothing happens when I tap X" after a release.
export default function ChunkErrorRecovery() {
  useEffect(() => {
    const RELOAD_FLAG = 'chunk-error-reload-attempted';

    const isChunkError = (message: string) =>
      /Loading chunk [\d\w]+ failed/i.test(message) ||
      /Importing a module script failed/i.test(message) ||
      /ChunkLoadError/i.test(message);

    const handle = (message: string) => {
      if (!isChunkError(message)) return;
      const alreadyTried = sessionStorage.getItem(RELOAD_FLAG);
      if (alreadyTried) return; // avoid an infinite reload loop
      sessionStorage.setItem(RELOAD_FLAG, '1');
      window.location.reload();
    };

    const onError = (e: ErrorEvent) => handle(e.message ?? '');
    const onRejection = (e: PromiseRejectionEvent) => handle(String(e.reason?.message ?? e.reason ?? ''));

    window.addEventListener('error', onError);
    window.addEventListener('unhandledrejection', onRejection);
    return () => {
      window.removeEventListener('error', onError);
      window.removeEventListener('unhandledrejection', onRejection);
    };
  }, []);

  return null;
}
