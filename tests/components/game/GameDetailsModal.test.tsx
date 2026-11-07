import { fireEvent, screen, waitFor, within } from '@testing-library/react';
import GameDetailsModal from '../../../src/components/game/GameDetailsModal';
import { apiRequests, deferred, mockApi, mockApiError } from '../../fakes/network';
import { makeGame } from '../../fixtures';
import { renderWithProviders } from '../../render';

// The real library reads pixels from a canvas, which jsdom lacks. Same shape as colorthief 3's exports.
const cover = { css: () => 'rgb(232, 67, 147)', array: () => [232, 67, 147], hex: () => '#e84393' };
vi.mock('colorthief', () => ({
  getColor: async () => cover,
  getColorSync: () => cover,
}));

const details = {
  id: 1,
  name: 'Portal',
  slug: 'portal',
  background_image: 'https://images.igdb.com/igdb/image/upload/t_cover_big/co1.jpg',
  parent_platforms: [{ platform: { id: 1, name: 'PC', slug: 'pc' } }],
  metacritic: 90,
  description_raw: 'A puzzle game',
  released: '2007-10-10',
  developers: [{ id: 1, name: 'Valve', slug: 'valve' }, { id: 2, name: 'Hidden Path', slug: 'hidden-path' }],
  publishers: [{ id: 3, name: 'EA', slug: 'ea' }],
  stores: [{ id: 1, store: { id: 1, name: 'Steam', slug: 'steam', domain: 'steampowered.com' } }],
  website: 'https://portal.test',
  reddit_url: 'https://reddit.test/portal',
};

const shot = { id: 5, image: 'https://images.igdb.com/igdb/image/upload/t_screenshot_big/sc5.jpg', width: 1, height: 1 };

interface Related {
  game?: object;
  screenshots?: object[];
  stores?: object[];
  similar?: object[];
}

/** One details answer carries everything the modal shows, as the proxy sends it. */
const mockGame = ({ game, screenshots = [], stores = [], similar = [] }: Related = {}) => {
  mockApi('/games/1', { ...details, screenshots, store_links: stores, trailers: [], similar, ...game });
};

const setup = (gameId: number | null = 1) => {
  const onClose = vi.fn();
  const onSelectGame = vi.fn();
  const view = renderWithProviders(<GameDetailsModal gameId={gameId} onClose={onClose} onSelectGame={onSelectGame} />);
  return { onClose, onSelectGame, ...view };
};

const renderLoaded = async (related?: Related) => {
  mockGame(related);
  const view = setup();
  await screen.findByRole('heading', { name: 'Portal', level: 1 });
  return view;
};

const modalBox = () => document.getElementById('game-modal-content')!;

