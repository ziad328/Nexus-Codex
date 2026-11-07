import { act, fireEvent, screen, waitFor, within } from '@testing-library/react';
import { Link, Route, Routes } from 'react-router-dom';
import DeveloperPage from '../../src/pages/DeveloperPage';
import PublisherPage from '../../src/pages/PublisherPage';
import { apiRequests } from '../fakes/network';
import { renderWithProviders } from '../render';
import { doom, lastGamesParams, mockCatalog, mockGameDetails } from './catalog';
import { CurrentUrl } from './CurrentUrl';

describe.each([
  { kind: 'developer', Page: DeveloperPage, param: 'developers', linkName: 'Valve', linkSlug: 'valve', verb: 'developed' },
  { kind: 'publisher', Page: PublisherPage, param: 'publishers', linkName: 'EA', linkSlug: 'ea', verb: 'published' },
])('the $kind page', ({ kind, Page, param, linkName, linkSlug, verb }) => {
  const base = `/${kind}/naughty-dog`;

  const setup = (route = base, searchQueries: Record<string, string> = {}) =>
    renderWithProviders(
      <>
        <Routes>
          <Route path={`/${kind}/:${kind}Slug`} element={<Page />} />
        </Routes>
        <Link to={`/${kind}/rockstar-games`}>go elsewhere</Link>
        <CurrentUrl />
      </>,
      { route, preloadedState: { ui: { viewMode: 'grid', recentlyViewed: [], searchQueries, isAuthModalOpen: false } } },
    );

  const url = () => screen.getByTestId('url').textContent;
  const openCard = async (name: string) => fireEvent.click(await screen.findByRole('button', { name: `View details for ${name}` }));
  const modalTitle = (name: string) => screen.findByRole('heading', { name, level: 1 });
  const modal = () => document.getElementById('game-modal-content');
  const pageTitle = () => screen.getAllByRole('heading', { level: 1 }).find((heading) => heading.classList.contains('capitalize'));
  const meta = () => document.head.querySelector('meta[name="description"]')?.getAttribute('content');

  beforeEach(() => {
    mockCatalog();
    mockGameDetails(1, 'Portal');
    mockGameDetails(2, 'Doom');
  });

  it('sends the slug to the grid', async () => {
    setup();

    await screen.findByRole('button', { name: 'View details for Portal' });
    expect(lastGamesParams()).toEqual({ [param]: 'naughty-dog', page: 1 });
    expect(apiRequests.filter((request) => request.url === '/games')).toHaveLength(1);
  });

  it('shows the slug as a readable name', async () => {
    setup();

    expect(pageTitle()).toHaveTextContent('naughty dog');
    expect(pageTitle()).toHaveClass('capitalize');
    await waitFor(() => expect(document.title).toBe('naughty dog Games | Nexus Codex'));
    expect(meta()).toBe(`Explore the full catalogue of games ${verb} by naughty dog.`);
  });

  it('follows the URL to another slug, keeping the other filters', async () => {
    setup();
    fireEvent.click(await screen.findByRole('button', { name: 'Tag' }));
    fireEvent.click(await screen.findByRole('button', { name: 'Singleplayer' }));

    fireEvent.click(screen.getByRole('link', { name: 'go elsewhere' }));

    expect(pageTitle()).toHaveTextContent('rockstar games');
    await waitFor(() => expect(lastGamesParams()).toMatchObject({ [param]: 'rockstar-games', tags: 'singleplayer' }));
  });

  it.each([
    ['Tag', 'Singleplayer', 'Any Tag', { tags: 'singleplayer' }],
    ['Store', 'Steam', 'Any Store', { stores: 11 }],
    ['Platform', 'Xbox', 'All Platforms', { parent_platforms: 3 }],
  ])('sends the %s filter to the grid, keeps the slug, and clears it', async (menu, option, clear, params) => {
    setup();

    fireEvent.click(await screen.findByRole('button', { name: menu }));
    fireEvent.click(await screen.findByRole('button', { name: option }));
    await waitFor(() => expect(lastGamesParams()).toEqual({ [param]: 'naughty-dog', page: 1, ...params }));

    fireEvent.click(screen.getByRole('button', { name: option }));
    fireEvent.click(await screen.findByRole('button', { name: clear }));
    await waitFor(() => expect(lastGamesParams()).toEqual({ [param]: 'naughty-dog', page: 1 }));
  });

  it('searches for the text saved for this page and says so', async () => {
    setup(base, { [base]: 'zelda', '/': 'other' });

    expect(await screen.findByText('Results for "zelda"')).toBeInTheDocument();
    await waitFor(() => expect(lastGamesParams()).toMatchObject({ search: 'zelda' }));
  });

  it('invites browsing without a search', () => {
    setup();

    expect(screen.getByText('Explore the full catalogue')).toBeInTheDocument();
  });

  it('switches between grid and list view', async () => {
    const { store } = setup();

    fireEvent.click(screen.getByRole('button', { name: 'List view' }));

    expect(store.getState().ui.viewMode).toBe('list');
    expect((await screen.findByRole('button', { name: 'View details for Portal' })).closest('.flex-col.gap-2')).toBeInTheDocument();
  });

  describe('the modal', () => {
    it('opens from a ?gameId= deep link', async () => {
      setup(`${base}?gameId=1`);

      expect(await modalTitle('Portal')).toBeInTheDocument();
      expect(lastGamesParams()).toMatchObject({ [param]: 'naughty-dog' });
    });

    it('opens nothing without one, and ignores one that is not a number', async () => {
      setup(`${base}?gameId=abc`);
      await screen.findByRole('button', { name: 'View details for Portal' });

      expect(modal()).not.toBeInTheDocument();
    });

    it('opens from a card and sets the URL without adding to the history', async () => {
      setup();

      await openCard('Portal');

      expect(await modalTitle('Portal')).toBeInTheDocument();
      await waitFor(() => expect(url()).toBe(`${base}?gameId=1`));
      expect(screen.getByTestId('url')).toHaveAttribute('data-navigation', 'REPLACE');
    });

    it('clears the URL and closes', async () => {
      setup(`${base}?gameId=1`);
      await modalTitle('Portal');

      fireEvent.click(screen.getByRole('button', { name: 'Close' }));

      await waitFor(() => expect(url()).toBe(base));
      expect(screen.getByTestId('url')).toHaveAttribute('data-navigation', 'REPLACE');
      expect(modal()).not.toBeInTheDocument();
    });

    it('moves on to a similar game', async () => {
      mockGameDetails(1, 'Portal', [doom]);
      setup(`${base}?gameId=1`);
      await modalTitle('Portal');

      fireEvent.click(await within(modal()!).findByRole('button', { name: /Doom/ }));

      expect(await modalTitle('Doom')).toBeInTheDocument();
      await waitFor(() => expect(url()).toBe(`${base}?gameId=2`));
    });

    it(`closes when following a ${kind} link inside it to another page of this kind`, async () => {
      setup(`/${kind}/naughty-dog?gameId=1`);
      await modalTitle('Portal');

      fireEvent.click(within(modal()!).getByRole('link', { name: linkName }));

      await waitFor(() => expect(url()).toBe(`/${kind}/${linkSlug}`));
      expect(modal()).not.toBeInTheDocument();
      await waitFor(() => expect(lastGamesParams()).toMatchObject({ [param]: linkSlug }));
    });

    it.fails('BUG-28: opening a game adds it to Recently Viewed', async () => {
      const { store } = setup();

      await openCard('Portal');
      await modalTitle('Portal');

      expect(store.getState().ui.recentlyViewed.map((game) => game.id)).toContain(1);
    });
  });

  describe('the scroll-to-top pill', () => {
    const scrollTo = (detail: number) => act(() => { window.dispatchEvent(new CustomEvent('nexusScroll', { detail })); });
    const pill = () => screen.getByRole('button', { name: /Scroll to top/ }).parentElement!;

    it('appears past 600 px and names the page', () => {
      setup();
      expect(pill()).toHaveClass('opacity-0', 'pointer-events-none');

      scrollTo(600);
      expect(pill()).toHaveClass('opacity-0');

      scrollTo(601);
      expect(pill()).toHaveClass('opacity-100');
      expect(within(pill()).getByText('naughty dog')).toBeInTheDocument();
    });

    it('asks the scroll area to go back to the top', () => {
      const toTop = vi.fn();
      window.addEventListener('nexusScrollToTop', toTop);
      setup();

      fireEvent.click(screen.getByRole('button', { name: /Scroll to top/ }));

      expect(toTop).toHaveBeenCalledOnce();
      window.removeEventListener('nexusScrollToTop', toTop);
    });

    it('stops listening once the page is gone', () => {
      const removed = vi.spyOn(window, 'removeEventListener');
      const { unmount } = setup();

      unmount();

      expect(removed).toHaveBeenCalledWith('nexusScroll', expect.any(Function));
      removed.mockRestore();
    });
  });
});
