import { createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import type { Collection, CollectionName, FavoriteGame } from '../types';

interface CollectionsState {
  lists: Collection[];
}

const DEFAULT_COLLECTIONS: CollectionName[] = ['playing', 'beaten', 'backlog', 'wishlist'];

const initialState: CollectionsState = {
  lists: DEFAULT_COLLECTIONS.map((name) => ({ name, games: [] })),
};

const collectionsSlice = createSlice({
  name: 'collections',
  initialState,
  reducers: {
    addToCollection(
      state,
      action: PayloadAction<{ collectionName: CollectionName; game: FavoriteGame }>
    ) {
      const collection = state.lists.find((l) => l.name === action.payload.collectionName);
      if (collection && !collection.games.some((g) => g.id === action.payload.game.id)) {
        collection.games.push(action.payload.game);
      }
    },
    removeFromCollection(
      state,
      action: PayloadAction<{ collectionName: CollectionName; gameId: number }>
    ) {
      const collection = state.lists.find((l) => l.name === action.payload.collectionName);
      if (collection) {
        collection.games = collection.games.filter((g) => g.id !== action.payload.gameId);
      }
    },
  },
});

export const { addToCollection, removeFromCollection } = collectionsSlice.actions;
export default collectionsSlice.reducer;
