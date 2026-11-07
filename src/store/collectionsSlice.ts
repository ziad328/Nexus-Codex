import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import type { Collection, CollectionName, FavoriteGame } from '../types';
import { supabase } from '../utils/supabase';
import type { RootState } from './index';

interface CollectionsState {
  lists: Collection[];
}

const DEFAULT_COLLECTIONS: CollectionName[] = ['playing', 'beaten', 'backlog', 'wishlist'];

const initialState: CollectionsState = {
  lists: DEFAULT_COLLECTIONS.map((name) => ({ name, games: [] })),
};

// One merge at a time: two at once would both upload the same local games.
let merging = false;

export const fetchCollections = createAsyncThunk<Collection[] | null, void, { rejectValue: Collection[] }>(
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
        const key = `${item.collection_name}_${item.game_id}`;
        if (cloudRecords.has(key)) return false;
        cloudRecords.add(key);
        return true;
      });

      const itemsToUpload: (Omit<FavoriteGame, 'id'> & { user_id: string; game_id: number; collection_name: CollectionName })[] = [];
      localLists.forEach(list => {
        list.games.forEach(game => {
          if (!cloudRecords.has(`${list.name}_${game.id}`)) {
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

      // A failed upload keeps the games on this device (the next merge retries them) and rejects, so the app can say so.
      return uploadFailed ? rejectWithValue(lists) : lists;
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
    clearCollections(state) {
      state.lists = DEFAULT_COLLECTIONS.map((name) => ({ name, games: [] }));
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchCollections.fulfilled, (state, action) => {
        if (action.payload) {
          state.lists = action.payload;
        }
      })
      .addCase(fetchCollections.rejected, (state, action) => {
        if (action.payload) state.lists = action.payload;
      })
      .addCase(addToCollectionInDb.fulfilled, (state, action) => {
        if (!action.payload) return;
        const { collectionName, game } = action.payload;
        const collection = state.lists.find((l) => l.name === collectionName);
        if (collection && !collection.games.some((g) => g.id === game.id)) {
          collection.games.push(game);
        }
      })
      .addCase(removeFromCollectionInDb.fulfilled, (state, action) => {
        if (!action.payload) return;
        const { collectionName, gameId } = action.payload;
        const collection = state.lists.find((l) => l.name === collectionName);
        if (collection) {
          collection.games = collection.games.filter((g) => g.id !== gameId);
        }
      });
  }
});

export const { clearCollections } = collectionsSlice.actions;
export default collectionsSlice.reducer;
