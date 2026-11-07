import { act, renderHook, waitFor } from '@testing-library/react';
import useGames from '../../src/hooks/useGames';
import type { GameQuery, Platform } from '../../src/types';
import { apiRequests, deferred, mockApi, mockApiError } from '../fakes/network';
import type { RecordedRequest } from '../fakes/network';

const game = (id: number, overrides: object = {}) => ({
  id,
  name: `Game ${id}`,
  slug: `game-${id}`,
  background_image: '',
  parent_platforms: [],
  metacritic: 80,
  rating_top: 5,
  ...overrides,
});

const page = (ids: number[], hasMore = true) => ({
  count: 100,
  next: hasMore ? 'https://api.example/next' : null,
  results: ids.map((id) => game(id)),
});

/** Page 1 holds games 1-2, page 2 holds 3-4, and page 2 is the last. */
const mockTwoPages = () => {
  mockApi('/games', ({ params }: RecordedRequest) => (params.page === 1 ? page([1, 2]) : page([3, 4], false)));
};

const render = (query: GameQuery = {}) =>
  renderHook(({ gameQuery }) => useGames(gameQuery), { initialProps: { gameQuery: query } });

const ids = (result: { current: ReturnType<typeof useGames> }) => result.current.data.map((item) => item.id);

const settled = (result: { current: ReturnType<typeof useGames> }) =>
  waitFor(() => {
    expect(result.current.isLoading).toBe(false);
    expect(result.current.isFetchingNextPage).toBe(false);
  });

describe('first page', () => {
  it('shows loading, then the games', async () => {
    mockTwoPages();

    const { result } = render();

    expect(result.current.isLoading).toBe(true);
    await settled(result);
    expect(ids(result)).toEqual([1, 2]);
    expect(result.current.hasNextPage).toBe(true);
    expect(result.current.error).toBe('');
  });

  it('turns every filter into its API parameter', async () => {
    mockTwoPages();
    const platform: Platform = { id: 7, name: 'Nintendo', slug: 'nintendo' };

    const { result } = render({
      genreSlug: 'rpg',
      platform,
      sortOrder: '-rating',
      searchText: 'zelda',
      developers: 'nintendo-epd',
      publishers: 'nintendo',
      storeId: 3,
      tagSlug: 'co-op',
    });
    await settled(result);

    expect(apiRequests[0].url).toBe('/games');
    expect(apiRequests[0].params).toMatchObject({
      genres: 'rpg',
      parent_platforms: 7,
      ordering: '-rating',
      search: 'zelda',
      developers: 'nintendo-epd',
      publishers: 'nintendo',
      stores: 3,
      tags: 'co-op',
      page: 1,
    });
  });

  it('leaves out empty search text', async () => {
    mockTwoPages();

    const { result } = render({ searchText: '' });
    await settled(result);

    expect(apiRequests[0].params.search).toBeUndefined();
  });
});

describe('next pages', () => {
  it('adds the next page after the current games', async () => {
    mockTwoPages();
    const { result } = render();
    await settled(result);

    act(() => result.current.fetchNextPage());

    expect(result.current.isFetchingNextPage).toBe(true);
    expect(result.current.isLoading).toBe(false);
    await settled(result);
    expect(ids(result)).toEqual([1, 2, 3, 4]);
    expect(apiRequests.at(-1)?.params.page).toBe(2);
  });

  it('reports no more pages when the API has no next link', async () => {
    mockTwoPages();
    const { result } = render();
    await settled(result);

    act(() => result.current.fetchNextPage());
    await settled(result);

    expect(result.current.hasNextPage).toBe(false);
  });

  it('keeps loaded games when the next page fails', async () => {
    mockTwoPages();
    const { result } = render();
    await settled(result);

    mockApiError('/games');
    act(() => result.current.fetchNextPage());

    await waitFor(() => expect(result.current.error).toMatch('status code 500'));
    expect(ids(result)).toEqual([1, 2]);
    expect(result.current.isFetchingNextPage).toBe(false);
  });
});

