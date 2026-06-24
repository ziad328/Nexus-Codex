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

export const fetchFavorites = createAsyncThunk(
  'favorites/fetchFavorites',
  async (_, { getState }) => {
    const state = getState() as RootState;
    if (!state.auth.user) return [];
    
    const { data, error } = await supabase.from('favorites').select('*');
    if (error) throw error;
    
    return data.map(item => ({
      id: item.game_id,
      name: item.name,
      slug: item.slug,
      background_image: item.background_image,
      metacritic: null,
    })) as FavoriteGame[];
  }
);

export const toggleFavoriteInDb = createAsyncThunk(
  'favorites/toggleFavoriteInDb',
  async (game: FavoriteGame, { getState }) => {
    const state = getState() as RootState;
    const user = state.auth.user;
    
    // Fallback for offline/logged-out
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
        state.items = action.payload;
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
