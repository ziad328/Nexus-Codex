import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import type { Collection, CollectionName, FavoriteGame } from '../types';
import { supabase } from '../utils/supabase';
import type { RootState } from './index';

interface CollectionsState {
  lists: Collection[];
  // `${list}_${gameId}` keys known to be in the cloud. One missing from the cloud was removed on another device (ISSUE-5),
  // so the merge drops it instead of uploading it again. Absent in lists saved before this existed.
  synced?: string[];
}

const keyOf = (collectionName: CollectionName, gameId: number) => `${collectionName}_${gameId}`;

const DEFAULT_COLLECTIONS: CollectionName[] = ['playing', 'beaten', 'backlog', 'wishlist'];

const initialState: CollectionsState = {
  lists: DEFAULT_COLLECTIONS.map((name) => ({ name, games: [] })),
};

// One merge at a time: two at once would both upload the same local games.
let merging = false;

interface Merged {
  lists: Collection[];
  synced: string[];
}

export const fetchCollections = createAsyncThunk<Merged | null, void, { rejectValue: Merged }>(
  'collections/fetchCollections',
  async (_, { getState, rejectWithValue }) => {
    const state = getState() as RootState;
    const user = state.auth.user;
    if (!user) return null;
    merging = true;
    try {
      const localLists = state.collections.lists;

      const { data: cloudData, error } = await supabase.from('collections').select('*');
      if (error) throw error;

      const cloudRecords = new Set<string>();
      // Duplicate cloud rows (two devices saving at once) show as one game.
      const cloudRows = cloudData.filter((item) => {
        const key = keyOf(item.collection_name, item.game_id);
        if (cloudRecords.has(key)) return false;
        cloudRecords.add(key);
        return true;
      });

      const itemsToUpload: (Omit<FavoriteGame, 'id'> & { user_id: string; game_id: number; collection_name: CollectionName })[] = [];
      const synced = new Set(state.collections.synced);
      localLists.forEach(list => {
        list.games.forEach(game => {
          const key = keyOf(list.name, game.id);
          if (!cloudRecords.has(key) && !synced.has(key)) {
            itemsToUpload.push({
              user_id: user.id,
              game_id: game.id,
              collection_name: list.name,
              name: game.name,
              slug: game.slug,
              background_image: game.background_image,
              metacritic: game.metacritic,
              parent_platforms: game.parent_platforms,
            });
          }
        });
      });

      let uploadFailed = false;
      if (itemsToUpload.length > 0) {
        const { error: insertError } = await supabase.from('collections').insert(itemsToUpload);
        if (insertError) uploadFailed = true;
      }

      const lists = DEFAULT_COLLECTIONS.map((name) => ({ name, games: [] as FavoriteGame[] }));

      cloudRows.forEach(item => {
        const list = lists.find(l => l.name === item.collection_name);
        if (list) {
          list.games.push({
            id: item.game_id,
            name: item.name,
            slug: item.slug,
            background_image: item.background_image,
            metacritic: item.metacritic,
            parent_platforms: item.parent_platforms,
          });
        }
      });

      itemsToUpload.forEach(item => {
        const list = lists.find(l => l.name === item.collection_name);
        if (list) {
          list.games.push({
            id: item.game_id,
            name: item.name,
            slug: item.slug,
            background_image: item.background_image,
            metacritic: item.metacritic,
            parent_platforms: item.parent_platforms,
          });
        }
      });

      // A failed upload keeps the games on this device, unsynced so the next merge retries them, and rejects, so the app can say so.
      const syncedKeys = uploadFailed
        ? [...cloudRecords]
        : [...cloudRecords, ...itemsToUpload.map(item => keyOf(item.collection_name, item.game_id))];
      return uploadFailed ? rejectWithValue({ lists, synced: syncedKeys }) : { lists, synced: syncedKeys };
    } finally {
      merging = false;
    }
  },
  { condition: () => !merging },
);

export const addToCollectionInDb = createAsyncThunk(
  'collections/addToCollectionInDb',
  async ({ collectionName, game }: { collectionName: CollectionName; game: FavoriteGame }, { getState }) => {
    const state = getState() as RootState;
    const user = state.auth.user;
    
    if (!user) {
      return { collectionName, game, localOnly: true };
    }

    const { error } = await supabase
      .from('collections')
      .insert({
        user_id: user.id,
        game_id: game.id,
        collection_name: collectionName,
        name: game.name,
        slug: game.slug,
        background_image: game.background_image,
        metacritic: game.metacritic,
        parent_platforms: game.parent_platforms,
      });
      
    if (error) throw error;
    return { collectionName, game };
  }
);

export const removeFromCollectionInDb = createAsyncThunk(
  'collections/removeFromCollectionInDb',
  async ({ collectionName, gameId }: { collectionName: CollectionName; gameId: number }, { getState }) => {
    const state = getState() as RootState;
    const user = state.auth.user;
    
    if (!user) {
      return { collectionName, gameId, localOnly: true };
    }

    const { error } = await supabase
      .from('collections')
      .delete()
      .eq('user_id', user.id)
      .eq('game_id', gameId)
      .eq('collection_name', collectionName);
      
    if (error) throw error;
    return { collectionName, gameId };
  }
);

const collectionsSlice = createSlice({
  name: 'collections',
  initialState,
  reducers: {
    clearCollections: () => initialState,
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchCollections.fulfilled, (state, action) => {
        if (action.payload) Object.assign(state, action.payload);
      })
      .addCase(fetchCollections.rejected, (state, action) => {
        if (action.payload) Object.assign(state, action.payload);
      })
      .addCase(addToCollectionInDb.fulfilled, (state, action) => {
        if (!action.payload) return;
        const { collectionName, game } = action.payload;
        const key = keyOf(collectionName, game.id);
        // Saved while signed out: new, so the next merge uploads it. Saved while signed in: already in the cloud.
        state.synced = 'localOnly' in action.payload
          ? state.synced?.filter((k) => k !== key)
          : [...(state.synced ?? []).filter((k) => k !== key), key];
        const collection = state.lists.find((l) => l.name === collectionName);
        if (collection && !collection.games.some((g) => g.id === game.id)) {
          collection.games.push(game);
        }
      })
      .addCase(removeFromCollectionInDb.fulfilled, (state, action) => {
        if (!action.payload) return;
        const { collectionName, gameId } = action.payload;
        if (!('localOnly' in action.payload)) state.synced = state.synced?.filter((k) => k !== keyOf(collectionName, gameId));
        const collection = state.lists.find((l) => l.name === collectionName);
        if (collection) {
          collection.games = collection.games.filter((g) => g.id !== gameId);
        }
      });
  }
});

export const { clearCollections } = collectionsSlice.actions;
export default collectionsSlice.reducer;
