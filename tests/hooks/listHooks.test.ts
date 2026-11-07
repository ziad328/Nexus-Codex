import { renderHook, waitFor } from '@testing-library/react';
import usePlatforms from '../../src/hooks/usePlatforms';
import useStoresList from '../../src/hooks/useStoresList';
import useTags from '../../src/hooks/useTags';
import { apiRequests, deferred, mockApi, mockApiError } from '../fakes/network';

describe('usePlatforms', () => {
  const pc = { id: 1, name: 'PC', slug: 'pc' };

  it('loads parent platforms', async () => {
    mockApi('/platforms/lists/parents', { results: [pc] });

    const { result } = renderHook(() => usePlatforms());

    await waitFor(() => expect(result.current.data).toEqual([pc]));
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.error).toBe('');
  });

  it('reports loading while the request runs', async () => {
    const response = deferred<unknown>();
    mockApi('/platforms/lists/parents', () => response.promise);

    const { result } = renderHook(() => usePlatforms());

    await waitFor(() => expect(result.current.isLoading).toBe(true));
    response.resolve({ results: [] });
    await waitFor(() => expect(result.current.isLoading).toBe(false));
  });

  it('reports an error', async () => {
    mockApiError('/platforms/lists/parents');

    const { result } = renderHook(() => usePlatforms());

    await waitFor(() => expect(result.current.error).toMatch('status code 500'));
    expect(result.current.data).toEqual([]);
  });

  it('aborts when unmounted, without reporting an error', async () => {
    mockApi('/platforms/lists/parents', () => deferred().promise);

    const { result, unmount } = renderHook(() => usePlatforms());
    unmount();

    expect(apiRequests[0].signal?.aborted).toBe(true);
    expect(result.current.error).toBe('');
  });
});

describe('useTags', () => {
  it('loads the top 20 tags', async () => {
    const tag = { id: 1, name: 'Co-op', slug: 'co-op' };
    mockApi('/tags', { results: [tag] });

    const { result } = renderHook(() => useTags());

    await waitFor(() => expect(result.current.data).toEqual([tag]));
    expect(apiRequests[0].params).toMatchObject({ page_size: 20 });
  });

  it('reports an error', async () => {
    mockApiError('/tags');

    const { result } = renderHook(() => useTags());

    await waitFor(() => expect(result.current.error).not.toBe(''));
  });
});

describe('useStoresList', () => {
  it('loads stores', async () => {
    const store = { id: 1, name: 'Steam', slug: 'steam', domain: 'steampowered.com' };
    mockApi('/stores', { results: [store] });

    const { result } = renderHook(() => useStoresList());

    await waitFor(() => expect(result.current.data).toEqual([store]));
  });

  it('reports an error', async () => {
    mockApiError('/stores');

    const { result } = renderHook(() => useStoresList());

    await waitFor(() => expect(result.current.error).not.toBe(''));
  });
});
