import { act, fireEvent, screen } from '@testing-library/react';
import { Link } from 'react-router-dom';
import SearchInput from '../../../src/components/layout/SearchInput';
import { renderWithProviders } from '../../render';

const uiWith = (searchQueries: Record<string, string>) => ({
  ui: { viewMode: 'grid' as const, recentlyViewed: [], searchQueries, isAuthModalOpen: false },
});

const input = () => screen.getByPlaceholderText('Search games...');
const type = (value: string) => fireEvent.change(input(), { target: { value } });
const advance = (ms: number) => act(() => { vi.advanceTimersByTime(ms); });

describe('SearchInput', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('starts with the text saved for this page', () => {
    renderWithProviders(<SearchInput />, { preloadedState: uiWith({ '/': 'zelda' }) });

    expect(input()).toHaveValue('zelda');
  });

  describe('debounce', () => {
    it('shows typing at once but searches only after 500 ms', () => {
      const { store } = renderWithProviders(<SearchInput />);

      type('zelda');
      expect(input()).toHaveValue('zelda');

      advance(499);
      expect(store.getState().ui.searchQueries['/']).toBeUndefined();

      advance(1);
      expect(store.getState().ui.searchQueries['/']).toBe('zelda');
    });

    it('waits for typing to stop', () => {
      const { store } = renderWithProviders(<SearchInput />);

      type('z');
      advance(400);
      type('ze');
      advance(400);
      expect(store.getState().ui.searchQueries['/']).toBeUndefined();

      advance(100);
      expect(store.getState().ui.searchQueries['/']).toBe('ze');
    });

    it('does not search just from loading the page', () => {
      const onScrollToTop = vi.fn();
      window.addEventListener('nexusScrollToTop', onScrollToTop);
      renderWithProviders(<SearchInput />, { preloadedState: uiWith({ '/': 'zelda' }) });

      advance(1000);

      expect(onScrollToTop).not.toHaveBeenCalled();
      window.removeEventListener('nexusScrollToTop', onScrollToTop);
    });

    it('cancels a pending search when removed', () => {
      const { store, unmount } = renderWithProviders(<SearchInput />);

      type('zelda');
      unmount();
      advance(1000);

      expect(store.getState().ui.searchQueries['/']).toBeUndefined();
    });
  });

  describe('scrolling to the top', () => {
    const listen = () => {
      const onScrollToTop = vi.fn();
      window.addEventListener('nexusScrollToTop', onScrollToTop);
      return onScrollToTop;
    };

    it('happens when a search runs', () => {
      const onScrollToTop = listen();
      renderWithProviders(<SearchInput />);

      type('zelda');
      advance(500);

      expect(onScrollToTop).toHaveBeenCalledTimes(1);
      window.removeEventListener('nexusScrollToTop', onScrollToTop);
    });

    it.each(['', '   '])('does not happen for the blank text "%s"', (text) => {
      const onScrollToTop = listen();
      renderWithProviders(<SearchInput />, { preloadedState: uiWith({ '/': 'zelda' }) });

      type(text);
      advance(500);

      expect(onScrollToTop).not.toHaveBeenCalled();
      window.removeEventListener('nexusScrollToTop', onScrollToTop);
    });
  });

  describe('clear button', () => {
    it('is hidden with nothing to clear', () => {
      renderWithProviders(<SearchInput />);

      expect(screen.queryByRole('button')).not.toBeInTheDocument();
    });

    it('clears the text and the search straight away', () => {
      const { store } = renderWithProviders(<SearchInput />, { preloadedState: uiWith({ '/': 'zelda' }) });

      fireEvent.click(screen.getByRole('button', { name: 'Clear search' }));

      expect(input()).toHaveValue('');
      expect(store.getState().ui.searchQueries['/']).toBe('');
    });

    it('also closes the mobile search when there is one', () => {
      const onClose = vi.fn();
      renderWithProviders(<SearchInput onClose={onClose} />, { preloadedState: uiWith({ '/': 'zelda' }) });

      fireEvent.click(screen.getByRole('button', { name: 'Clear search' }));

      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('reads as closing when the mobile search is empty', () => {
      const onClose = vi.fn();
      renderWithProviders(<SearchInput onClose={onClose} />);

      fireEvent.click(screen.getByRole('button', { name: 'Close search' }));

      expect(onClose).toHaveBeenCalledTimes(1);
    });
  });

  describe('focus', () => {
    it('focuses after the opening animation when asked', () => {
      renderWithProviders(<SearchInput autoFocus />);
      expect(input()).not.toHaveFocus();

      advance(300);

      expect(input()).toHaveFocus();
    });

    it('does not take focus otherwise', () => {
      renderWithProviders(<SearchInput />);

      advance(300);

      expect(input()).not.toHaveFocus();
    });
  });

  it('shows the right text after moving to another page, without mixing them up', () => {
    const { store } = renderWithProviders(
      <><Link to="/collection">Go</Link><SearchInput /></>,
      { preloadedState: uiWith({ '/': 'zelda', '/collection': 'mario' }) },
    );

    fireEvent.click(screen.getByRole('link', { name: 'Go' }));
    expect(input()).toHaveValue('mario');

    advance(1000);
    expect(store.getState().ui.searchQueries).toEqual({ '/': 'zelda', '/collection': 'mario' });
  });
});
