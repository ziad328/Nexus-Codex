import { renderHook, waitFor } from '@testing-library/react';
import useGameAchievements from '../../src/hooks/useGameAchievements';
import useGameDetails from '../../src/hooks/useGameDetails';
import useGameStores from '../../src/hooks/useGameStores';
import useGameTrailers from '../../src/hooks/useGameTrailers';
import useScreenshots from '../../src/hooks/useScreenshots';
import useSimilarGames from '../../src/hooks/useSimilarGames';
import { apiRequests, deferred, mockApi, mockApiError } from '../fakes/network';

type GameListHook = (id: number | null) => {
  data: unknown[];
  error: string;
  isLoading: boolean;
};

const renderForGame = (hook: GameListHook, id: number | null = 1) =>
  renderHook(({ gameId }) => hook(gameId), { initialProps: { gameId: id } });

describe('useGameDetails', () => {
  const details = { id: 1, name: 'Portal' };

  it('makes no request without an id', () => {
    const { result } = renderHook(() => useGameDetails(null));

    expect(apiRequests).toEqual([]);
    expect(result.current).toEqual({ data: null, isLoading: false, error: '' });
  });

  it('shows loading, then the game', async () => {
    mockApi('/games/1', details);

    const { result } = renderHook(() => useGameDetails(1));

    expect(result.current.isLoading).toBe(true);
    await waitFor(() => expect(result.current.data).toEqual(details));
    expect(result.current.isLoading).toBe(false);
  });

  it('clears the old game while the next one loads', async () => {
    mockApi('/games/1', details);
    mockApi('/games/2', () => deferred().promise);
    const { result, rerender } = renderHook(({ id }) => useGameDetails(id), { initialProps: { id: 1 } });
    await waitFor(() => expect(result.current.data).toEqual(details));

    rerender({ id: 2 });

    expect(result.current.data).toBeNull();
    expect(result.current.isLoading).toBe(true);
  });

  it('reports an error, and clears it for the next game', async () => {
    mockApiError('/games/1', 404);
    mockApi('/games/2', { id: 2 });
    const { result, rerender } = renderHook(({ id }) => useGameDetails(id), { initialProps: { id: 1 } });

    await waitFor(() => expect(result.current.error).toMatch('status code 404'));
    expect(result.current.isLoading).toBe(false);

    rerender({ id: 2 });

    await waitFor(() => expect(result.current.data).toEqual({ id: 2 }));
    expect(result.current.error).toBe('');
  });

  it('aborts a stale request and ignores its answer', async () => {
    const stale = deferred<unknown>();
    mockApi('/games/1', () => stale.promise);
    mockApi('/games/2', { id: 2 });
    const { result, rerender } = renderHook(({ id }) => useGameDetails(id), { initialProps: { id: 1 } });

    rerender({ id: 2 });

    expect(apiRequests[0].signal?.aborted).toBe(true);
    await waitFor(() => expect(result.current.data).toEqual({ id: 2 }));
    stale.resolve({ id: 1 });
    await new Promise((resolve) => setTimeout(resolve));
    expect(result.current.data).toEqual({ id: 2 });
    expect(result.current.error).toBe('');
  });
});

describe('useScreenshots', () => {
  it('loads screenshots for the game', async () => {
    const shot = { id: 5, image: 'a.jpg', width: 1, height: 1 };
    mockApi('/games/1/screenshots', { results: [shot] });

    const { result } = renderForGame(useScreenshots);

    await waitFor(() => expect(result.current.data).toEqual([shot]));
  });

  it('is empty without an id', () => {
    const { result } = renderForGame(useScreenshots, null);

    expect(apiRequests).toEqual([]);
    expect(result.current).toEqual({ data: [], isLoading: false, error: '' });
  });

  it('empties when the id goes away', async () => {
    mockApi('/games/1/screenshots', { results: [{ id: 5 }] });
    const { result, rerender } = renderForGame(useScreenshots);
    await waitFor(() => expect(result.current.data).toHaveLength(1));

    rerender({ gameId: null });

    expect(result.current.data).toEqual([]);
  });

  it('reports an error', async () => {
    mockApiError('/games/1/screenshots');

    const { result } = renderForGame(useScreenshots);

    await waitFor(() => expect(result.current.error).not.toBe(''));
  });
});

