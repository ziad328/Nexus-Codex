import { configureStore, combineReducers } from '@reduxjs/toolkit';
import { persistStore, persistReducer } from 'redux-persist';
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

const persistConfig = {
  key: 'nexus-root',
  storage,
  whitelist: ['favorites', 'collections', 'ui'],
};

const rootReducer = combineReducers({
  favorites: favoritesReducer,
  collections: collectionsReducer,
  ui: uiReducer,
  auth: authReducer,
});

const persistedReducer = persistReducer(persistConfig, rootReducer);

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
