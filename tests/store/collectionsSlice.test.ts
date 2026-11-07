import type { Collection, CollectionName } from '../../src/types';
import {
  addToCollectionInDb,
  clearCollections,
  fetchCollections,
  removeFromCollectionInDb,
} from '../../src/store/collectionsSlice';
import { supabaseFake } from '../fakes/supabase';
import { makeGame, makeRow, signedIn, USER_ID } from '../fixtures';
import { createTestStore } from '../render';

const withLists = (lists: Partial<Record<CollectionName, ReturnType<typeof makeGame>[]>>): { lists: Collection[] } => ({
  lists: (['playing', 'beaten', 'backlog', 'wishlist'] as const).map((name) => ({ name, games: lists[name] ?? [] })),
});

const idsIn = (store: ReturnType<typeof createTestStore>, name: CollectionName) =>
  store.getState().collections.lists.find((list) => list.name === name)?.games.map((game) => game.id);

const cloudKeys = () =>
  supabaseFake.rows('collections').map((row) => `${row.collection_name}:${row.game_id}`).sort();

describe('as a guest', () => {
  it('starts with the four empty lists', () => {
    const { lists } = createTestStore().getState().collections;
    expect(lists.map((list) => list.name)).toEqual(['playing', 'beaten', 'backlog', 'wishlist']);
    expect(lists.every((list) => list.games.length === 0)).toBe(true);
  });

  it('adds a game locally without touching the cloud', async () => {
    const store = createTestStore();

    await store.dispatch(addToCollectionInDb({ collectionName: 'playing', game: makeGame(1) }));

    expect(idsIn(store, 'playing')).toEqual([1]);
    expect(supabaseFake.queries()).toEqual([]);
  });

  it('does not add the same game to a list twice', async () => {
    const store = createTestStore();

    await store.dispatch(addToCollectionInDb({ collectionName: 'playing', game: makeGame(1) }));
    await store.dispatch(addToCollectionInDb({ collectionName: 'playing', game: makeGame(1) }));

    expect(idsIn(store, 'playing')).toEqual([1]);
  });

  it('lets one game sit in several lists', async () => {
    const store = createTestStore();

    await store.dispatch(addToCollectionInDb({ collectionName: 'playing', game: makeGame(1) }));
    await store.dispatch(addToCollectionInDb({ collectionName: 'wishlist', game: makeGame(1) }));

    expect(idsIn(store, 'playing')).toEqual([1]);
    expect(idsIn(store, 'wishlist')).toEqual([1]);
  });

  it('removes a game from one list only', async () => {
    const store = createTestStore({ collections: withLists({ playing: [makeGame(1)], beaten: [makeGame(1)] }) });

    await store.dispatch(removeFromCollectionInDb({ collectionName: 'playing', gameId: 1 }));

    expect(idsIn(store, 'playing')).toEqual([]);
    expect(idsIn(store, 'beaten')).toEqual([1]);
    expect(supabaseFake.queries()).toEqual([]);
  });

  it('keeps local lists when a merge is requested with nobody signed in', async () => {
    const store = createTestStore({ collections: withLists({ backlog: [makeGame(1)] }) });

    await store.dispatch(fetchCollections());

    expect(idsIn(store, 'backlog')).toEqual([1]);
    expect(supabaseFake.queries()).toEqual([]);
  });
});

