import { fireEvent, screen, waitFor, within } from '@testing-library/react';
import { Route, Routes } from 'react-router-dom';
import CollectionsPage from '../../src/pages/CollectionsPage';
import type { CollectionName, FavoriteGame } from '../../src/types';
import { apiRequests } from '../fakes/network';
import { makeGame, signedIn } from '../fixtures';
import { renderWithProviders } from '../render';
import type { TestState } from '../render';
import { mockGameDetails } from './catalog';
import { CurrentUrl } from './CurrentUrl';

const portal = makeGame(1, { name: 'Portal' });
const doom = makeGame(2, { name: 'Doom' });
const halo = makeGame(3, { name: 'Halo' });
const myst = makeGame(4, { name: 'Myst' });

interface Saved {
  favorites?: FavoriteGame[];
  lists?: Partial<Record<CollectionName, FavoriteGame[]>>;
  user?: TestState['auth'];
  search?: string;
}

const stateWith = ({ favorites = [], lists = {}, user, search }: Saved): Partial<TestState> => ({
  favorites: { items: favorites },
  collections: {
    lists: (['playing', 'beaten', 'backlog', 'wishlist'] as const).map((name) => ({ name, games: lists[name] ?? [] })),
  },
  ...(user ? { auth: user } : {}),
  ui: {
    viewMode: 'grid',
    recentlyViewed: [],
    searchQueries: search ? { '/collection': search } : {},
    isAuthModalOpen: false,
  },
});

const setup = (saved: Saved = {}, route = '/collection') =>
  renderWithProviders(
    <>
      <Routes>
        <Route path="/collection" element={<CollectionsPage />} />
      </Routes>
      <CurrentUrl />
    </>,
    { route, preloadedState: stateWith(saved) },
  );

const library: Saved = {
  favorites: [portal],
  lists: { playing: [doom], backlog: [halo], beaten: [myst] },
};

const pill = (name: string) => fireEvent.click(screen.getByRole('button', { name }));
const cardNames = () =>
  screen.queryAllByRole('button', { name: /^View details for / }).map((card) => card.getAttribute('aria-label')!.replace('View details for ', ''));
const modalTitle = (name: string) => screen.findByRole('heading', { name, level: 1 });
const modal = () => document.getElementById('game-modal-content');
const banner = () => screen.queryByText('Cloud Sync Disabled');

