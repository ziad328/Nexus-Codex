import { act, render, screen } from '@testing-library/react';
import { forwardRef, useImperativeHandle } from 'react';
import type { ReactNode } from 'react';
import SmoothScrollbar from '../../../src/components/shared/SmoothScrollbar';

const scrollElement = { scrollTop: 0, scrollTo: vi.fn() };
const instance = { elements: () => ({ scrollOffsetElement: scrollElement }) };
let hasInstance = true;
let emitScroll = () => {};

// The real library needs layout that jsdom lacks, and has its own tests. This checks how we use it.
vi.mock('overlayscrollbars-react', () => ({
  OverlayScrollbarsComponent: forwardRef(function FakeScrollbars(
    { children, className, events }: { children: ReactNode; className?: string; events: { scroll: (i: typeof instance) => void } },
    ref,
  ) {
    useImperativeHandle(ref, () => ({ osInstance: () => (hasInstance ? instance : null) }));
    emitScroll = () => events.scroll(instance);
    return <div data-testid="scrollbars" className={className}>{children}</div>;
  }),
}));

const scrollToTop = () => act(() => { window.dispatchEvent(new CustomEvent('nexusScrollToTop')); });

describe('SmoothScrollbar', () => {
  beforeEach(() => {
    hasInstance = true;
    scrollElement.scrollTop = 0;
    scrollElement.scrollTo.mockClear();
  });

  it('shows its children with the given class', () => {
    render(<SmoothScrollbar className="h-full"><p>Content</p></SmoothScrollbar>);

    expect(screen.getByText('Content')).toBeInTheDocument();
    expect(screen.getByTestId('scrollbars')).toHaveClass('h-full');
  });

  it('scrolls smoothly to the top when asked', () => {
    render(<SmoothScrollbar><p>Content</p></SmoothScrollbar>);

    scrollToTop();

    expect(scrollElement.scrollTo).toHaveBeenCalledWith({ top: 0, behavior: 'smooth' });
  });

  it('copes with being asked before the scrollbar has started', () => {
    hasInstance = false;
    // An error inside an event listener reaches window's error event, not the code that dispatched it.
    const onError = vi.fn((event: ErrorEvent) => event.preventDefault());
    window.addEventListener('error', onError);
    render(<SmoothScrollbar><p>Content</p></SmoothScrollbar>);

    scrollToTop();

    window.removeEventListener('error', onError);
    expect(onError).not.toHaveBeenCalled();
    expect(scrollElement.scrollTo).not.toHaveBeenCalled();
  });

  it('stops listening once removed', () => {
    const removeListener = vi.spyOn(window, 'removeEventListener');
    const { unmount } = render(<SmoothScrollbar><p>Content</p></SmoothScrollbar>);

    unmount();

    expect(removeListener.mock.calls.map(([event]) => event)).toContain('nexusScrollToTop');
    removeListener.mockRestore();
  });

  it('announces the scroll position to the page and the parent', () => {
    const onScroll = vi.fn();
    const onWindowScroll = vi.fn();
    window.addEventListener('nexusScroll', onWindowScroll);
    render(<SmoothScrollbar onScroll={onScroll}><p>Content</p></SmoothScrollbar>);
    scrollElement.scrollTop = 640;

    emitScroll();

    expect(onScroll).toHaveBeenCalledWith(640);
    expect((onWindowScroll.mock.calls[0][0] as CustomEvent<number>).detail).toBe(640);
    window.removeEventListener('nexusScroll', onWindowScroll);
  });

  it('works without a scroll callback', () => {
    render(<SmoothScrollbar><p>Content</p></SmoothScrollbar>);

    expect(() => emitScroll()).not.toThrow();
  });
});
