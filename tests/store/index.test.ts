import type { Session, User } from '@supabase/supabase-js';
import { makeGame } from '../fixtures';

const ROOT_KEY = 'persist:nexus-root';
const UI_KEY = 'persist:nexus-ui';

/** Each call builds the store the way a fresh page load does, reading whatever is in localStorage. */
const loadApp = async () => {
  vi.resetModules();
  const { store, persistor } = await import('../../src/store');
  await vi.waitFor(() => expect(persistor.getState().bootstrapped).toBe(true));
  return {
    store,
    persistor,
    collections: await import('../../src/store/collectionsSlice'),
    favorites: await import('../../src/store/favoritesSlice'),
    ui: await import('../../src/store/uiSlice'),
    auth: await import('../../src/store/authSlice'),
  };
};

const saved = (key: string) => JSON.parse(localStorage.getItem(key) ?? '{}');

describe('what is saved in the browser', () => {
  it('saves favorites and lists', async () => {
    const { store, persistor, favorites, collections } = await loadApp();

    await store.dispatch(favorites.toggleFavoriteInDb(makeGame(1)));
    await store.dispatch(collections.addToCollectionInDb({ collectionName: 'backlog', game: makeGame(2) }));
    await persistor.flush();

    const root = saved(ROOT_KEY);
    expect(JSON.parse(root.favorites).items[0].id).toBe(1);
    expect(JSON.parse(root.collections).lists.find((list: { name: string }) => list.name === 'backlog').games[0].id).toBe(2);
  });

  it('saves the view mode and Recently Viewed', async () => {
    const { store, persistor, ui } = await loadApp();

    store.dispatch(ui.setViewMode('list'));
    store.dispatch(ui.addRecentlyViewed(makeGame(1)));
    await persistor.flush();

    const uiSaved = saved(UI_KEY);
    expect(JSON.parse(uiSaved.viewMode)).toBe('list');
    expect(JSON.parse(uiSaved.recentlyViewed)[0].id).toBe(1);
  });

  it('never saves the session or user', async () => {
    const { store, persistor, auth } = await loadApp();

    store.dispatch(auth.setSession({
      session: { access_token: 'secret-token' } as Session,
      user: { id: 'user-1', email: 'player@example.com' } as User,
    }));
    await persistor.flush();

    expect(saved(ROOT_KEY).auth).toBeUndefined();
    expect(JSON.stringify({ ...localStorage })).not.toMatch(/secret-token|player@example\.com/);
  });

  it('does not save search text or the open sign-in modal', async () => {
    const { store, persistor, ui } = await loadApp();

    store.dispatch(ui.setSearchQuery({ path: '/', text: 'zelda' }));
    store.dispatch(ui.setAuthModalOpen(true));
    await persistor.flush();

    const uiSaved = saved(UI_KEY);
    expect(uiSaved.searchQueries).toBeUndefined();
    expect(uiSaved.isAuthModalOpen).toBeUndefined();
  });
});

describe('after a page reload', () => {
  it('restores everything that was saved', async () => {
    const first = await loadApp();
    await first.store.dispatch(first.favorites.toggleFavoriteInDb(makeGame(1)));
    await first.store.dispatch(first.collections.addToCollectionInDb({ collectionName: 'playing', game: makeGame(2) }));
    first.store.dispatch(first.ui.setViewMode('list'));
    first.store.dispatch(first.ui.addRecentlyViewed(makeGame(3)));
    await first.persistor.flush();

    const { store } = await loadApp();
    const state = store.getState();

    expect(state.favorites.items.map((game) => game.id)).toEqual([1]);
    expect(state.collections.lists.find((list) => list.name === 'playing')?.games[0].id).toBe(2);
    expect(state.ui.viewMode).toBe('list');
    expect(state.ui.recentlyViewed[0].id).toBe(3);
  });

  it('starts with defaults for what was not saved', async () => {
    const first = await loadApp();
    first.store.dispatch(first.ui.setSearchQuery({ path: '/', text: 'zelda' }));
    first.store.dispatch(first.ui.setAuthModalOpen(true));
    await first.persistor.flush();

    const { store } = await loadApp();

    expect(store.getState().ui.searchQueries).toEqual({});
    expect(store.getState().ui.isAuthModalOpen).toBe(false);
    expect(store.getState().auth.user).toBeNull();
  });

  it('still starts when the saved data is corrupted', async () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
    localStorage.setItem(ROOT_KEY, '{not json');

    const { store } = await loadApp();

    expect(store.getState().favorites.items).toEqual([]);
    consoleError.mockRestore();
  });
});
