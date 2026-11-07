import { clearFavorites, fetchFavorites, toggleFavoriteInDb } from '../../src/store/favoritesSlice';
import { supabaseFake } from '../fakes/supabase';
import { makeGame, makeRow, signedIn, USER_ID } from '../fixtures';
import { createTestStore } from '../render';

const favoriteIds = (store: ReturnType<typeof createTestStore>) =>
  store.getState().favorites.items.map((game) => game.id);

const cloudIds = () => supabaseFake.rows('favorites').map((row) => row.game_id);

describe('as a guest', () => {
  it('adds a favorite locally without touching the cloud', async () => {
    const store = createTestStore();

    await store.dispatch(toggleFavoriteInDb(makeGame(1)));

    expect(favoriteIds(store)).toEqual([1]);
    expect(supabaseFake.queries()).toEqual([]);
  });

  it('removes it when toggled again', async () => {
    const store = createTestStore({ favorites: { items: [makeGame(1), makeGame(2)] } });

    await store.dispatch(toggleFavoriteInDb(makeGame(1)));

    expect(favoriteIds(store)).toEqual([2]);
    expect(supabaseFake.queries()).toEqual([]);
  });

  it.fails('BUG-10: keeps local favorites when a merge is requested with nobody signed in', async () => {
    const store = createTestStore({ favorites: { items: [makeGame(1)] } });

    await store.dispatch(fetchFavorites());

    expect(favoriteIds(store)).toEqual([1]);
  });
});

describe('when signed in', () => {
  it('saves a new favorite with its full details', async () => {
    const store = createTestStore({ auth: signedIn });
    const game = makeGame(1);

    await store.dispatch(toggleFavoriteInDb(game));

    expect(favoriteIds(store)).toEqual([1]);
    expect(supabaseFake.rows('favorites')).toEqual([makeRow(game)]);
  });

  it('keeps favorites unchanged when saving fails, and reports the failure', async () => {
    const store = createTestStore({ auth: signedIn });
    supabaseFake.failNext('favorites', 'insert');

    const result = await store.dispatch(toggleFavoriteInDb(makeGame(1)));

    expect(result.meta.requestStatus).toBe('rejected');
    expect(favoriteIds(store)).toEqual([]);
  });

  it('deletes only this user and game from the cloud', async () => {
    const game = makeGame(1);
    supabaseFake.seed('favorites', [
      makeRow(game),
      makeRow(makeGame(2)),
      makeRow(game, { user_id: 'someone-else' }),
    ]);
    const store = createTestStore({ auth: signedIn, favorites: { items: [game, makeGame(2)] } });

    await store.dispatch(toggleFavoriteInDb(game));

    expect(favoriteIds(store)).toEqual([2]);
    expect(supabaseFake.rows('favorites')).toEqual([
      makeRow(makeGame(2)),
      makeRow(game, { user_id: 'someone-else' }),
    ]);
  });

  it('keeps the favorite when deleting fails, and reports the failure', async () => {
    const game = makeGame(1);
    supabaseFake.seed('favorites', [makeRow(game)]);
    const store = createTestStore({ auth: signedIn, favorites: { items: [game] } });
    supabaseFake.failNext('favorites', 'delete');

    const result = await store.dispatch(toggleFavoriteInDb(game));

    expect(result.meta.requestStatus).toBe('rejected');
    expect(favoriteIds(store)).toEqual([1]);
    expect(cloudIds()).toEqual([1]);
  });

  it('clears favorites', () => {
    const store = createTestStore({ favorites: { items: [makeGame(1)] } });

    store.dispatch(clearFavorites());

    expect(favoriteIds(store)).toEqual([]);
  });
});

