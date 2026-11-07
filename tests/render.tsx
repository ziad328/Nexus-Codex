import { combineReducers, configureStore } from '@reduxjs/toolkit';
import { render } from '@testing-library/react';
import type { ReactElement } from 'react';
import { HelmetProvider } from 'react-helmet-async';
import { Provider } from 'react-redux';
import { MemoryRouter } from 'react-router-dom';
import authReducer from '../src/store/authSlice';
import collectionsReducer from '../src/store/collectionsSlice';
import favoritesReducer from '../src/store/favoritesSlice';
import uiReducer from '../src/store/uiSlice';

const rootReducer = combineReducers({
  favorites: favoritesReducer,
  collections: collectionsReducer,
  ui: uiReducer,
  auth: authReducer,
});

export type TestState = ReturnType<typeof rootReducer>;

/** A fresh store with the real reducers and no persistence, so tests can't affect each other. */
export const createTestStore = (preloadedState?: Partial<TestState>) =>
  configureStore({
    reducer: rootReducer,
    preloadedState: preloadedState as TestState | undefined,
  });

interface Options {
  route?: string;
  preloadedState?: Partial<TestState>;
}

/** Renders inside the same providers the app has, and returns the store for inspection. */
export const renderWithProviders = (ui: ReactElement, { route = '/', preloadedState }: Options = {}) => {
  const store = createTestStore(preloadedState);
  const view = render(
    <HelmetProvider>
      <Provider store={store}>
        <MemoryRouter initialEntries={[route]}>{ui}</MemoryRouter>
      </Provider>
    </HelmetProvider>,
  );
  return { store, ...view };
};
