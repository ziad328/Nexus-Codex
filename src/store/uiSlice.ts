import { createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import type { FavoriteGame, ViewMode } from '../types';

const MAX_RECENT = 10;

interface UiState {
  viewMode: ViewMode;
  recentlyViewed: FavoriteGame[];
}

const initialState: UiState = {
  viewMode: 'grid',
  recentlyViewed: [],
};

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    setViewMode(state, action: PayloadAction<ViewMode>) {
      state.viewMode = action.payload;
    },
    addRecentlyViewed(state, action: PayloadAction<FavoriteGame>) {
      state.recentlyViewed = [
        action.payload,
        ...state.recentlyViewed.filter((g) => g.id !== action.payload.id),
      ].slice(0, MAX_RECENT);
    },
    clearRecentlyViewed(state) {
      state.recentlyViewed = [];
    },
  },
});

export const { setViewMode, addRecentlyViewed, clearRecentlyViewed } = uiSlice.actions;
export default uiSlice.reducer;