describe('merging local favorites into the cloud at sign-in', () => {
  it('uploads local-only games and combines them with cloud games', async () => {
    supabaseFake.seed('favorites', [makeRow(makeGame(1))]);
    const store = createTestStore({ auth: signedIn, favorites: { items: [makeGame(2)] } });

    await store.dispatch(fetchFavorites());

    expect(favoriteIds(store)).toEqual([1, 2]);
    expect(cloudIds()).toEqual([1, 2]);
  });

  it('labels uploads with the signed-in user and rebuilds games from cloud rows', async () => {
    const cloudGame = makeGame(1, { metacritic: null });
    const localGame = makeGame(2);
    supabaseFake.seed('favorites', [makeRow(cloudGame)]);
    const store = createTestStore({ auth: signedIn, favorites: { items: [localGame] } });

    await store.dispatch(fetchFavorites());

    expect(supabaseFake.rows('favorites')[1]).toEqual(makeRow(localGame));
    expect(supabaseFake.rows('favorites')[1].user_id).toBe(USER_ID);
    expect(store.getState().favorites.items).toEqual([cloudGame, localGame]);
  });

  it('does not duplicate a game already in the cloud', async () => {
    const game = makeGame(1);
    supabaseFake.seed('favorites', [makeRow(game)]);
    const store = createTestStore({ auth: signedIn, favorites: { items: [game] } });

    await store.dispatch(fetchFavorites());

    expect(favoriteIds(store)).toEqual([1]);
    expect(cloudIds()).toEqual([1]);
    expect(supabaseFake.queries().filter((query) => query.operation === 'insert')).toEqual([]);
  });

  it('does not upload anything on a second merge', async () => {
    const store = createTestStore({ auth: signedIn, favorites: { items: [makeGame(1)] } });

    await store.dispatch(fetchFavorites());
    await store.dispatch(fetchFavorites());

    expect(cloudIds()).toEqual([1]);
    expect(favoriteIds(store)).toEqual([1]);
  });

  it('keeps local favorites when reading the cloud fails', async () => {
    const store = createTestStore({ auth: signedIn, favorites: { items: [makeGame(1)] } });
    supabaseFake.failNext('favorites', 'select');

    const result = await store.dispatch(fetchFavorites());

    expect(result.meta.requestStatus).toBe('rejected');
    expect(favoriteIds(store)).toEqual([1]);
  });

  describe('when the upload fails', () => {
    beforeEach(() => {
      vi.spyOn(console, 'error').mockImplementation(() => {});
    });

    afterEach(() => {
      vi.restoreAllMocks();
    });

    it('keeps the local game and uploads it on the next merge', async () => {
      const store = createTestStore({ auth: signedIn, favorites: { items: [makeGame(1)] } });
      supabaseFake.failNext('favorites', 'insert');

      await store.dispatch(fetchFavorites());
      expect(favoriteIds(store)).toEqual([1]);
      expect(cloudIds()).toEqual([]);

      await store.dispatch(fetchFavorites());
      expect(cloudIds()).toEqual([1]);
    });

    it.fails('BUG-7: reports the failed upload instead of looking saved', async () => {
      const store = createTestStore({ auth: signedIn, favorites: { items: [makeGame(1)] } });
      supabaseFake.failNext('favorites', 'insert');

      const result = await store.dispatch(fetchFavorites());

      expect(result.meta.requestStatus).toBe('rejected');
    });
  });

  it.fails('BUG-9: two merges at once do not upload a game twice', async () => {
    const store = createTestStore({ auth: signedIn, favorites: { items: [makeGame(1)] } });

    await Promise.all([store.dispatch(fetchFavorites()), store.dispatch(fetchFavorites())]);

    expect(cloudIds()).toEqual([1]);
  });

  it.fails('BUG-9: duplicate cloud rows show as one game', async () => {
    const row = makeRow(makeGame(1));
    supabaseFake.seed('favorites', [row, row]);
    const store = createTestStore({ auth: signedIn });

    await store.dispatch(fetchFavorites());

    expect(favoriteIds(store)).toEqual([1]);
  });

  it.fails('ISSUE-5: a game deleted on another device stays deleted', async () => {
    const store = createTestStore({ auth: signedIn, favorites: { items: [makeGame(1)] } });
    await store.dispatch(fetchFavorites());

    supabaseFake.seed('favorites', []);
    await store.dispatch(fetchFavorites());

    expect(cloudIds()).toEqual([]);
  });
});
