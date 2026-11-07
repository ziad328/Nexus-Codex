import { act, fireEvent, screen, waitFor, within } from '@testing-library/react';
import type { Session } from '@supabase/supabase-js';
import App from '../src/App';
import { apiRequests } from './fakes/network';
import { supabase, supabaseFake } from './fakes/supabase';
import { makeGame, makeRow, signedIn, USER_ID } from './fixtures';
import { lastGamesParams, mockCatalog, mockGameDetails } from './pages/catalog';
import { renderWithProviders } from './render';
import type { TestState } from './render';

const session = { user: { id: USER_ID } } as Session;
const guestGame = makeGame(1, { name: 'Portal' });
const cachedGenres = JSON.stringify([{ id: 4, name: 'Action', slug: 'action', image_background: 'a.jpg' }, { id: 5, name: 'Puzzle', slug: 'puzzle', image_background: 'p.jpg' }]);

const emptyLists = (): TestState['collections'] => ({
  lists: (['playing', 'beaten', 'backlog', 'wishlist'] as const).map((name) => ({ name, games: [] })),
});

const withSavedGame = (): Partial<TestState> => ({
  favorites: { items: [guestGame] },
  collections: {
    lists: emptyLists().lists.map((list) => (list.name === 'backlog' ? { ...list, games: [guestGame] } : list)),
  },
});

const setup = (route = '/', preloadedState?: Partial<TestState>) => renderWithProviders(<App />, { route, preloadedState });

/** Waits out `getSession`, which App starts on load. */
const settled = async (store: { getState: () => TestState }) => {
  await waitFor(() => expect(store.getState().auth.isLoading).toBe(false));
};

const emit = async (event: string, next: Session | null) => {
  await act(async () => {
    supabaseFake.emitAuth(event, next);
    await new Promise((resolve) => setTimeout(resolve, 10));
  });
};

const reads = (table: string) => supabaseFake.queries().filter((query) => query.table === table && query.operation === 'select');