describe('when signed in', () => {
  it('saves an added game with its full details to the cloud', async () => {
    const store = createTestStore({ auth: signedIn });
    const game = makeGame(1);

    await store.dispatch(addToCollectionInDb({ collectionName: 'playing', game }));

    expect(idsIn(store, 'playing')).toEqual([1]);
    expect(supabaseFake.rows('collections')).toEqual([makeRow(game, { collection_name: 'playing' })]);
  });

  it('keeps the list unchanged when saving fails, and reports the failure', async () => {
    const store = createTestStore({ auth: signedIn });
    supabaseFake.failNext('collections', 'insert');

    const result = await store.dispatch(addToCollectionInDb({ collectionName: 'playing', game: makeGame(1) }));

    expect(result.meta.requestStatus).toBe('rejected');
    expect(idsIn(store, 'playing')).toEqual([]);
  });

  it('deletes only this user, game and list from the cloud', async () => {
    const game = makeGame(1);
    supabaseFake.seed('collections', [
      makeRow(game, { collection_name: 'playing' }),
      makeRow(game, { collection_name: 'wishlist' }),
      makeRow(makeGame(2), { collection_name: 'playing' }),
      makeRow(game, { collection_name: 'playing', user_id: 'someone-else' }),
    ]);
    const store = createTestStore({
      auth: signedIn,
      collections: withLists({ playing: [game, makeGame(2)], wishlist: [game] }),
    });

    await store.dispatch(removeFromCollectionInDb({ collectionName: 'playing', gameId: 1 }));

    expect(idsIn(store, 'playing')).toEqual([2]);
    expect(idsIn(store, 'wishlist')).toEqual([1]);
    expect(supabaseFake.rows('collections')).toHaveLength(3);
    expect(supabaseFake.rows('collections').filter((row) => row.user_id === USER_ID && row.game_id === 1))
      .toEqual([makeRow(game, { collection_name: 'wishlist' })]);
  });

  it('keeps the game when deleting fails, and reports the failure', async () => {
    const store = createTestStore({ auth: signedIn, collections: withLists({ playing: [makeGame(1)] }) });
    supabaseFake.failNext('collections', 'delete');

    const result = await store.dispatch(removeFromCollectionInDb({ collectionName: 'playing', gameId: 1 }));

    expect(result.meta.requestStatus).toBe('rejected');
    expect(idsIn(store, 'playing')).toEqual([1]);
  });

  it('clears every list', () => {
    const store = createTestStore({ collections: withLists({ playing: [makeGame(1)], beaten: [makeGame(2)] }) });

    store.dispatch(clearCollections());

    expect(store.getState().collections.lists.every((list) => list.games.length === 0)).toBe(true);
  });
});

