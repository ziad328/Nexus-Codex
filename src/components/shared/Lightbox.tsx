import { useEffect, useRef } from 'react';
import type { FC, ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';

interface Props {
  /** What the viewer shows, for screen readers. */
  label: string;
  onClose: () => void;
  children: ReactNode;
}

/**
 * A full-screen viewer on the page body. It has no rounded clipping on purpose: Chrome stops clicks
 * reaching a YouTube player inside any rounded clip, which is why trailers play here, not in the modal.
 */
const Lightbox: FC<Props> = ({ label, onClose, children }) => {
  const closeRef = useRef<HTMLButtonElement>(null);
  // Latest onClose, so callers can pass an inline function without re-running the setup below.
  const onCloseRef = useRef(onClose);
  useEffect(() => { onCloseRef.current = onClose; });

  useEffect(() => {
    const opener = document.activeElement as HTMLElement | null;
    closeRef.current?.focus();
    // Capture phase, and stop there: Escape closes this viewer only, not the game modal behind it.
    const closeOnEscape = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      e.stopImmediatePropagation();
      onCloseRef.current();
    };
    window.addEventListener('keydown', closeOnEscape, true);
    return () => {
      window.removeEventListener('keydown', closeOnEscape, true);
      opener?.focus?.();
    };
  }, []);

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-label={label}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      className="fixed inset-0 z-70 bg-black/90 flex items-center justify-center p-4 sm:p-10"
    >
      <button
        ref={closeRef}
        onClick={onClose}
        aria-label="Close viewer"
        className="absolute top-4 right-4 z-10 w-10 h-10 rounded-full bg-zinc-800 hover:bg-accent text-white flex items-center justify-center transition-colors cursor-pointer"
      >
        <X className="w-5 h-5" />
      </button>
      {children}
    </div>,
    document.body,
  );
};

export default Lightbox;
