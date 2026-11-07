import { useRef, useState } from 'react';
import type { FC, KeyboardEvent, TouchEvent } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import Lightbox from '../shared/Lightbox';

interface Screenshot {
  id: number;
  image: string;
}

interface Props {
  screenshots: Screenshot[];
}

// Thumbnails use IGDB's smaller size; other URLs pass through unchanged.
const thumbUrl = (url: string) => url.replace('/t_screenshot_big/', '/t_screenshot_med/');
// The enlarged view uses IGDB's 1080p size.
const fullUrl = (url: string) => url.replace('/t_screenshot_big/', '/t_1080p/');

const SWIPE_PX = 40;

/** One large screenshot at a time, with arrows, a counter, thumbnails, arrow keys, swipe, and a click to enlarge. */
const ScreenshotGallery: FC<Props> = ({ screenshots }) => {
  const [index, setIndex] = useState(0);
  const [enlarged, setEnlarged] = useState(false);
  const touchX = useRef<number | null>(null);
  const thumbs = useRef<(HTMLButtonElement | null)[]>([]);
  const total = screenshots.length;

  if (total === 0) return null;
  const current = Math.min(index, total - 1);

  const show = (next: number) => {
    const wrapped = (next + total) % total;
    setIndex(wrapped);
    thumbs.current[wrapped]?.scrollIntoView?.({ block: 'nearest', inline: 'nearest' });
  };

  const onKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'ArrowLeft') show(current - 1);
    else if (e.key === 'ArrowRight') show(current + 1);
    else return;
    e.preventDefault();
  };

  const onTouchEnd = (e: TouchEvent) => {
    if (touchX.current === null) return;
    const dx = e.changedTouches[0].clientX - touchX.current;
    touchX.current = null;
    if (Math.abs(dx) >= SWIPE_PX) show(current + (dx < 0 ? 1 : -1));
  };

  const swipe = {
    onTouchStart: (e: TouchEvent) => { touchX.current = e.touches[0].clientX; },
    onTouchEnd,
  };

  const arrow = 'absolute top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/60 hover:bg-accent text-white flex items-center justify-center transition-colors cursor-pointer focus-visible:outline-2 focus-visible:outline-accent';

  const arrows = total > 1 && (
    <>
      <button onClick={() => show(current - 1)} aria-label="Previous screenshot" className={`${arrow} left-3`}>
        <ChevronLeft className="w-5 h-5" />
      </button>
      <button onClick={() => show(current + 1)} aria-label="Next screenshot" className={`${arrow} right-3`}>
        <ChevronRight className="w-5 h-5" />
      </button>
    </>
  );
  const counter = 'absolute bottom-3 right-3 px-2.5 py-1 rounded-full bg-black/60 text-white text-xs font-semibold tabular-nums';

  return (
    <section
      aria-label="Screenshots"
      aria-roledescription="carousel"
      tabIndex={0}
      onKeyDown={onKeyDown}
      className="rounded-xl focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent"
    >
      <h2 className="text-lg font-semibold text-zinc-100 mb-3">Gallery</h2>

      <div className="relative aspect-video rounded-xl overflow-hidden bg-zinc-800" {...swipe}>
        <button onClick={() => setEnlarged(true)} aria-label={`Enlarge screenshot ${current + 1}`} className="w-full h-full cursor-zoom-in">
          <img
            src={screenshots[current].image}
            crossOrigin="anonymous"
            alt={`Screenshot ${current + 1} of ${total}`}
            className="w-full h-full object-cover"
          />
        </button>
        {arrows}
        <p aria-live="polite" className={counter}>
          {current + 1} / {total}
        </p>
      </div>

      {enlarged && (
        <Lightbox label={`Screenshot ${current + 1} of ${total}`} onClose={() => setEnlarged(false)}>
          <div className="relative w-full max-w-6xl" {...swipe}>
            <img
              src={fullUrl(screenshots[current].image)}
              crossOrigin="anonymous"
              alt={`Screenshot ${current + 1} of ${total}, enlarged`}
              className="w-full max-h-[85vh] object-contain"
            />
            {arrows}
            <p className={counter}>{current + 1} / {total}</p>
          </div>
        </Lightbox>
      )}

      {total > 1 && (
        <div className="flex gap-2 mt-3 p-0.5 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {screenshots.map((shot, i) => (
            <button
              key={shot.id}
              ref={(el) => { thumbs.current[i] = el; }}
              onClick={() => show(i)}
              aria-label={`Show screenshot ${i + 1}`}
              aria-current={i === current}
              className={`shrink-0 w-20 sm:w-24 aspect-video rounded-lg overflow-hidden cursor-pointer transition-opacity ring-2 ${
                i === current ? 'ring-accent opacity-100' : 'ring-transparent opacity-60 hover:opacity-100'
              }`}
            >
              <img src={thumbUrl(shot.image)} crossOrigin="anonymous" alt="" loading="lazy" className="w-full h-full object-cover" />
            </button>
          ))}
        </div>
      )}
    </section>
  );
};

export default ScreenshotGallery;
