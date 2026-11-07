import { act, fireEvent, screen, waitFor } from '@testing-library/react';
import GameGrid from '../../../src/components/game/GameGrid';
import { triggerIntersection } from '../../fakes/browser';
import { apiRequests, deferred, mockApi, mockApiError } from '../../fakes/network';
import type { RecordedRequest } from '../../fakes/network';
import { makeGame } from '../../fixtures';
import { renderWithProviders } from '../../render';

const page = (ids: number[], hasMore: boolean, overrides: object = {}) => ({
  count: 100,
  next: hasMore ? 'next' : null,
  results: ids.map((id) => ({ ...makeGame(id), rating_top: 5, ...overrides })),
});

const mockTwoPages = () => {
  mockApi('/games', ({ params }: RecordedRequest) => (params.page === 1 ? page([1], true) : page([2], false)));
};

const setup = (viewMode?: 'grid' | 'list') => {
  const onSelectGame = vi.fn();
  return { onSelectGame, ...renderWithProviders(<GameGrid gameQuery={{}} onSelectGame={onSelectGame} viewMode={viewMode} />) };
};

const settle = () => act(() => new Promise((resolve) => setTimeout(resolve)));
// Settles first: a heading can appear before the grid has attached its observer to the new scroll trigger.
const reachBottom = async () => {
  await settle();
  act(() => triggerIntersection());
};

describe('loading', () => {
  it('shows 12 placeholders', () => {
    mockApi('/games', () => deferred().promise);

    const { container } = setup();

    expect(container.querySelectorAll('.animate-shimmer')).toHaveLength(12);
  });

  it('replaces them with game cards', async () => {
    mockTwoPages();

    const { container } = setup();

    expect(await screen.findByRole('heading', { name: 'Game 1' })).toBeInTheDocument();
    expect(container.querySelectorAll('.animate-shimmer')).toHaveLength(0);
  });
});

it('opens a game when its card is clicked', async () => {
  mockTwoPages();
  const { onSelectGame } = setup();

  fireEvent.click(await screen.findByRole('button', { name: 'View details for Game 1' }));

  expect(onSelectGame).toHaveBeenCalledWith(1, makeGame(1));
});

it.each([
  ['grid', '.grid'],
  ['list', '.flex-col'],
] as const)('uses the %s layout', async (viewMode, selector) => {
  mockTwoPages();
  const { container } = setup(viewMode);

  await screen.findByRole('heading', { name: 'Game 1' });

  expect(container.querySelector(`.w-full > ${selector}`)).toBeInTheDocument();
});

it('says so when nothing matches', async () => {
  mockApi('/games', page([], false));

  setup();

  expect(await screen.findByText(/no games found/i)).toBeInTheDocument();
});

describe('infinite scroll', () => {
  it('loads and adds the next page on reaching the bottom', async () => {
    mockTwoPages();
    setup();
    await screen.findByRole('heading', { name: 'Game 1' });

    await reachBottom();

    expect(await screen.findByRole('heading', { name: 'Game 2' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Game 1' })).toBeInTheDocument();
    expect(apiRequests.at(-1)?.params.page).toBe(2);
  });

  it('shows progress and asks only once while a page is loading', async () => {
    const second = deferred<unknown>();
    mockApi('/games', ({ params }: RecordedRequest) => (params.page === 1 ? page([1], true) : second.promise));
    const { container } = setup();
    await screen.findByRole('heading', { name: 'Game 1' });

    await reachBottom();
    await waitFor(() => expect(container.querySelector('.animate-pulse.rounded-full')).toBeInTheDocument());
    await reachBottom();
    await settle();

    expect(apiRequests).toHaveLength(2);
    second.resolve(page([2], false));
    await screen.findByRole('heading', { name: 'Game 2' });
  });

  it('stops asking after the last page', async () => {
    mockApi('/games', page([1], false));
    setup();
    await screen.findByRole('heading', { name: 'Game 1' });

    await reachBottom();
    await settle();

    expect(apiRequests).toHaveLength(1);
  });

  it('shows a spinner while more pages exist, and none after the last', async () => {
    mockTwoPages();
    const { container } = setup();
    await screen.findByRole('heading', { name: 'Game 1' });
    expect(container.querySelector('.animate-spin')).toBeInTheDocument();

    await reachBottom();
    await screen.findByRole('heading', { name: 'Game 2' });

    expect(container.querySelector('.animate-spin')).not.toBeInTheDocument();
  });

  it.fails('BUG-21: keeps going when a whole page was hidden by the adult filter', async () => {
    mockApi('/games', ({ params }: RecordedRequest) =>
      params.page === 1 ? page([1], true, { name: 'Hentai Quest' }) : page([2], false),
    );
    setup();

    expect(await screen.findByRole('heading', { name: 'Game 2' })).toBeInTheDocument();
  });
});

describe('errors', () => {
  it('explains a failed first load and links to saved collections', async () => {
    mockApiError('/games', 503);

    setup();

    expect(await screen.findByText('Failed to connect to Nexus')).toBeInTheDocument();
    expect(screen.getByText(/status code 503/)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /view collections cache/i })).toHaveAttribute('href', '/collection');
  });

  it('does not keep retrying after a failed first load', async () => {
    mockApiError('/games');
    setup();
    await screen.findByText('Failed to connect to Nexus');

    await reachBottom();
    await settle();

    expect(apiRequests).toHaveLength(1);
  });

  describe('when a later page fails', () => {
    const failSecondPage = async () => {
      mockApi('/games', ({ params }: RecordedRequest) => {
        if (params.page === 1) return page([1], true);
        throw new Error('Network Error');
      });
      setup();
      await screen.findByRole('heading', { name: 'Game 1' });
      await reachBottom();
      await screen.findByText(/cannot load more games/i);
    };

    it('keeps the loaded games and shows a banner', async () => {
      await failSecondPage();

      expect(screen.getByRole('heading', { name: 'Game 1' })).toBeInTheDocument();
      expect(screen.queryByText('Failed to connect to Nexus')).not.toBeInTheDocument();
    });

    it('does not loop, however often the bottom is reached', async () => {
      await failSecondPage();
      const requestsSoFar = apiRequests.length;

      await reachBottom();
      await reachBottom();
      await settle();

      expect(apiRequests).toHaveLength(requestsSoFar);
    });
  });
});

it('stops observing when removed', async () => {
  mockTwoPages();
  const { unmount } = setup();
  await screen.findByRole('heading', { name: 'Game 1' });

  unmount();
  await reachBottom();
  await settle();

  expect(apiRequests).toHaveLength(1);
});
