import { configureStore, combineReducers } from '@reduxjs/toolkit';
import { createMigrate, persistStore, persistReducer } from 'redux-persist';
import type { PersistedState } from 'redux-persist';
import favoritesReducer from './favoritesSlice';
import collectionsReducer from './collectionsSlice';
import uiReducer from './uiSlice';
import authReducer from './authSlice';

const storage = {
  getItem: (key: string): Promise<string | null> =>
    Promise.resolve(localStorage.getItem(key)),
  setItem: (key: string, value: string): Promise<void> =>
    Promise.resolve(localStorage.setItem(key, value)),
  removeItem: (key: string): Promise<void> =>
    Promise.resolve(localStorage.removeItem(key)),
};

// Version 1 is the move to IGDB. Games saved before it have RAWG ids, which would open the wrong game,
// so they are dropped once. The owner chose a fresh start; there was no data worth keeping.
const startFresh = (keys: string[]) =>
  createMigrate({
    1: (state: PersistedState) => {
      if (!state) return state;
      const kept: Record<string, unknown> = { ...state };
      for (const key of keys) delete kept[key];
      return kept as PersistedState;
    },
  });

const rootPersistConfig = {
  key: 'nexus-root',
  storage,
  whitelist: ['favorites', 'collections'],
  version: 1,
  migrate: startFresh(['favorites', 'collections']),
};

const uiPersistConfig = {
  key: 'nexus-ui',
  storage,
  whitelist: ['viewMode', 'recentlyViewed'],
  version: 1,
  migrate: startFresh(['recentlyViewed']),
};

const rootReducer = combineReducers({
  favorites: favoritesReducer,
  collections: collectionsReducer,
  ui: persistReducer(uiPersistConfig, uiReducer),
  auth: authReducer,
});

const persistedReducer = persistReducer(rootPersistConfig, rootReducer);

export const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['persist/PERSIST', 'persist/REHYDRATE'],
      },
    }),
});

export const persistor = persistStore(store);

export type RootState = ReturnType<typeof rootReducer>;
export type AppDispatch = typeof store.dispatch;
