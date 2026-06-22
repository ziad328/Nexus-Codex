import { createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import type { FavoriteGame } from '../types';

interface FavoritesState {
  items: FavoriteGame[];
}

const initialState: FavoritesState = {
  items: [],
};

const favoritesSlice = createSlice({
  name: 'favorites',
  initialState,
  reducers: {
    toggleFavorite(state, action: PayloadAction<FavoriteGame>) {
      const exists = state.items.some((g) => g.id === action.payload.id);
      if (exists) {
        state.items = state.items.filter((g) => g.id !== action.payload.id);
      } else {
        state.items.push(action.payload);
      }
    },
    removeFavorite(state, action: PayloadAction<number>) {
      state.items = state.items.filter((g) => g.id !== action.payload);
    },
  },
});

export const { toggleFavorite, removeFavorite } = favoritesSlice.actions;
export default favoritesSlice.reducer;