describe('CollectionsPage', () => {
  beforeEach(() => {
    mockGameDetails(1, 'Portal');
    mockGameDetails(2, 'Doom');
  });

  describe('filter pills', () => {
    it.each([
      ['Favorites', ['Portal'], '1 game in Favorites'],
      ['Playing Now', ['Doom'], '1 game in Playing Now'],
      ['Backlog', ['Halo'], '1 game in Backlog'],
      ['Beaten', ['Myst'], '1 game in Beaten'],
    ])('%s shows only its own games', async (name, games, count) => {
      setup(library);

      pill(name);

      expect(cardNames()).toEqual(games);
      expect(screen.getByText(count)).toBeInTheDocument();
      await waitFor(() => expect(document.title).toBe(`${name} | Nexus Codex`));
      expect(document.head.querySelector('meta[name="description"]')).toHaveAttribute(
        'content',
        `Manage your ${name.toLowerCase()} game collection on Nexus Codex.`,
      );
    });

    it('Wishlist shows only its own games', () => {
      setup({ lists: { wishlist: [halo], playing: [doom] } });

      pill('Wishlist');

      expect(cardNames()).toEqual(['Halo']);
    });

    it('starts on All', async () => {
      setup(library);

      expect(screen.getByRole('button', { name: 'All' })).toHaveClass('bg-accent');
      expect(screen.getByRole('button', { name: 'Favorites' })).not.toHaveClass('bg-accent');
      expect(screen.getByText('4 games in All')).toBeInTheDocument();
      await waitFor(() => expect(document.title).toBe('All | Nexus Codex'));
    });

    it('marks the chosen pill', () => {
      setup(library);

      pill('Backlog');

      expect(screen.getByRole('button', { name: 'Backlog' })).toHaveClass('bg-accent');
      expect(screen.getByRole('button', { name: 'All' })).not.toHaveClass('bg-accent');
    });
  });

  describe('the All view', () => {
    it('shows favorites and every list', () => {
      setup(library);

      expect(cardNames().sort()).toEqual(['Doom', 'Halo', 'Myst', 'Portal']);
    });

    it('shows a game once, even when it is in several places', () => {
      setup({ favorites: [portal], lists: { playing: [portal, doom], wishlist: [portal, doom] } });

      expect(cardNames().sort()).toEqual(['Doom', 'Portal']);
      expect(screen.getByText('2 games in All')).toBeInTheDocument();
    });
  });

  describe('search', () => {
    it('narrows the view, ignoring case', () => {
      setup({ ...library, search: 'POR' });

      expect(cardNames()).toEqual(['Portal']);
      expect(screen.getByText('1 game in All')).toBeInTheDocument();
    });

    it('searches only within the chosen list', () => {
      setup({ ...library, search: 'portal' });

      pill('Backlog');

      expect(cardNames()).toEqual([]);
      expect(screen.getByText('No results for "portal"')).toBeInTheDocument();
    });

    it('uses the text saved for this page only', () => {
      renderWithProviders(
        <Routes><Route path="/collection" element={<CollectionsPage />} /></Routes>,
        {
          route: '/collection',
          preloadedState: {
            ...stateWith(library),
            ui: { viewMode: 'grid', recentlyViewed: [], searchQueries: { '/': 'portal' }, isAuthModalOpen: false },
          },
        },
      );

      expect(cardNames()).toHaveLength(4);
    });
  });

  describe('empty states', () => {
    it('explains how to add games when a list is empty', () => {
      setup();

      expect(screen.getByText('Nothing in All yet')).toBeInTheDocument();
      expect(screen.getByText(/buttons on any game card/)).toBeInTheDocument();
      expect(screen.getByText('0 games in All')).toBeInTheDocument();
    });

    it('names the empty list', () => {
      setup(library);

      pill('Wishlist');

      expect(screen.getByText('Nothing in Wishlist yet')).toBeInTheDocument();
    });

    it('drops the how-to when a search finds nothing', () => {
      setup({ ...library, search: 'zzz' });

      expect(screen.getByText('No results for "zzz"')).toBeInTheDocument();
      expect(screen.queryByText(/buttons on any game card/)).not.toBeInTheDocument();
    });
  });

  describe('the guest banner', () => {
    it('shows for a guest with a favorite', () => {
      setup({ favorites: [portal] });

      expect(banner()).toBeInTheDocument();
    });

    it('shows for a guest with a game in a list', () => {
      setup({ lists: { wishlist: [portal] } });

      expect(banner()).toBeInTheDocument();
    });

    it('stays hidden for a guest with nothing saved', () => {
      setup();

      expect(banner()).not.toBeInTheDocument();
    });

    it('stays hidden when signed in', () => {
      setup({ ...library, user: signedIn });

      expect(banner()).not.toBeInTheDocument();
    });

    it('opens sign-in', () => {
      const { store } = setup({ favorites: [portal] });

      fireEvent.click(screen.getByRole('button', { name: 'Sign In' }));

      expect(store.getState().ui.isAuthModalOpen).toBe(true);
    });
  });

  describe('the cards', () => {
    it('offer removal only on Favorites, and it removes the game', async () => {
      const trash = () => document.querySelector('.lucide-trash-2')?.closest('button');
      const { store } = setup(library);
      expect(trash()).toBeUndefined();

      pill('Favorites');
      fireEvent.click(trash()!);

      expect(await screen.findByText('Nothing in Favorites yet')).toBeInTheDocument();
      expect(store.getState().favorites.items).toEqual([]);
    });

    it('follow the view mode', () => {
      const { store } = setup(library);

      fireEvent.click(screen.getByRole('button', { name: 'List view' }));

      expect(store.getState().ui.viewMode).toBe('list');
      const card = screen.getByRole('button', { name: 'View details for Portal' });
      expect(card.parentElement).toHaveClass('flex-col');
      expect(card).toHaveClass('items-center');
    });

    it('show without asking the API for anything, so they work offline', () => {
      setup(library);

      expect(apiRequests).toEqual([]);
    });
  });

  describe('the modal', () => {
    it('opens on the chosen game and closes again', async () => {
      setup(library);

      fireEvent.click(screen.getByRole('button', { name: 'View details for Portal' }));
      expect(await modalTitle('Portal')).toBeInTheDocument();

      fireEvent.click(screen.getByRole('button', { name: 'Close' }));
      expect(modal()).not.toBeInTheDocument();
    });

    it('stops the page behind it from scrolling while open', async () => {
      const { unmount } = setup(library);
      expect(document.body.style.overflow).toBe('');

      fireEvent.click(screen.getByRole('button', { name: 'View details for Portal' }));
      await modalTitle('Portal');
      expect(document.body.style.overflow).toBe('hidden');

      fireEvent.click(screen.getByRole('button', { name: 'Close' }));
      expect(document.body.style.overflow).toBe('');

      fireEvent.click(screen.getByRole('button', { name: 'View details for Portal' }));
      await modalTitle('Portal');
      unmount();
      expect(document.body.style.overflow).toBe('');
    });

    it.fails('BUG-5: a similar-game click moves on to that game', async () => {
      mockGameDetails(1, 'Portal', [doom]);
      setup(library);
      fireEvent.click(screen.getByRole('button', { name: 'View details for Portal' }));
      await modalTitle('Portal');

      fireEvent.click(await within(modal()!).findByRole('button', { name: /Doom/ }));

      expect(await modalTitle('Doom')).toBeInTheDocument();
    });

    it.fails('BUG-30: ?game= opens the game, as on every other page', async () => {
      setup(library, '/collection?game=1');

      expect(await modalTitle('Portal')).toBeInTheDocument();
    });

    it.fails('BUG-30: opening a game sets the URL, as on every other page', async () => {
      setup(library);

      fireEvent.click(screen.getByRole('button', { name: 'View details for Portal' }));
      await modalTitle('Portal');

      await waitFor(() => expect(screen.getByTestId('url')).toHaveTextContent('/collection?game=1'));
    });

    it.fails('BUG-28: opening a game adds it to Recently Viewed', async () => {
      const { store } = setup(library);

      fireEvent.click(screen.getByRole('button', { name: 'View details for Portal' }));
      await modalTitle('Portal');

      expect(store.getState().ui.recentlyViewed.map((game) => game.id)).toContain(1);
    });
  });
});