describe('useGameAchievements', () => {
  it('loads the top 5 achievements', async () => {
    const achievement = { id: 9, name: 'First steps' };
    mockApi('/games/1/achievements', { results: [achievement] });

    const { result } = renderForGame(useGameAchievements);

    await waitFor(() => expect(result.current.data).toEqual([achievement]));
    expect(apiRequests[0].params).toMatchObject({ page_size: 5 });
  });

  it('makes no request without an id', () => {
    renderForGame(useGameAchievements, null);

    expect(apiRequests).toEqual([]);
  });

  it('loads again for another game', async () => {
    mockApi('/games/1/achievements', { results: [{ id: 1 }] });
    mockApi('/games/2/achievements', { results: [{ id: 2 }] });
    const { result, rerender } = renderForGame(useGameAchievements);
    await waitFor(() => expect(result.current.data).toEqual([{ id: 1 }]));

    rerender({ gameId: 2 });

    await waitFor(() => expect(result.current.data).toEqual([{ id: 2 }]));
  });
});

describe.each<[string, GameListHook, string]>([
  ['useGameTrailers', useGameTrailers, 'movies'],
  ['useGameStores', useGameStores, 'stores'],
  ['useSimilarGames', useSimilarGames, 'game-series'],
])('%s', (_name, hook, path) => {
  const urlFor = (id: number) => `/games/${id}/${path}`;

  it('loads results for the game', async () => {
    mockApi(urlFor(1), { results: [{ id: 7 }] });

    const { result } = renderForGame(hook);

    await waitFor(() => expect(result.current.data).toEqual([{ id: 7 }]));
    await waitFor(() => expect(result.current.isLoading).toBe(false));
  });

  it('makes no request without an id', () => {
    const { result } = renderForGame(hook, null);

    expect(apiRequests).toEqual([]);
    expect(result.current.data).toEqual([]);
  });

  it('reports an error', async () => {
    mockApiError(urlFor(1));

    const { result } = renderForGame(hook);

    await waitFor(() => expect(result.current.error).toMatch('status code 500'));
  });

  it('loads again for another game, aborting the old request', async () => {
    mockApi(urlFor(1), () => deferred().promise);
    mockApi(urlFor(2), { results: [{ id: 2 }] });
    const { result, rerender } = renderForGame(hook);

    rerender({ gameId: 2 });

    expect(apiRequests[0].signal?.aborted).toBe(true);
    await waitFor(() => expect(result.current.data).toEqual([{ id: 2 }]));
    expect(result.current.error).toBe('');
  });

  it.fails('BUG-3: does not show the previous game\'s results while the next one loads', async () => {
    mockApi(urlFor(1), { results: [{ id: 1 }] });
    mockApi(urlFor(2), () => deferred().promise);
    const { result, rerender } = renderForGame(hook);
    await waitFor(() => expect(result.current.data).toEqual([{ id: 1 }]));

    rerender({ gameId: 2 });
    await waitFor(() => expect(apiRequests).toHaveLength(2));

    expect(result.current.data).toEqual([]);
  });

  it.fails('BUG-12: a successful request clears the previous error', async () => {
    mockApiError(urlFor(1));
    mockApi(urlFor(2), { results: [{ id: 2 }] });
    const { result, rerender } = renderForGame(hook);
    await waitFor(() => expect(result.current.error).not.toBe(''));

    rerender({ gameId: 2 });
    await waitFor(() => expect(result.current.data).toHaveLength(1));

    expect(result.current.error).toBe('');
  });
});