describe('when filters change', () => {
  it('goes back to page 1 and replaces the games', async () => {
    mockTwoPages();
    const { result, rerender } = render();
    await settled(result);
    act(() => result.current.fetchNextPage());
    await settled(result);

    mockApi('/games', page([9]));
    rerender({ gameQuery: { genreSlug: 'rpg' } });

    await waitFor(() => expect(ids(result)).toEqual([9]));
    expect(apiRequests.at(-1)?.params).toMatchObject({ genres: 'rpg', page: 1 });
    expect(result.current.hasNextPage).toBe(true);
  });

  it('clears old games straight away', async () => {
    mockTwoPages();
    const { result, rerender } = render();
    await settled(result);

    mockApi('/games', () => deferred().promise);
    rerender({ gameQuery: { genreSlug: 'rpg' } });

    expect(result.current.data).toEqual([]);
    expect(result.current.isLoading).toBe(true);
  });

  it('clears a previous error', async () => {
    mockApiError('/games');
    const { result, rerender } = render();
    await waitFor(() => expect(result.current.error).not.toBe(''));

    mockApi('/games', page([1]));
    rerender({ gameQuery: { genreSlug: 'rpg' } });

    await waitFor(() => expect(ids(result)).toEqual([1]));
    expect(result.current.error).toBe('');
  });

  it('does not refetch when given an equal query', async () => {
    mockTwoPages();
    const { result, rerender } = render({ genreSlug: 'rpg' });
    await settled(result);

    rerender({ gameQuery: { genreSlug: 'rpg' } });
    await settled(result);

    expect(apiRequests).toHaveLength(1);
  });

  it.fails('BUG-13: changing a filter on page 2 asks only for page 1', async () => {
    mockTwoPages();
    const { result, rerender } = render();
    await settled(result);
    act(() => result.current.fetchNextPage());
    await settled(result);
    apiRequests.length = 0;

    rerender({ gameQuery: { genreSlug: 'rpg' } });
    await settled(result);

    expect(apiRequests.map((request) => request.params.page)).toEqual([1]);
  });
});

describe('stale requests', () => {
  it('aborts the old request and ignores its answer', async () => {
    const stale = deferred<unknown>();
    mockApi('/games', () => stale.promise);
    const { result, rerender } = render({ genreSlug: 'old' });

    mockApi('/games', page([2]));
    rerender({ gameQuery: { genreSlug: 'new' } });

    expect(apiRequests[0].signal?.aborted).toBe(true);
    await waitFor(() => expect(ids(result)).toEqual([2]));

    stale.resolve(page([1]));
    await new Promise((resolve) => setTimeout(resolve));
    expect(ids(result)).toEqual([2]);
    expect(result.current.error).toBe('');
  });

  it('aborts when unmounted', () => {
    mockApi('/games', () => deferred().promise);

    const { unmount } = render();
    unmount();

    expect(apiRequests[0].signal?.aborted).toBe(true);
  });
});

describe('errors', () => {
  it('reports a failed first page and stops loading', async () => {
    mockApiError('/games', 503);

    const { result } = render();

    await waitFor(() => expect(result.current.error).toMatch('status code 503'));
    expect(result.current.isLoading).toBe(false);
    expect(result.current.data).toEqual([]);
  });
});

describe('adult-content filter', () => {
  const resultsFor = async (games: object[]) => {
    mockApi('/games', { count: games.length, next: null, results: games });
    const { result } = render();
    await settled(result);
    return ids(result);
  };

  it.each(['Hentai Quest', 'NSFW Adventure', 'lewd tales', 'Adults Only Island', 'Uncensored Nights'])(
    'hides a game named "%s"',
    async (name) => {
      expect(await resultsFor([game(1, { name }), game(2)])).toEqual([2]);
    },
  );

  it.each(['summer-hentai', 'my-nsfw-game', 'uncensored-edition'])('hides a game with the slug "%s"', async (slug) => {
    expect(await resultsFor([game(1, { slug }), game(2)])).toEqual([2]);
  });

  it.each(['nudity', 'sexual-content', 'NSFW', 'adults-only'])('hides a game tagged "%s"', async (slug) => {
    expect(await resultsFor([game(1, { tags: [{ id: 1, name: slug, slug }] }), game(2)])).toEqual([2]);
  });

  it.each(['Essex Stories', 'Sussex Farm', 'Portal 2', 'Barbarian', 'Nudge'])('keeps "%s"', async (name) => {
    expect(await resultsFor([game(1, { name })])).toEqual([1]);
  });

  it('keeps a game with ordinary tags', async () => {
    const tags = [{ id: 1, name: 'Singleplayer', slug: 'singleplayer' }];
    expect(await resultsFor([game(1, { tags })])).toEqual([1]);
  });

  it('copes with a game that has no tags', async () => {
    expect(await resultsFor([game(1, { tags: undefined })])).toEqual([1]);
  });

  it.fails("BUG-14: keeps Command & Conquer: Yuri's Revenge", async () => {
    expect(await resultsFor([game(1, { name: "Command & Conquer: Yuri's Revenge", slug: 'cc-revenge' })])).toEqual([1]);
  });
});