describe('opening', () => {
  it('shows nothing and asks for nothing without a game', () => {
    const { container } = setup(null);

    expect(container).toBeEmptyDOMElement();
    expect(apiRequests).toEqual([]);
  });

  it('shows loading first', () => {
    mockGame();
    mockApi('/games/1', () => deferred().promise);

    setup();

    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  it('shows the error when the game fails to load', async () => {
    mockGame();
    mockApiError('/games/1', 404);

    setup();

    expect(await screen.findByText(/status code 404/)).toBeInTheDocument();
  });
});

describe('game information', () => {
  it('shows name, description, image, score, platforms and date', async () => {
    await renderLoaded();

    expect(screen.getByText('A puzzle game')).toBeInTheDocument();
    expect(screen.getByRole('img', { name: 'Portal' })).toHaveAttribute('src', details.background_image);
    expect(screen.getByText('90')).toBeInTheDocument();
    expect(screen.getByTitle('PC')).toBeInTheDocument();
    expect(screen.getByText('2007-10-10')).toBeInTheDocument();
  });

  it('has fallbacks for a missing description and date', async () => {
    await renderLoaded({ game: { description_raw: '', released: null } });

    expect(screen.getByText('No description available.')).toBeInTheDocument();
    expect(screen.getByText('Release Date').nextElementSibling).toHaveTextContent('—');
  });

  it('links each developer and publisher to its page, closing the modal', async () => {
    const { onClose } = await renderLoaded();

    expect(screen.getByRole('link', { name: 'Hidden Path' })).toHaveAttribute('href', '/developer/hidden-path');
    expect(screen.getByRole('link', { name: 'EA' })).toHaveAttribute('href', '/publisher/ea');

    fireEvent.click(screen.getByRole('link', { name: 'Valve' }));

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('shows a dash when developers and publishers are absent', async () => {
    await renderLoaded({ game: { developers: undefined, publishers: undefined } });

    expect(screen.getByText('Developer').nextElementSibling).toHaveTextContent('—');
    expect(screen.getByText('Publisher').nextElementSibling).toHaveTextContent('—');
  });

  it.fails('BUG-24: shows a dash when the developer list is empty', async () => {
    await renderLoaded({ game: { developers: [] } });

    expect(screen.getByText('Developer').nextElementSibling).toHaveTextContent('—');
  });

  it('sets the page title and a shortened description for sharing', async () => {
    await renderLoaded({ game: { description_raw: 'x'.repeat(300) } });

    await waitFor(() => expect(document.title).toBe('Portal | Nexus Codex'));
    expect(document.head.querySelector('meta[name="description"]')?.getAttribute('content')).toHaveLength(160);
    expect(document.head.querySelector('meta[property="og:image"]')?.getAttribute('content')).toBe(details.background_image);
  });
});

describe('gallery', () => {
  it('shows the screenshots, and uses the first as the wide header image', async () => {
    await renderLoaded({ screenshots: [shot] });

    expect(await screen.findByRole('img', { name: 'Screenshot 1 of 1' })).toHaveAttribute('src', shot.image);
    expect(screen.getByRole('img', { name: 'Portal' })).toHaveAttribute('src', shot.image);
  });

  it('starts the next game on its own first screenshot', async () => {
    const shots = [shot, { ...shot, id: 6, image: 'https://images.igdb.com/igdb/image/upload/t_screenshot_big/sc6.jpg' }];
    mockGame({ screenshots: shots });
    const { rerender } = setup();
    fireEvent.click(await screen.findByRole('button', { name: 'Next screenshot' }));
    expect(screen.getByText('2 / 2')).toBeInTheDocument();

    mockApi('/games/2', { ...details, id: 2, name: 'Doom', screenshots: shots, store_links: [], similar: [], trailers: [] });
    rerender(<GameDetailsModal gameId={2} onClose={vi.fn()} />);

    await screen.findByRole('heading', { name: 'Doom', level: 1 });
    expect(screen.getByText('1 / 2')).toBeInTheDocument();
  });

  it('uses the cover as the header image when there are no screenshots', async () => {
    await renderLoaded();

    expect(screen.getByRole('img', { name: 'Portal' })).toHaveAttribute('src', details.background_image);
  });

  it('shows trailers even without screenshots (BUG-4, fixed)', async () => {
    await renderLoaded({ game: { trailers: [{ id: 6, name: 'Launch Trailer', youtube_id: 'abc123' }] } });

    expect(screen.getByRole('button', { name: 'Play trailer: Launch Trailer' })).toBeInTheDocument();
    expect(screen.queryByText('Gallery')).not.toBeInTheDocument();
  });

  it('starts the next game on its own first trailer, not playing', async () => {
    mockGame({ game: { trailers: [{ id: 6, name: 'Launch Trailer', youtube_id: 'abc123' }] } });
    const { rerender } = setup();
    fireEvent.click(await screen.findByRole('button', { name: 'Play trailer: Launch Trailer' }));
    expect(document.querySelector('iframe')).toBeInTheDocument();

    mockApi('/games/2', { ...details, id: 2, name: 'Doom', screenshots: [], store_links: [], similar: [], trailers: [{ id: 7, name: 'Doom Trailer', youtube_id: 'doom123' }] });
    rerender(<GameDetailsModal gameId={2} onClose={vi.fn()} />);

    expect(await screen.findByRole('button', { name: 'Play trailer: Doom Trailer' })).toBeInTheDocument();
    expect(document.querySelector('iframe')).toBeNull();
  });

  it('has no gallery or trailers without screenshots or trailers', async () => {
    await renderLoaded();

    expect(screen.queryByText('Gallery')).not.toBeInTheDocument();
  });

});

describe('where to buy', () => {
  const steamLink = { id: 9, store_id: 1, url: 'https://steam.test/portal' };

  it('links each store by name, opening safely in a new tab', async () => {
    await renderLoaded({ stores: [steamLink] });

    const link = await screen.findByRole('link', { name: 'Steam' });
    expect(link).toHaveAttribute('href', steamLink.url);
    expect(link).toHaveAttribute('target', '_blank');
    expect(link).toHaveAttribute('rel', 'noopener noreferrer');
  });

  it('skips a link for a store it cannot name', async () => {
    await renderLoaded({ stores: [steamLink, { id: 10, store_id: 99, url: 'https://unknown.test' }] });

    await screen.findByRole('link', { name: 'Steam' });

    expect(screen.getAllByRole('link').map((link) => link.getAttribute('href'))).not.toContain('https://unknown.test');
  });

  it('hides the section without links', async () => {
    await renderLoaded();

    expect(screen.queryByText('Where to Buy')).not.toBeInTheDocument();
  });
});

describe('official links', () => {
  it('links the website and Reddit in new tabs', async () => {
    await renderLoaded();

    expect(screen.getByRole('link', { name: 'Official Website' })).toHaveAttribute('href', details.website);
    expect(screen.getByRole('link', { name: 'Official Website' })).toHaveAttribute('target', '_blank');
    expect(screen.getByRole('link', { name: 'Reddit Community' })).toHaveAttribute('href', details.reddit_url);
  });

  it('shows only the link that exists', async () => {
    await renderLoaded({ game: { reddit_url: '' } });

    expect(screen.getByRole('link', { name: 'Official Website' })).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Reddit Community' })).not.toBeInTheDocument();
  });

  it('hides the section without links', async () => {
    await renderLoaded({ game: { reddit_url: '', website: '' } });

    expect(screen.queryByText('Official Links')).not.toBeInTheDocument();
  });
});

describe('related sections', () => {
  it('opens a similar game', async () => {
    const similar = makeGame(2);
    const { onSelectGame } = await renderLoaded({ similar: [similar] });

    fireEvent.click(await screen.findByRole('button', { name: /game 2/i }));

    expect(onSelectGame).toHaveBeenCalledWith(2, similar);
  });
});

describe('saving the game', () => {
  const saved = makeGame(1, { name: 'Portal', slug: 'portal', background_image: details.background_image, metacritic: 90 });

  it('adds it to favorites with its details', async () => {
    const { store } = await renderLoaded();

    fireEvent.click(screen.getByRole('button', { name: 'Add to favorites' }));

    await waitFor(() => expect(store.getState().favorites.items).toEqual([saved]));
  });

  it('adds it to a list with its details', async () => {
    const { store } = await renderLoaded();

    fireEvent.click(screen.getByRole('button', { name: 'Add to collection' }));
    fireEvent.click(screen.getByRole('button', { name: 'Beaten' }));

    await waitFor(() => {
      expect(store.getState().collections.lists.find((list) => list.name === 'beaten')?.games).toEqual([saved]);
    });
  });

  it('saves a missing score as null', async () => {
    const { store } = await renderLoaded({ game: { metacritic: undefined } });

    fireEvent.click(screen.getByRole('button', { name: 'Add to favorites' }));

    await waitFor(() => expect(store.getState().favorites.items[0]?.metacritic).toBeNull());
  });
});

describe('sharing', () => {
  afterEach(() => {
    Reflect.deleteProperty(navigator, 'clipboard');
  });

  it('copies a deep link to this game and says so', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'clipboard', { value: { writeText }, configurable: true });
    await renderLoaded();

    fireEvent.click(screen.getByRole('button', { name: /share/i }));

    expect(await screen.findByText('Copied!')).toBeInTheDocument();
    expect(writeText).toHaveBeenCalledWith(`${window.location.origin}/?game=1`);
  });

  it('says so when sharing fails', async () => {
    const writeText = vi.fn().mockRejectedValue(new Error('Denied'));
    Object.defineProperty(navigator, 'clipboard', { value: { writeText }, configurable: true });
    await renderLoaded();

    fireEvent.click(screen.getByRole('button', { name: /share/i }));

    expect(await screen.findByText('Failed')).toBeInTheDocument();
  });
});

describe('closing', () => {
  it('closes from the X', async () => {
    const { onClose } = await renderLoaded();

    fireEvent.click(screen.getByRole('button', { name: 'Close' }));

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('closes when the backdrop is clicked', async () => {
    const { onClose } = await renderLoaded();

    fireEvent.click(screen.getByRole('button', { name: 'Close modal' }));

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it.each(['Enter', 'Escape'])('closes with %s when the backdrop has focus', async (key) => {
    const { onClose } = await renderLoaded();

    fireEvent.keyDown(screen.getByRole('button', { name: 'Close modal' }), { key });

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it.fails('BUG-23: closes with Escape wherever the focus is', async () => {
    const { onClose } = await renderLoaded();

    fireEvent.keyDown(document.body, { key: 'Escape' });

    expect(onClose).toHaveBeenCalledTimes(1);
  });
});

describe('background scrolling while open', () => {
  it('blocks the wheel and touch outside the modal, but not inside', async () => {
    await renderLoaded();

    expect(fireEvent.wheel(document.body)).toBe(false);
    expect(fireEvent.touchMove(document.body)).toBe(false);
    expect(fireEvent.wheel(within(modalBox()).getByText('A puzzle game'))).toBe(true);
    expect(fireEvent.touchMove(within(modalBox()).getByText('A puzzle game'))).toBe(true);
  });

  it.each(['ArrowUp', 'ArrowDown', 'Space', 'PageUp', 'PageDown', 'Home', 'End'])(
    'blocks %s outside the modal, but not inside',
    async (code) => {
      await renderLoaded();

      expect(fireEvent.keyDown(document.body, { code })).toBe(false);
      expect(fireEvent.keyDown(within(modalBox()).getByText('A puzzle game'), { code })).toBe(true);
    },
  );

  it('leaves other keys alone', async () => {
    await renderLoaded();

    expect(fireEvent.keyDown(document.body, { code: 'KeyA' })).toBe(true);
  });

  it('lets the page scroll again once closed', async () => {
    const { unmount } = await renderLoaded();

    unmount();

    expect(fireEvent.wheel(document.body)).toBe(true);
    expect(fireEvent.keyDown(document.body, { code: 'ArrowDown' })).toBe(true);
  });
});

describe('glow from the cover', () => {
  const glow = () => modalBox().style.boxShadow;

  it('starts with the plain shadow', async () => {
    await renderLoaded();

    expect(glow()).toContain('rgba(0,0,0,0.8)');
  });

  it.fails('BUG-1: takes its colour from the cover once it loads', async () => {
    await renderLoaded();

    fireEvent.load(screen.getByRole('img', { name: 'Portal' }));

    await waitFor(() => expect(glow()).toContain('232'));
  });

  it('requests the cover in a way that lets its colours be read (one of the three BUG-1 causes, fixed)', async () => {
    await renderLoaded();

    expect(screen.getByRole('img', { name: 'Portal' })).toHaveAttribute('crossorigin', 'anonymous');
  });
});

