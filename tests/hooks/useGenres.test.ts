import { renderHook, waitFor } from '@testing-library/react';
import useGenres from '../../src/hooks/useGenres';
import { apiRequests, deferred, mockApi, mockApiError } from '../fakes/network';

const CACHE_KEY = 'nexus-genres-v2';
const action = { id: 1, name: 'Action', slug: 'action', image_background: 'action.jpg' };
const puzzle = { id: 2, name: 'Puzzle', slug: 'puzzle', image_background: 'puzzle.jpg' };

describe('with no cache', () => {
  it('shows loading, then genres, and saves them', async () => {
    mockApi('/genres', { results: [action] });

    const { result } = renderHook(() => useGenres());

    expect(result.current.isLoading).toBe(true);
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.data).toEqual([action]);
    expect(JSON.parse(localStorage.getItem(CACHE_KEY)!)).toEqual([action]);
  });

  it('reports an error', async () => {
    mockApiError('/genres');

    const { result } = renderHook(() => useGenres());

    await waitFor(() => expect(result.current.error).toMatch('status code 500'));
    expect(result.current.isLoading).toBe(false);
    expect(localStorage.getItem(CACHE_KEY)).toBeNull();
  });

  it('asks for genres only once (BUG-15, fixed)', async () => {
    mockApi('/genres', { results: [action] });

    const { result } = renderHook(() => useGenres());
    await waitFor(() => expect(result.current.data).toHaveLength(1));
    await new Promise((resolve) => setTimeout(resolve));

    expect(apiRequests).toHaveLength(1);
  });
});

describe('with a cache', () => {
  beforeEach(() => {
    localStorage.setItem(CACHE_KEY, JSON.stringify([action]));
  });

  it('shows cached genres straight away while checking for new ones', () => {
    mockApi('/genres', () => deferred().promise);

    const { result } = renderHook(() => useGenres());

    expect(result.current.data).toEqual([action]);
    expect(result.current.isLoading).toBe(false);
    expect(apiRequests).toHaveLength(1);
  });

  it('updates the list and the cache when genres changed', async () => {
    mockApi('/genres', { results: [action, puzzle] });

    const { result } = renderHook(() => useGenres());

    await waitFor(() => expect(result.current.data).toEqual([action, puzzle]));
    expect(JSON.parse(localStorage.getItem(CACHE_KEY)!)).toEqual([action, puzzle]);
  });

  it('leaves everything alone when genres are unchanged', async () => {
    mockApi('/genres', { results: [action] });
    const setItem = vi.spyOn(Storage.prototype, 'setItem');

    const { result } = renderHook(() => useGenres());
    await waitFor(() => expect(apiRequests).toHaveLength(1));
    await new Promise((resolve) => setTimeout(resolve));

    expect(result.current.data).toEqual([action]);
    expect(setItem).not.toHaveBeenCalled();
    setItem.mockRestore();
  });

  it('keeps cached genres when the update fails', async () => {
    mockApiError('/genres');

    const { result } = renderHook(() => useGenres());

    await waitFor(() => expect(result.current.error).not.toBe(''));
    expect(result.current.data).toEqual([action]);
    expect(JSON.parse(localStorage.getItem(CACHE_KEY)!)).toEqual([action]);
  });
});

describe('with a corrupted cache', () => {
  it('ignores it and loads fresh genres', async () => {
    localStorage.setItem(CACHE_KEY, '{not json');
    mockApi('/genres', { results: [action] });

    const { result } = renderHook(() => useGenres());

    expect(result.current.data).toEqual([]);
    expect(result.current.isLoading).toBe(true);
    await waitFor(() => expect(result.current.data).toEqual([action]));
  });
});

describe('shared by every user', () => {
  it('sends one request for several users, and gives each the genres', async () => {
    const answer = deferred<{ results: object[] }>();
    mockApi('/genres', () => answer.promise);

    const first = renderHook(() => useGenres());
    const second = renderHook(() => useGenres());
    answer.resolve({ results: [action] });

    await waitFor(() => expect(first.result.current.data).toEqual([action]));
    await waitFor(() => expect(second.result.current.data).toEqual([action]));
    expect(apiRequests).toHaveLength(1);
  });

  it('gives a later user the same answer without asking again', async () => {
    mockApi('/genres', { results: [action] });
    const first = renderHook(() => useGenres());
    await waitFor(() => expect(first.result.current.data).toEqual([action]));

    const later = renderHook(() => useGenres());

    await waitFor(() => expect(later.result.current.isLoading).toBe(false));
    expect(later.result.current.data).toEqual([action]);
    expect(apiRequests).toHaveLength(1);
  });

  it('tries again for the next user after a failure', async () => {
    mockApiError('/genres');
    const first = renderHook(() => useGenres());
    await waitFor(() => expect(first.result.current.error).not.toBe(''));

    mockApi('/genres', { results: [action] });
    const next = renderHook(() => useGenres());

    await waitFor(() => expect(next.result.current.data).toEqual([action]));
    expect(next.result.current.error).toBe('');
    expect(apiRequests).toHaveLength(2);
  });
});
