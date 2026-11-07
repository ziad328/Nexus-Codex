import { screen } from '@testing-library/react';
import { useLocation } from 'react-router-dom';
import useAppSelector from '../../src/hooks/useAppSelector';
import apiClient, { CanceledError } from '../../src/services/api-client';
import { setViewMode } from '../../src/store/uiSlice';
import { supabase as appSupabase } from '../../src/utils/supabase';
import { triggerIntersection } from '../fakes/browser';
import { apiRequests, deferred, mockApi, mockApiError } from '../fakes/network';
import { supabase, supabaseFake } from '../fakes/supabase';
import { renderWithProviders } from '../render';

describe('real services are unreachable', () => {
  it('rejects fetch', async () => {
    await expect(fetch('https://example.com')).rejects.toThrow(/Blocked real network/);
  });

  it('rejects XMLHttpRequest', () => {
    const request = new XMLHttpRequest();
    request.open('GET', 'https://example.com');
    expect(() => request.send()).toThrow(/Blocked real network/);
  });

  it('gives the app the in-memory Supabase', () => {
    expect(appSupabase).toBe(supabase);
  });
});

describe('fake API', () => {
  it('answers a route and records what was asked', async () => {
    mockApi('/games', { results: [{ id: 1 }] });

    const response = await apiClient.get('/games', { params: { page: 2 } });

    expect(response.data).toEqual({ results: [{ id: 1 }] });
    expect(apiRequests[0].url).toBe('/games');
    expect(apiRequests[0].params).toMatchObject({ page: 2 });
  });

  it('fails an unknown route instead of guessing', async () => {
    await expect(apiClient.get('/unknown')).rejects.toThrow('No fake API route for /unknown');
  });

  it('fails with an HTTP error when asked to', async () => {
    mockApiError('/games', 503);
    await expect(apiClient.get('/games')).rejects.toThrow('status code 503');
  });

  it('rejects a held request when it is aborted', async () => {
    const response = deferred<unknown>();
    mockApi('/games', () => response.promise);
    const controller = new AbortController();

    const pending = apiClient.get('/games', { signal: controller.signal });
    controller.abort();

    await expect(pending).rejects.toBeInstanceOf(CanceledError);
  });

  it('starts each test with no routes or history', () => {
    expect(apiRequests).toHaveLength(0);
  });
});

describe('fake Supabase', () => {
  it('stores inserts and reads them back', async () => {
    await supabase.from('favorites').insert({ user_id: 'a', game_id: 1 });

    const { data } = await supabase.from('favorites').select();

    expect(data).toEqual([{ user_id: 'a', game_id: 1 }]);
  });

  it('deletes only rows matching every filter', async () => {
    supabaseFake.seed('favorites', [
      { user_id: 'a', game_id: 1 },
      { user_id: 'a', game_id: 2 },
      { user_id: 'b', game_id: 1 },
    ]);

    await supabase.from('favorites').delete().eq('user_id', 'a').eq('game_id', 1);

    expect(supabaseFake.rows('favorites')).toEqual([
      { user_id: 'a', game_id: 2 },
      { user_id: 'b', game_id: 1 },
    ]);
  });

  it('fails a query once when asked to, without changing data', async () => {
    supabaseFake.failNext('favorites', 'insert', 'Disk full');

    const failed = await supabase.from('favorites').insert({ game_id: 1 });
    expect(failed.error).toEqual({ message: 'Disk full' });
    expect(supabaseFake.rows('favorites')).toEqual([]);

    const retried = await supabase.from('favorites').insert({ game_id: 1 });
    expect(retried.error).toBeNull();
    expect(supabaseFake.rows('favorites')).toHaveLength(1);
  });

  it('delivers auth events until unsubscribed', () => {
    const listener = vi.fn();
    const { data } = supabase.auth.onAuthStateChange(listener);

    supabaseFake.emitAuth('SIGNED_OUT', null);
    data.subscription.unsubscribe();
    supabaseFake.emitAuth('SIGNED_OUT', null);

    expect(listener).toHaveBeenCalledTimes(1);
  });
});

describe('browser fakes', () => {
  it('reports intersections to observers of an element', () => {
    const callback = vi.fn();
    new IntersectionObserver(callback).observe(document.body);

    triggerIntersection();

    expect(callback.mock.calls[0][0][0].isIntersecting).toBe(true);
  });

  it('clears localStorage between tests: first write', () => {
    localStorage.setItem('leak', 'yes');
    expect(localStorage.getItem('leak')).toBe('yes');
  });

  it('clears localStorage between tests: next test sees nothing', () => {
    expect(localStorage.getItem('leak')).toBeNull();
  });
});

describe('renderWithProviders', () => {
  const Probe = () => {
    const viewMode = useAppSelector((state) => state.ui.viewMode);
    const { pathname } = useLocation();
    return <p>{`${viewMode} at ${pathname}`}</p>;
  };

  it('provides the store and router, starting from the given state', () => {
    const { store } = renderWithProviders(<Probe />, {
      route: '/collection',
      preloadedState: {
        ui: { viewMode: 'list', recentlyViewed: [], searchQueries: {}, isAuthModalOpen: false },
      },
    });

    expect(screen.getByText('list at /collection')).toBeInTheDocument();
    store.dispatch(setViewMode('grid'));
    expect(store.getState().ui.viewMode).toBe('grid');
  });
});
