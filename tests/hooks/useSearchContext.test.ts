import { act } from '@testing-library/react';
import useSearchContext from '../../src/hooks/useSearchContext';
import { renderHookWithProviders } from '../render';

const uiWith = (searchQueries: Record<string, string>) => ({
  ui: { viewMode: 'grid' as const, recentlyViewed: [], searchQueries, isAuthModalOpen: false },
});

describe('useSearchContext', () => {
  it('starts empty', () => {
    const { result } = renderHookWithProviders(() => useSearchContext());

    expect(result.current[0]).toBe('');
  });

  it('reads the text saved for the current page only', () => {
    const preloadedState = uiWith({ '/': 'zelda', '/collection': 'mario' });

    const home = renderHookWithProviders(() => useSearchContext(), { preloadedState });
    const collection = renderHookWithProviders(() => useSearchContext(), { route: '/collection', preloadedState });

    expect(home.result.current[0]).toBe('zelda');
    expect(collection.result.current[0]).toBe('mario');
  });

  it('saves text under the current page without touching others', () => {
    const { result, store } = renderHookWithProviders(() => useSearchContext(), {
      route: '/collection',
      preloadedState: uiWith({ '/': 'zelda' }),
    });

    act(() => result.current[1]('mario'));

    expect(result.current[0]).toBe('mario');
    expect(store.getState().ui.searchQueries).toEqual({ '/': 'zelda', '/collection': 'mario' });
  });

  it('ignores the query string when choosing the page', () => {
    const { result } = renderHookWithProviders(() => useSearchContext(), {
      route: '/?gameId=1',
      preloadedState: uiWith({ '/': 'zelda' }),
    });

    expect(result.current[0]).toBe('zelda');
  });

  it('keeps the same setter between renders', () => {
    const { result, rerender } = renderHookWithProviders(() => useSearchContext());
    const setter = result.current[1];

    rerender();

    expect(result.current[1]).toBe(setter);
  });
});