describe('App', () => {
  beforeEach(() => {
    mockCatalog();
  });

  describe('routes', () => {
    it('/ is the home page', async () => {
      const { store } = setup('/');

      expect(await screen.findByRole('heading', { name: 'All Games', level: 1 })).toBeInTheDocument();
      await settled(store);
    });

    it('/genre/:genreSlug is the home page for that genre', async () => {
      localStorage.setItem('nexus-genres-v2', cachedGenres);
      const { store } = setup('/genre/action');

      expect(await screen.findByRole('heading', { name: 'Action', level: 1 })).toBeInTheDocument();
      await waitFor(() => expect(lastGamesParams()).toMatchObject({ genres: 'action' }));
      await settled(store);
    });

    it('/developer/:developerSlug is the developer page', async () => {
      const { store } = setup('/developer/valve');

      expect(await screen.findByRole('heading', { name: 'valve', level: 1 })).toBeInTheDocument();
      await waitFor(() => expect(lastGamesParams()).toMatchObject({ developers: 'valve' }));
      await settled(store);
    });

    it('/publisher/:publisherSlug is the publisher page', async () => {
      const { store } = setup('/publisher/ea');

      expect(await screen.findByRole('heading', { name: 'ea', level: 1 })).toBeInTheDocument();
      await waitFor(() => expect(lastGamesParams()).toMatchObject({ publishers: 'ea' }));
      await settled(store);
    });

    it('/collection is the collection page', async () => {
      const { store } = setup('/collection');

      expect(await screen.findByRole('heading', { name: 'My Collection', level: 1 })).toBeInTheDocument();
      await settled(store);
    });

    it('puts every page inside the layout', async () => {
      const { store } = setup('/collection');

      expect(screen.getByPlaceholderText('Search games...')).toBeInTheDocument();
      await settled(store);
    });

    it.fails('BUG-31: an unknown URL shows a way back, not a blank screen', async () => {
      const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
      const { store } = setup('/no-such-page');
      await settled(store);

      const hasContent = screen.queryByRole('link') !== null || screen.queryByRole('heading') !== null;
      warn.mockRestore();
      expect(hasContent).toBe(true);
    });

    it('scrolls to the top when the page changes', async () => {
      const { store } = setup('/collection');
      await settled(store);
      const toTop = vi.fn();
      window.addEventListener('nexusScrollToTop', toTop);

      fireEvent.click(screen.getAllByRole('link', { name: /action/i })[0]);

      await screen.findByRole('heading', { name: 'Action', level: 1 });
      expect(toTop).toHaveBeenCalledOnce();
      window.removeEventListener('nexusScrollToTop', toTop);
    });

    it('moves to the developer page and closes the modal when following its link', async () => {
      mockGameDetails(1, 'Portal');
      const { store } = setup('/?game=1');
      await screen.findByRole('heading', { name: 'Portal', level: 1 });

      fireEvent.click(within(document.getElementById('game-modal-content')!).getByRole('link', { name: 'Valve' }));

      expect(await screen.findByRole('heading', { name: 'valve', level: 1 })).toBeInTheDocument();
      expect(document.getElementById('game-modal-content')).not.toBeInTheDocument();
      await settled(store);
    });
  });

  describe('the session on load', () => {
    it('restores a saved session', async () => {
      supabaseFake.setSession(session);

      const { store } = setup();

      await waitFor(() => expect(store.getState().auth.user?.id).toBe(USER_ID));
      expect(store.getState().auth.session).toEqual(session);
      expect(store.getState().auth.isLoading).toBe(false);
    });

    it('finishes loading as a guest without one', async () => {
      const { store } = setup();

      await settled(store);

      expect(store.getState().auth.user).toBeNull();
    });

    it('does not touch saved lists by itself', async () => {
      const { store } = setup('/', withSavedGame());
      await settled(store);

      expect(supabaseFake.queries()).toEqual([]);
      expect(store.getState().favorites.items).toEqual([guestGame]);
    });
  });

  describe('signing in', () => {
    it('sets the user before merging, so the merge knows whose lists these are', async () => {
      const { store } = setup('/', withSavedGame());
      await settled(store);

      await emit('SIGNED_IN', session);

      expect(store.getState().auth.user?.id).toBe(USER_ID);
      expect(supabaseFake.rows('favorites')).toMatchObject([{ user_id: USER_ID, game_id: 1 }]);
      expect(supabaseFake.rows('collections')).toMatchObject([{ user_id: USER_ID, game_id: 1, collection_name: 'backlog' }]);
    });

    it('brings in what the account already has', async () => {
      const cloudGame = makeGame(9, { name: 'Halo' });
      supabaseFake.seed('favorites', [makeRow(cloudGame)]);
      supabaseFake.seed('collections', [makeRow(cloudGame, { collection_name: 'playing' })]);
      const { store } = setup();
      await settled(store);

      await emit('SIGNED_IN', session);

      expect(store.getState().favorites.items.map((game) => game.id)).toEqual([9]);
      expect(store.getState().collections.lists.find((list) => list.name === 'playing')?.games.map((game) => game.id)).toEqual([9]);
    });

    it('closes the sign-in modal', async () => {
      const { store } = setup('/', {
        ui: { viewMode: 'grid', recentlyViewed: [], searchQueries: {}, isAuthModalOpen: true },
      });
      await settled(store);
      expect(screen.getByRole('heading', { name: 'Join the Codex' })).toBeInTheDocument();

      await emit('SIGNED_IN', session);

      expect(store.getState().ui.isAuthModalOpen).toBe(false);
      await waitFor(() => expect(screen.queryByRole('heading', { name: 'Join the Codex' })).not.toBeInTheDocument());
    });

    it.fails('BUG-9: one sign-in that sends two auth events starts one merge', async () => {
      const { store } = setup('/', withSavedGame());
      await settled(store);

      await act(async () => {
        supabaseFake.emitAuth('INITIAL_SESSION', session);
        supabaseFake.emitAuth('SIGNED_IN', session);
        await new Promise((resolve) => setTimeout(resolve, 10));
      });

      expect(reads('favorites')).toHaveLength(1);
      expect(reads('collections')).toHaveLength(1);
    });

    it.fails('BUG-9: one sign-in that sends two auth events saves each game once', async () => {
      const { store } = setup('/', withSavedGame());
      await settled(store);

      await act(async () => {
        supabaseFake.emitAuth('INITIAL_SESSION', session);
        supabaseFake.emitAuth('SIGNED_IN', session);
        await new Promise((resolve) => setTimeout(resolve, 10));
      });

      expect(supabaseFake.rows('favorites')).toHaveLength(1);
      expect(supabaseFake.rows('collections')).toHaveLength(1);
    });

    it.fails('BUG-9: a token refresh does not start another merge', async () => {
      const { store } = setup();
      await settled(store);
      await emit('SIGNED_IN', session);

      await emit('TOKEN_REFRESHED', session);

      expect(reads('favorites')).toHaveLength(1);
    });
  });

  describe('signing out', () => {
    it('clears the user and the saved lists from the screen', async () => {
      const { store } = setup('/', { ...withSavedGame(), auth: signedIn });
      await settled(store);

      await emit('SIGNED_OUT', null);

      expect(store.getState().auth.user).toBeNull();
      expect(store.getState().favorites.items).toEqual([]);
      expect(store.getState().collections).toEqual(emptyLists());
    });

    it('leaves the cloud rows alone', async () => {
      supabaseFake.seed('favorites', [makeRow(guestGame)]);
      const { store } = setup('/', { ...withSavedGame(), auth: signedIn });
      await settled(store);

      await emit('SIGNED_OUT', null);

      expect(supabaseFake.rows('favorites')).toHaveLength(1);
      expect(supabaseFake.queries()).toEqual([]);
    });

    it('keeps a guest\'s lists on any other event without a session', async () => {
      const { store } = setup('/', withSavedGame());
      await settled(store);

      await emit('INITIAL_SESSION', null);

      expect(store.getState().favorites.items).toEqual([guestGame]);
      expect(store.getState().collections.lists.find((list) => list.name === 'backlog')?.games).toEqual([guestGame]);
      expect(supabaseFake.queries()).toEqual([]);
    });
  });

  it('stops listening for auth events on unmount', async () => {
    const { store, unmount } = setup('/', withSavedGame());
    await settled(store);

    unmount();
    supabaseFake.emitAuth('SIGNED_OUT', null);

    expect(store.getState().favorites.items).toEqual([guestGame]);
    expect(supabase.auth.onAuthStateChange).toHaveBeenCalledOnce();
  });

  describe('the expired-link message', () => {
    const expired = '#error=access_denied&error_code=otp_expired&error_description=Email+link+is+invalid';
    const message = () => screen.queryByText('This magic link has expired. Please try signing in again.');
    const dismiss = () => within(screen.getByText('Authentication Failed').parentElement!.parentElement!).getByRole('button');

    const arrive = (path: string) => window.history.replaceState(null, '', path);

    afterEach(() => {
      vi.useRealTimers();
      arrive('/');
    });

    it('shows when the link has expired', async () => {
      arrive(`/${expired}`);

      const { store } = setup();

      expect(screen.getByText('Authentication Failed')).toBeInTheDocument();
      expect(message()).toBeInTheDocument();
      await settled(store);
    });

    it('removes the error from the address, keeping the path and query', async () => {
      arrive(`/collection?a=1${expired}`);

      const { store } = setup();

      expect(window.location.pathname + window.location.search + window.location.hash).toBe('/collection?a=1');
      await settled(store);
    });

    it.each([
      ['no hash', '/'],
      ['another error', '/#error=access_denied&error_code=other'],
      ['another code alone', '/#error=server_error&error_code=otp_expired'],
    ])('stays away with %s', async (_, path) => {
      arrive(path);

      const { store } = setup();

      expect(message()).not.toBeInTheDocument();
      expect(window.location.pathname + window.location.hash).toBe(path);
      await settled(store);
    });

    it('goes away by itself after 6 seconds', async () => {
      arrive(`/${expired}`);
      vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
      setup();

      // The exit animation keeps the message on screen for a moment, so the pending timer is what proves the timing.
      act(() => { vi.advanceTimersByTime(5999); });
      expect(message()).toBeInTheDocument();
      expect(vi.getTimerCount()).toBe(1);

      act(() => { vi.advanceTimersByTime(1); });
      expect(vi.getTimerCount()).toBe(0);
      vi.useRealTimers();
      await waitFor(() => expect(message()).not.toBeInTheDocument());
    });

    it('goes away when dismissed', async () => {
      arrive(`/${expired}`);
      const { store } = setup();

      fireEvent.click(dismiss());

      await waitFor(() => expect(message()).not.toBeInTheDocument());
      await settled(store);
    });

    it('cancels its timer on unmount', async () => {
      arrive(`/${expired}`);
      vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
      const { unmount } = setup();

      unmount();

      expect(vi.getTimerCount()).toBe(0);
    });

    it.fails('BUG-32: the dismiss button has a name screen readers can announce', async () => {
      arrive(`/${expired}`);
      const { store } = setup();
      await settled(store);

      expect(dismiss()).toHaveAccessibleName();
    });
  });

  describe('the sign-in modal', () => {
    it('stays closed by default', async () => {
      const { store } = setup();
      await settled(store);

      expect(screen.queryByRole('heading', { name: 'Join the Codex' })).not.toBeInTheDocument();
    });

    it('opens from the Sign In button on the collection banner, and closes again', async () => {
      const { store } = setup('/collection', withSavedGame());
      await settled(store);

      const banner = screen.getByText('Cloud Sync Disabled').closest('.relative')!;
      fireEvent.click(within(banner.parentElement!.parentElement!).getByRole('button', { name: 'Sign In' }));

      const title = await screen.findByRole('heading', { name: 'Join the Codex' });
      expect(store.getState().ui.isAuthModalOpen).toBe(true);

      fireEvent.click(within(title.parentElement!).getByRole('button'));

      expect(store.getState().ui.isAuthModalOpen).toBe(false);
      await waitFor(() => expect(screen.queryByRole('heading', { name: 'Join the Codex' })).not.toBeInTheDocument());
    });
  });

  it('shows the update prompt alongside the page', async () => {
    const { pwaFake } = await import('./fakes/pwa-register');
    pwaFake.needRefresh = true;
    const { store } = setup();
    await settled(store);

    expect(screen.getByRole('button', { name: /reload|refresh|update/i })).toBeInTheDocument();
    pwaFake.needRefresh = false;
  });

  describe('a first visit, with no genres saved in the browser', () => {
    const genresArrived = async () => {
      await waitFor(() => expect(localStorage.getItem('nexus-genres-v2')).not.toBeNull());
      await act(async () => { await new Promise((resolve) => setTimeout(resolve, 20)); });
    };

    it('the genre page gets its name (BUG-33, fixed)', async () => {
      setup('/genre/action');
      await genresArrived();

      expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Action');
    });

    it('the desktop sidebar lists the genres (BUG-33, fixed)', async () => {
      const { container } = setup('/');
      await genresArrived();

      expect(within(container.querySelector<HTMLElement>('.hidden.lg\\:block')!).getByRole('link', { name: /action/i })).toBeInTheDocument();
    });

    it('the mobile sidebar lists the genres', async () => {
      const { container } = setup('/');
      await genresArrived();

      expect(within(container.querySelector<HTMLElement>('.lg\\:hidden.h-full')!).getByRole('link', { name: /action/i })).toBeInTheDocument();
    });
  });

  it('asks for genres once on a page load, not once per sidebar plus once for the home page (BUG-26, fixed)', async () => {
    localStorage.setItem('nexus-genres-v2', cachedGenres);
    const { store } = setup('/');
    await settled(store);
    await waitFor(() => expect(apiRequests.length).toBeGreaterThan(0));

    expect(apiRequests.filter((request) => request.url === '/genres')).toHaveLength(1);
  });
});