describe('merging local lists into the cloud at sign-in', () => {
  it('uploads local-only games and combines them with cloud games', async () => {
    supabaseFake.seed('collections', [makeRow(makeGame(1), { collection_name: 'playing' })]);
    const store = createTestStore({ auth: signedIn, collections: withLists({ playing: [makeGame(2)], backlog: [makeGame(3)] }) });

    await store.dispatch(fetchCollections());

    expect(idsIn(store, 'playing')).toEqual([1, 2]);
    expect(idsIn(store, 'backlog')).toEqual([3]);
    expect(cloudKeys()).toEqual(['backlog:3', 'playing:1', 'playing:2']);
  });

  it('labels uploads with the signed-in user and keeps their details', async () => {
    const game = makeGame(2, { metacritic: null, name: 'Null Score' });
    const store = createTestStore({ auth: signedIn, collections: withLists({ wishlist: [game] }) });

    await store.dispatch(fetchCollections());

    expect(supabaseFake.rows('collections')).toEqual([makeRow(game, { collection_name: 'wishlist' })]);
    expect(store.getState().collections.lists.find((list) => list.name === 'wishlist')?.games[0]).toEqual(game);
  });

  it('does not duplicate a game that is already in that cloud list', async () => {
    const game = makeGame(1);
    supabaseFake.seed('collections', [makeRow(game, { collection_name: 'playing' })]);
    const store = createTestStore({ auth: signedIn, collections: withLists({ playing: [game] }) });

    await store.dispatch(fetchCollections());

    expect(idsIn(store, 'playing')).toEqual([1]);
    expect(cloudKeys()).toEqual(['playing:1']);
    expect(supabaseFake.queries().filter((query) => query.operation === 'insert')).toEqual([]);
  });

  it('treats the same game in another list as a separate entry', async () => {
    const game = makeGame(1);
    supabaseFake.seed('collections', [makeRow(game, { collection_name: 'playing' })]);
    const store = createTestStore({ auth: signedIn, collections: withLists({ beaten: [game] }) });

    await store.dispatch(fetchCollections());

    expect(idsIn(store, 'playing')).toEqual([1]);
    expect(idsIn(store, 'beaten')).toEqual([1]);
    expect(cloudKeys()).toEqual(['beaten:1', 'playing:1']);
  });

  it('does not upload anything on a second merge', async () => {
    const store = createTestStore({ auth: signedIn, collections: withLists({ playing: [makeGame(1)] }) });

    await store.dispatch(fetchCollections());
    await store.dispatch(fetchCollections());

    expect(cloudKeys()).toEqual(['playing:1']);
    expect(idsIn(store, 'playing')).toEqual([1]);
  });

  it('ignores cloud rows for a list the app does not know', async () => {
    supabaseFake.seed('collections', [makeRow(makeGame(1), { collection_name: 'retired-list' })]);
    const store = createTestStore({ auth: signedIn });

    await store.dispatch(fetchCollections());

    expect(store.getState().collections.lists.every((list) => list.games.length === 0)).toBe(true);
  });

  it('keeps local lists when reading the cloud fails', async () => {
    const store = createTestStore({ auth: signedIn, collections: withLists({ playing: [makeGame(1)] }) });
    supabaseFake.failNext('collections', 'select');

    const result = await store.dispatch(fetchCollections());

    expect(result.meta.requestStatus).toBe('rejected');
    expect(idsIn(store, 'playing')).toEqual([1]);
    expect(supabaseFake.rows('collections')).toEqual([]);
  });

  describe('when the upload fails', () => {
    beforeEach(() => {
      vi.spyOn(console, 'error').mockImplementation(() => {});
    });

    afterEach(() => {
      vi.restoreAllMocks();
    });

    it('keeps the local game and uploads it on the next merge', async () => {
      const store = createTestStore({ auth: signedIn, collections: withLists({ playing: [makeGame(1)] }) });
      supabaseFake.failNext('collections', 'insert');

      await store.dispatch(fetchCollections());
      expect(idsIn(store, 'playing')).toEqual([1]);
      expect(supabaseFake.rows('collections')).toEqual([]);

      await store.dispatch(fetchCollections());
      expect(cloudKeys()).toEqual(['playing:1']);
    });

    it.fails('BUG-7: reports the failed upload instead of looking saved', async () => {
      const store = createTestStore({ auth: signedIn, collections: withLists({ playing: [makeGame(1)] }) });
      supabaseFake.failNext('collections', 'insert');

      const result = await store.dispatch(fetchCollections());

      expect(result.meta.requestStatus).toBe('rejected');
    });
  });

  it.fails('BUG-9: two merges at once do not upload a game twice', async () => {
    const store = createTestStore({ auth: signedIn, collections: withLists({ playing: [makeGame(1)] }) });

    await Promise.all([store.dispatch(fetchCollections()), store.dispatch(fetchCollections())]);

    expect(cloudKeys()).toEqual(['playing:1']);
  });

  it.fails('BUG-9: duplicate cloud rows show as one game', async () => {
    const row = makeRow(makeGame(1), { collection_name: 'playing' });
    supabaseFake.seed('collections', [row, row]);
    const store = createTestStore({ auth: signedIn });

    await store.dispatch(fetchCollections());

    expect(idsIn(store, 'playing')).toEqual([1]);
  });

  it.fails('ISSUE-5: a game deleted on another device stays deleted', async () => {
    const store = createTestStore({ auth: signedIn, collections: withLists({ playing: [makeGame(1)] }) });
    await store.dispatch(fetchCollections());

    supabaseFake.seed('collections', []);
    await store.dispatch(fetchCollections());

    expect(cloudKeys()).toEqual([]);
  });
});
