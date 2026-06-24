import { createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import type { FavoriteGame, ViewMode } from '../types';

const MAX_RECENT = 10;

interface UiState {
  viewMode: ViewMode;
  recentlyViewed: FavoriteGame[];
  searchQueries: Record<string, string>;
  isAuthModalOpen: boolean;
}

const initialState: UiState = {
  viewMode: 'grid',
  recentlyViewed: [],
  searchQueries: {},
  isAuthModalOpen: false,
};

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    setViewMode(state, action: PayloadAction<ViewMode>) {
      state.viewMode = action.payload;
    },
    setAuthModalOpen(state, action: PayloadAction<boolean>) {
      state.isAuthModalOpen = action.payload;
    },
    setSearchQuery(state, action: PayloadAction<{ path: string; text: string }>) {
      if (!state.searchQueries) {
        state.searchQueries = {};
      }
      state.searchQueries[action.payload.path] = action.payload.text;
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

export const { setViewMode, setSearchQuery, addRecentlyViewed, clearRecentlyViewed, setAuthModalOpen } = uiSlice.actions;
export default uiSlice.reducer;
