import { renderHook, waitFor } from '@testing-library/react';
import useGameDetails from '../../src/hooks/useGameDetails';
import { apiRequests, deferred, mockApi, mockApiError } from '../fakes/network';

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
