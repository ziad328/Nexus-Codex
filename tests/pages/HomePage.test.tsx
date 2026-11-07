import { act, fireEvent, screen, waitFor, within } from '@testing-library/react';
import { Link, Route, Routes } from 'react-router-dom';
import HomePage from '../../src/pages/HomePage';
import { apiRequests, mockApiError } from '../fakes/network';
import { makeGame } from '../fixtures';
import { renderWithProviders } from '../render';
import type { TestState } from '../render';
import { doom, lastGamesParams, mockCatalog, mockGameDetails, portal } from './catalog';
import { CurrentUrl } from './CurrentUrl';

const setup = (route = '/', preloadedState?: Partial<TestState>) =>
  renderWithProviders(
    <>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/genre/:genreSlug" element={<HomePage />} />
      </Routes>
      <Link to="/genre/puzzle">go to puzzle</Link>
      <CurrentUrl />
    </>,
    { route, preloadedState },
  );

const uiWith = (ui: Partial<TestState['ui']>): Partial<TestState> => ({
  ui: { viewMode: 'grid', recentlyViewed: [], searchQueries: {}, isAuthModalOpen: false, ...ui },
});

const url = () => screen.getByTestId('url').textContent;
const heading = () => screen.getByRole('heading', { level: 1 });
const openCard = async (name: string) => fireEvent.click(await screen.findByRole('button', { name: `View details for ${name}` }));
const modalTitle = (name: string) => screen.findByRole('heading', { name, level: 1 });
const modal = () => document.getElementById('game-modal-content');
const recentIds = (store: { getState: () => TestState }) => store.getState().ui.recentlyViewed.map((game) => game.id);

const choose = async (menu: string, option: string) => {
  fireEvent.click(await screen.findByRole('button', { name: menu }));
  fireEvent.click(await screen.findByRole('button', { name: option }));
};

