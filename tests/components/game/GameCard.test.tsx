import { fireEvent, screen, waitFor } from '@testing-library/react';
import GameCard from '../../../src/components/game/GameCard';
import type { Game } from '../../../src/types';
import { makeGame } from '../../fixtures';
import { renderWithProviders } from '../../render';

const saved = makeGame(1, { name: 'Portal', metacritic: 90 });
const game = { ...saved, rating_top: 5 } as Game;
const expectedPayload = saved;

const views = ['grid', 'list'] as const;

const setup = (viewMode: (typeof views)[number], options: { isFavoritePage?: boolean; favorites?: boolean } = {}) => {
  const onClick = vi.fn();
  const view = renderWithProviders(
    <GameCard game={game} onClick={onClick} viewMode={viewMode} isFavoritePage={options.isFavoritePage} />,
    { preloadedState: { favorites: { items: options.favorites ? [saved] : [] } } },
  );
  return { onClick, card: screen.getByRole('button', { name: 'View details for Portal' }), ...view };
};

describe.each(views)('GameCard in %s view', (viewMode) => {
  it('shows the name, its cover, platforms and score', () => {
    setup(viewMode);

    expect(screen.getByRole('heading', { name: 'Portal' })).toBeInTheDocument();
    expect(screen.getByRole('img', { name: 'Portal' })).toHaveAttribute(
      'src',
      'https://images.igdb.com/igdb/image/upload/t_cover_big_2x/co1.jpg',
    );
    expect(screen.getByTitle('PC')).toBeInTheDocument();
    expect(screen.getAllByText('90').length).toBeGreaterThan(0);
  });

  it('opens with the game data when clicked', () => {
    const { onClick, card } = setup(viewMode);

    fireEvent.click(card);

    expect(onClick).toHaveBeenCalledWith(1, expectedPayload);
  });

  it.each(['Enter', ' '])('opens with the "%s" key, without scrolling the page', (key) => {
    const { onClick, card } = setup(viewMode);

    const notPrevented = fireEvent.keyDown(card, { key });

    expect(onClick).toHaveBeenCalledTimes(1);
    expect(notPrevented).toBe(false);
  });

  it('ignores other keys', () => {
    const { onClick, card } = setup(viewMode);

    fireEvent.keyDown(card, { key: 'a' });

    expect(onClick).not.toHaveBeenCalled();
  });

  it('turns a missing score into null for saving', () => {
    const onClick = vi.fn();
    renderWithProviders(
      <GameCard game={{ ...game, metacritic: undefined as unknown as number }} onClick={onClick} viewMode={viewMode} />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'View details for Portal' }));

    expect(onClick.mock.calls[0][1].metacritic).toBeNull();
  });

  it('copes with a game that has no platforms', () => {
    const withoutPlatforms = { ...game, parent_platforms: undefined } as unknown as Game;
    renderWithProviders(<GameCard game={withoutPlatforms} onClick={vi.fn()} viewMode={viewMode} />);

    expect(screen.queryByTitle('PC')).not.toBeInTheDocument();
  });

  describe('favorites', () => {
    it('adds a favorite without opening the card', async () => {
      const { onClick, store } = setup(viewMode);

      fireEvent.click(screen.getByRole('button', { name: 'Add to favorites' }));

      await waitFor(() => expect(store.getState().favorites.items).toEqual([expectedPayload]));
      expect(onClick).not.toHaveBeenCalled();
    });

    it('offers a remove button on the favorites page, without opening the card', async () => {
      const { onClick, store } = setup(viewMode, { isFavoritePage: true, favorites: true });

      expect(screen.queryByRole('button', { name: 'Add to favorites' })).not.toBeInTheDocument();
      fireEvent.click(screen.getByRole('button', { name: 'Remove from favorites' }));

      await waitFor(() => expect(store.getState().favorites.items).toEqual([]));
      expect(onClick).not.toHaveBeenCalled();
    });
  });

  it('adds to a list without opening the card', async () => {
    const { onClick, store } = setup(viewMode);

    fireEvent.click(screen.getByRole('button', { name: 'Add to collection' }));
    fireEvent.click(screen.getByRole('button', { name: 'Backlog' }));

    await waitFor(() => {
      expect(store.getState().collections.lists.find((list) => list.name === 'backlog')?.games).toEqual([expectedPayload]);
    });
    expect(onClick).not.toHaveBeenCalled();
  });
});

describe('GameCard', () => {
  it('shows portrait box art in the grid by default, filling its row', () => {
    const { container } = renderWithProviders(<GameCard game={game} onClick={vi.fn()} />);

    expect(container.querySelector('.aspect-3\\/4')).toHaveClass('w-full');
    expect(screen.getByRole('button', { name: `View details for ${game.name}` })).toHaveClass('h-full');
  });

  it('puts the score on the cover in the grid', () => {
    const { container } = renderWithProviders(<GameCard game={game} onClick={vi.fn()} />);

    expect(container.querySelector('.aspect-3\\/4')).toHaveTextContent(String(game.metacritic));
  });

  it('keeps the heart visible on touch screens, hiding it until hover only from md up', () => {
    renderWithProviders(<GameCard game={game} onClick={vi.fn()} />);

    const corner = screen.getByRole('button', { name: 'Add to favorites' }).parentElement!;
    expect(corner).toHaveClass('md:opacity-0');
    expect(corner).not.toHaveClass('opacity-0');
  });

  it('uses a small portrait thumbnail in list view', () => {
    const { container } = renderWithProviders(<GameCard game={game} onClick={vi.fn()} viewMode="list" />);

    expect(container.querySelector('.aspect-3\\/4')).toHaveClass('w-11');
  });
});
