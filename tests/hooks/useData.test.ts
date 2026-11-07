import { renderHook, waitFor } from '@testing-library/react';
import useData from '../../src/hooks/useData';
import { apiRequests, deferred, mockApi, mockApiError } from '../fakes/network';

describe('useData', () => {
  it('shows loading, then the results', async () => {
    mockApi('/items', { results: [{ id: 1 }] });

    const { result } = renderHook(() => useData<{ id: number }>('/items'));

    expect(result.current.isLoading).toBe(true);
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.data).toEqual([{ id: 1 }]);
    expect(result.current.error).toBe('');
  });

  it('passes on request options', async () => {
    mockApi('/items', { results: [] });

    const { result } = renderHook(() => useData('/items', { params: { page_size: 5 } }));

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(apiRequests[0].params).toMatchObject({ page_size: 5 });
  });

  it('makes no request without an endpoint', () => {
    const { result } = renderHook(() => useData(''));

    expect(apiRequests).toEqual([]);
    expect(result.current).toEqual({ data: [], error: '', isLoading: false });
  });

  it('reports an error and stops loading', async () => {
    mockApiError('/items', 500);

    const { result } = renderHook(() => useData('/items'));

    await waitFor(() => expect(result.current.error).toMatch('status code 500'));
    expect(result.current.isLoading).toBe(false);
  });

  it('requests again when the endpoint changes, clearing old data first', async () => {
    const second = deferred<unknown>();
    mockApi('/one', { results: [{ id: 1 }] });
    mockApi('/two', () => second.promise);

    const { result, rerender } = renderHook(({ url }) => useData<{ id: number }>(url), {
      initialProps: { url: '/one' },
    });
    await waitFor(() => expect(result.current.data).toHaveLength(1));

    rerender({ url: '/two' });
    expect(result.current.data).toEqual([]);
    expect(result.current.isLoading).toBe(true);

    second.resolve({ results: [{ id: 2 }] });
    await waitFor(() => expect(result.current.data).toEqual([{ id: 2 }]));
  });

  it('requests again when a listed dependency changes', async () => {
    mockApi('/items', { results: [] });

    const { result, rerender } = renderHook(({ dep }) => useData('/items', undefined, [dep]), {
      initialProps: { dep: 1 },
    });
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    rerender({ dep: 2 });

    await waitFor(() => expect(apiRequests).toHaveLength(2));
  });

  it('aborts a stale request and ignores its answer', async () => {
    const first = deferred<unknown>();
    mockApi('/one', () => first.promise);
    mockApi('/two', { results: [{ id: 2 }] });

    const { result, rerender } = renderHook(({ url }) => useData<{ id: number }>(url), {
      initialProps: { url: '/one' },
    });
    rerender({ url: '/two' });

    expect(apiRequests[0].signal?.aborted).toBe(true);
    await waitFor(() => expect(result.current.data).toEqual([{ id: 2 }]));

    first.resolve({ results: [{ id: 1 }] });
    await new Promise((resolve) => setTimeout(resolve));
    expect(result.current.data).toEqual([{ id: 2 }]);
    expect(result.current.error).toBe('');
  });

  it('aborts when unmounted', () => {
    mockApi('/items', () => deferred().promise);

    const { unmount } = renderHook(() => useData('/items'));
    unmount();

    expect(apiRequests[0].signal?.aborted).toBe(true);
  });

  it.fails('BUG-12: a successful request clears the previous error', async () => {
    mockApiError('/one');
    mockApi('/two', { results: [{ id: 2 }] });

    const { result, rerender } = renderHook(({ url }) => useData(url), { initialProps: { url: '/one' } });
    await waitFor(() => expect(result.current.error).not.toBe(''));

    rerender({ url: '/two' });
    await waitFor(() => expect(result.current.data).toHaveLength(1));

    expect(result.current.error).toBe('');
  });
});