describe('HomePage', () => {
  beforeEach(() => {
    mockCatalog();
    mockGameDetails(1, 'Portal');
    mockGameDetails(2, 'Doom');
  });

  describe('the grid', () => {
    it('shows all games with no filter', async () => {
      setup();

      expect(await screen.findByRole('button', { name: 'View details for Portal' })).toBeInTheDocument();
      expect(heading()).toHaveTextContent('All Games');
      expect(screen.getByText('Discover your next obsession')).toBeInTheDocument();
      expect(lastGamesParams()).toEqual({ page: 1 });
      await waitFor(() => expect(document.title).toBe('Nexus Codex | The Ultimate Game Library'));
    });

    it('searches for the text saved for this page and says so', async () => {
      setup('/', uiWith({ searchQueries: { '/': 'zelda', '/genre/action': 'other' } }));

      expect(await screen.findByText('Results for "zelda"')).toBeInTheDocument();
      await waitFor(() => expect(lastGamesParams()).toMatchObject({ search: 'zelda' }));
    });

    it.each([
      ['Tag', 'Singleplayer', 'Any Tag', { tags: 'singleplayer' }],
      ['Store', 'Steam', 'Any Store', { stores: 1 }],
      ['Platform', 'Xbox', 'All Platforms', { parent_platforms: 3 }],
    ])('sends the %s filter to the grid, and clears it', async (menu, option, clear, params) => {
      setup();

      await choose(menu, option);
      await waitFor(() => expect(lastGamesParams()).toMatchObject(params));

      await choose(option, clear);
      await waitFor(() => expect(lastGamesParams()).toEqual({ page: 1 }));
    });

    it('keeps earlier filters when adding another', async () => {
      setup();

      await choose('Tag', 'Singleplayer');
      await choose('Store', 'Steam');
      await choose('Platform', 'Xbox');

      await waitFor(() => expect(lastGamesParams()).toEqual({ tags: 'singleplayer', stores: 1, parent_platforms: 3, page: 1 }));
    });

    it('keeps earlier filters whichever is picked last', async () => {
      setup();

      await choose('Platform', 'Xbox');
      await choose('Store', 'Steam');
      await choose('Tag', 'Singleplayer');

      await waitFor(() => expect(lastGamesParams()).toEqual({ tags: 'singleplayer', stores: 1, parent_platforms: 3, page: 1 }));
    });

    it('switches between grid and list view', async () => {
      const { store } = setup();
      await screen.findByRole('button', { name: 'View details for Portal' });

      const listLayout = () => screen.getByRole('button', { name: 'View details for Portal' }).closest('.flex-col.gap-2');

      fireEvent.click(screen.getByRole('button', { name: 'List view' }));
      expect(store.getState().ui.viewMode).toBe('list');
      expect(listLayout()).toBeInTheDocument();

      fireEvent.click(screen.getByRole('button', { name: 'Grid view' }));
      expect(store.getState().ui.viewMode).toBe('grid');
      expect(listLayout()).not.toBeInTheDocument();
    });
  });

  describe('the genre route', () => {
    it('filters by the genre in the URL and titles the page with its name', async () => {
      setup('/genre/action');

      await waitFor(() => expect(heading()).toHaveTextContent('Action'));
      expect(lastGamesParams()).toMatchObject({ genres: 'action' });
      expect(apiRequests.filter((request) => request.url === '/games')).toHaveLength(1);
      await waitFor(() => expect(document.title).toBe('Action Games | Nexus Codex'));
      expect(document.head.querySelector('meta[name="description"]')).toHaveAttribute(
        'content',
        'Explore the best Action games on Nexus Codex. Track your collections and discover your next obsession.',
      );
    });

    it('shows Loading until the genre names arrive', async () => {
      setup('/genre/action');

      expect(heading()).toHaveTextContent('Loading...');
      await waitFor(() => expect(heading()).toHaveTextContent('Action'));
    });

    it('follows the URL to another genre, keeping the other filters', async () => {
      setup('/genre/action');
      await choose('Tag', 'Singleplayer');
      await waitFor(() => expect(lastGamesParams()).toMatchObject({ tags: 'singleplayer' }));

      fireEvent.click(screen.getByRole('link', { name: 'go to puzzle' }));

      await waitFor(() => expect(heading()).toHaveTextContent('Puzzle'));
      await waitFor(() => expect(lastGamesParams()).toMatchObject({ genres: 'puzzle', tags: 'singleplayer' }));
    });

    it('uses the address for the title when the genre names fail to load (BUG-27, fixed)', async () => {
      mockApiError('/genres');
      setup('/genre/role-playing');
      await waitFor(() => expect(apiRequests.some((request) => request.url === '/genres')).toBe(true));
      await new Promise((resolve) => setTimeout(resolve, 20));

      expect(heading()).toHaveTextContent('Role Playing');
      await waitFor(() => expect(document.title).toBe('Role Playing Games | Nexus Codex'));
    });

    it('says so for a genre that does not exist (BUG-27, fixed)', async () => {
      setup('/genre/not-a-genre');
      await waitFor(() => expect(localStorage.getItem('nexus-genres-v2')).not.toBeNull());
      await new Promise((resolve) => setTimeout(resolve, 20));

      expect(heading()).toHaveTextContent('Unknown Genre');
    });
  });

  describe('the ?game= deep link', () => {
    it('opens the modal on that game', async () => {
      setup('/?game=1');

      expect(await modalTitle('Portal')).toBeInTheDocument();
      await waitFor(() => expect(url()).toBe('/?game=1'));
    });

    it('works on a genre route too', async () => {
      setup('/genre/action?game=2');

      expect(await modalTitle('Doom')).toBeInTheDocument();
      expect(lastGamesParams()).toMatchObject({ genres: 'action' });
    });

    it('opens nothing without one', async () => {
      setup('/');
      await screen.findByRole('button', { name: 'View details for Portal' });

      expect(modal()).not.toBeInTheDocument();
    });

    it('ignores one that is not a number', async () => {
      setup('/?game=abc');
      await screen.findByRole('button', { name: 'View details for Portal' });

      expect(modal()).not.toBeInTheDocument();
      expect(apiRequests.map((request) => request.url)).not.toContain('/games/NaN');
    });

    it.fails('BUG-28: adds the game to Recently Viewed', async () => {
      const { store } = setup('/?game=1');
      await modalTitle('Portal');

      expect(recentIds(store)).toContain(1);
    });
  });

  describe('selecting a game', () => {
    it('opens the modal, sets the URL and adds it to Recently Viewed', async () => {
      const { store } = setup();

      await openCard('Portal');

      expect(await modalTitle('Portal')).toBeInTheDocument();
      await waitFor(() => expect(url()).toBe('/?game=1'));
      expect(recentIds(store)).toEqual([1]);
      expect(screen.getByTitle('Portal')).toHaveAttribute('title', 'Portal');
    });

    it('saves the details Recently Viewed needs', async () => {
      const { store } = setup();

      await openCard('Portal');

      expect(store.getState().ui.recentlyViewed[0]).toMatchObject({
        id: 1,
        name: 'Portal',
        slug: portal.slug,
        background_image: portal.background_image,
        metacritic: portal.metacritic,
      });
    });

    it('replaces the history entry, so Back leaves the page instead of reopening games', async () => {
      setup();

      await openCard('Portal');

      await waitFor(() => expect(url()).toBe('/?game=1'));
      expect(screen.getByTestId('url')).toHaveAttribute('data-navigation', 'REPLACE');
    });

    it('moves on to a similar game from inside the modal', async () => {
      mockGameDetails(1, 'Portal', [doom]);
      const { store } = setup();
      await openCard('Portal');
      await modalTitle('Portal');

      fireEvent.click(await within(modal()!).findByRole('button', { name: /Doom/ }));

      expect(await modalTitle('Doom')).toBeInTheDocument();
      await waitFor(() => expect(url()).toBe('/?game=2'));
      expect(recentIds(store)).toEqual([2, 1]);
    });
  });

  describe('closing the modal', () => {
    it('clears the URL and closes it', async () => {
      setup('/?game=1');
      await modalTitle('Portal');

      fireEvent.click(screen.getByRole('button', { name: 'Close' }));

      await waitFor(() => expect(url()).toBe('/'));
      expect(screen.getByTestId('url')).toHaveAttribute('data-navigation', 'REPLACE');
      expect(modal()).not.toBeInTheDocument();
    });

    it('keeps the filters and the genre', async () => {
      setup('/genre/action?game=1');
      await choose('Tag', 'Singleplayer');
      await waitFor(() => expect(lastGamesParams()).toMatchObject({ tags: 'singleplayer' }));

      fireEvent.click(screen.getByRole('button', { name: 'Close' }));

      await waitFor(() => expect(url()).toBe('/genre/action'));
      expect(lastGamesParams()).toMatchObject({ genres: 'action', tags: 'singleplayer' });
    });
  });

  describe('Recently Viewed', () => {
    const saved = uiWith({ recentlyViewed: [makeGame(2, { name: 'Doom' }), makeGame(1, { name: 'Portal' })] });

    it('opens the modal on the chosen game', async () => {
      setup('/', saved);

      fireEvent.click(screen.getByTitle('Portal'));

      expect(await modalTitle('Portal')).toBeInTheDocument();
    });

    it.fails('BUG-29: sets the URL like every other way of opening a game', async () => {
      setup('/', saved);

      fireEvent.click(screen.getByTitle('Portal'));
      await modalTitle('Portal');

      await waitFor(() => expect(url()).toBe('/?game=1'));
    });

    it.fails('BUG-29: moves the chosen game to the front', async () => {
      const { store } = setup('/', saved);

      fireEvent.click(screen.getByTitle('Portal'));
      await modalTitle('Portal');

      expect(recentIds(store)).toEqual([1, 2]);
    });
  });

  describe('the scroll-to-top pill', () => {
    const scrollTo = (detail: number) => act(() => { window.dispatchEvent(new CustomEvent('nexusScroll', { detail })); });
    const pill = () => screen.getByRole('button', { name: /Scroll to top/ }).parentElement!;

    it('stays hidden until scrolled past 600 px, and hides again on the way back', async () => {
      setup();
      await screen.findByRole('button', { name: 'View details for Portal' });
      expect(pill()).toHaveClass('opacity-0', 'pointer-events-none');

      scrollTo(600);
      expect(pill()).toHaveClass('opacity-0', 'pointer-events-none');

      scrollTo(601);
      expect(pill()).toHaveClass('opacity-100');
      expect(pill()).not.toHaveClass('pointer-events-none');

      scrollTo(0);
      expect(pill()).toHaveClass('opacity-0', 'pointer-events-none');
    });

    it('names what is being viewed', async () => {
      setup('/genre/action');

      await waitFor(() => expect(within(pill()).getByText('Action')).toBeInTheDocument());
    });

    it('asks the scroll area to go back to the top', async () => {
      const toTop = vi.fn();
      window.addEventListener('nexusScrollToTop', toTop);
      setup();
      await screen.findByRole('button', { name: 'View details for Portal' });

      fireEvent.click(screen.getByRole('button', { name: /Scroll to top/ }));

      expect(toTop).toHaveBeenCalledOnce();
      window.removeEventListener('nexusScrollToTop', toTop);
    });

    it('stops listening once the page is gone', async () => {
      const removed = vi.spyOn(window, 'removeEventListener');
      const { unmount } = setup();
      await screen.findByRole('button', { name: 'View details for Portal' });

      unmount();

      expect(removed).toHaveBeenCalledWith('nexusScroll', expect.any(Function));
      removed.mockRestore();
    });
  });

  it('shows the grid error when the games fail to load', async () => {
    mockApiError('/games');
    setup();

    expect(await screen.findByText('Failed to connect to Nexus')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /View Collections Cache/ })).toHaveAttribute('href', '/collection');
  });

  it('loads everything the modal shows in one request', async () => {
    setup('/?game=1');
    await modalTitle('Portal');

    expect(apiRequests.filter((request) => request.url.startsWith('/games/1'))).toHaveLength(1);
  });
});
