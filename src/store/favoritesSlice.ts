import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import type { FavoriteGame } from '../types';
import { supabase } from '../utils/supabase';
import type { RootState } from './index';

interface FavoritesState {
  items: FavoriteGame[];
}

const initialState: FavoritesState = {
  items: [],
};

// One merge at a time: two at once would both upload the same local games.
let merging = false;

export const fetchFavorites = createAsyncThunk<FavoriteGame[] | null, void, { rejectValue: FavoriteGame[] }>(
  'favorites/fetchFavorites',
  async (_, { getState, rejectWithValue }) => {
    const state = getState() as RootState;
    const user = state.auth.user;
    // Nobody signed in: nothing to merge with, so local favorites stay as they are.
    if (!user) return null;
    merging = true;
    try {
      const localItems = state.favorites.items;

      const { data: cloudData, error } = await supabase.from('favorites').select('*');
      if (error) throw error;

      // Duplicate cloud rows (two devices saving at once) show as one game.
      const cloudRows = cloudData.filter((item, i) => cloudData.findIndex(other => other.game_id === item.game_id) === i);
      const cloudGameIds = new Set(cloudRows.map(item => item.game_id));

      const itemsToUpload = localItems.filter(game => !cloudGameIds.has(game.id));
      let uploadFailed = false;

      if (itemsToUpload.length > 0) {
        const { error: insertError } = await supabase.from('favorites').insert(
          itemsToUpload.map(game => ({
            user_id: user.id,
            game_id: game.id,
            name: game.name,
            slug: game.slug,
            background_image: game.background_image,
            metacritic: game.metacritic,
            parent_platforms: game.parent_platforms,
          }))
        );
        if (insertError) uploadFailed = true;
      }

      const formattedCloudData = cloudRows.map(item => ({
        id: item.game_id,
        name: item.name,
        slug: item.slug,
        background_image: item.background_image,
        metacritic: item.metacritic,
        parent_platforms: item.parent_platforms,
      })) as FavoriteGame[];

      const merged = [...formattedCloudData, ...itemsToUpload];
      // A failed upload keeps the games on this device (the next merge retries them) and rejects, so the app can say so.
      return uploadFailed ? rejectWithValue(merged) : merged;
    } finally {
      merging = false;
    }
  },
  { condition: () => !merging },
);

export const toggleFavoriteInDb = createAsyncThunk(
  'favorites/toggleFavoriteInDb',
  async (game: FavoriteGame, { getState }) => {
    const state = getState() as RootState;
    const user = state.auth.user;
    

    if (!user) {
      return { game, localOnly: true };
    }

    const isFavorite = state.favorites.items.some(g => g.id === game.id);

    if (isFavorite) {
      const { error } = await supabase
        .from('favorites')
        .delete()
        .eq('user_id', user.id)
        .eq('game_id', game.id);
      if (error) throw error;
      return { game, action: 'removed' as const };
    } else {
      const { error } = await supabase
        .from('favorites')
        .insert({
          user_id: user.id,
          game_id: game.id,
          name: game.name,
          slug: game.slug,
          background_image: game.background_image,
          metacritic: game.metacritic,
          parent_platforms: game.parent_platforms,
        });
      if (error) throw error;
      return { game, action: 'added' as const };
    }
  }
);

const favoritesSlice = createSlice({
  name: 'favorites',
  initialState,
  reducers: {
    clearFavorites(state) {
      state.items = [];
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchFavorites.fulfilled, (state, action) => {
        if (action.payload) state.items = action.payload;
      })
      .addCase(fetchFavorites.rejected, (state, action) => {
        if (action.payload) state.items = action.payload;
      })
      .addCase(toggleFavoriteInDb.fulfilled, (state, action) => {
        if (!action.payload) return;
        
        if ('localOnly' in action.payload) {
          const game = action.payload.game;
          const exists = state.items.some(g => g.id === game.id);
          if (exists) {
            state.items = state.items.filter(g => g.id !== game.id);
          } else {
            state.items.push(game);
          }
          return;
        }

        if (action.payload.action === 'removed') {
          state.items = state.items.filter(g => g.id !== action.payload.game.id);
        } else {
          state.items.push(action.payload.game);
        }
      });
  }
});

export const { clearFavorites } = favoritesSlice.actions;
export default favoritesSlice.reducer;
