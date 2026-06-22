import { useState, useCallback } from 'react';

interface ShareData {
  title: string;
  text?: string;
  url: string;
}

type ShareStatus = 'idle' | 'copied' | 'shared' | 'error';

const useShare = () => {
  const [status, setStatus] = useState<ShareStatus>('idle');

  const share = useCallback(async (data: ShareData) => {
    // Try native Web Share API first (mobile / Chrome on desktop)
    if (navigator.share && navigator.canShare?.(data)) {
      try {
        await navigator.share(data);
        setStatus('shared');
        setTimeout(() => setStatus('idle'), 2000);
        return;
      } catch (err) {
        // User dismissed the share sheet — don't fall through to clipboard
        if ((err as DOMException).name === 'AbortError') return;
      }
    }

    // Fallback: copy the URL to clipboard
    try {
      await navigator.clipboard.writeText(data.url);
      setStatus('copied');
      setTimeout(() => setStatus('idle'), 2000);
    } catch {
      setStatus('error');
      setTimeout(() => setStatus('idle'), 2000);
    }
  }, []);

  return { share, status };
};

export default useShare;
