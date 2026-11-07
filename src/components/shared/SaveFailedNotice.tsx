import { useEffect, useState } from 'react';
import type { FC } from 'react';
import { createPortal } from 'react-dom';
import { AlertCircle } from 'lucide-react';

/**
 * Tells the user a save didn't reach the cloud. Rendered on the page body, so cards that clip or
 * transform their content can't hide it. Remount it (a new `key`) to show it again.
 */
const SaveFailedNotice: FC = () => {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setVisible(false), 4000);
    return () => clearTimeout(timer);
  }, []);

  if (!visible) return null;
  return createPortal(
    <div
      role="alert"
      className="fixed bottom-6 left-1/2 -translate-x-1/2 z-60 flex items-center gap-2 px-4 py-2.5 rounded-xl bg-zinc-900 border border-red-500/30 text-red-400 text-sm font-medium shadow-[0_10px_40px_rgba(0,0,0,0.6)] w-max max-w-[calc(100vw-2rem)]"
    >
      <AlertCircle className="w-4 h-4 shrink-0" />
      Couldn't save. Check your connection and try again.
    </div>,
    document.body,
  );
};

export default SaveFailedNotice;
