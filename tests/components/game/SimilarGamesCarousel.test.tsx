import { fireEvent, render, screen } from '@testing-library/react';
import SimilarGamesCarousel from '../../../src/components/game/SimilarGamesCarousel';
import type { Game } from '../../../src/types';
import { makeGame } from '../../fixtures';

// Similar games now arrive with the game's details, so the carousel only shows them.
const games = (...list: ReturnType<typeof makeGame>[]) => list as Game[];
const cover = 'https://images.igdb.com/igdb/image/upload/t_cover_big/co2.jpg';

const renderLoaded = async (onSelectGame = vi.fn()) => {
  const view = render(
    <SimilarGamesCarousel games={games(makeGame(2, { metacritic: 88, background_image: cover }), makeGame(3, { metacritic: null }))} onSelectGame={onSelectGame} />,
  );
  await screen.findByText('You Might Also Like');
  return { onSelectGame, strip: view.container.querySelector('.overflow-x-auto')!, ...view };
};

/** jsdom does no layout, so a scroll position has to be described by hand. */
const layout = (element: Element, { scrollWidth, clientWidth, scrollLeft = 0 }: Record<string, number>) => {
  Object.defineProperty(element, 'scrollWidth', { value: scrollWidth, configurable: true });
  Object.defineProperty(element, 'clientWidth', { value: clientWidth, configurable: true });
  element.scrollLeft = scrollLeft;
  fireEvent.scroll(element);
};

describe('SimilarGamesCarousel', () => {
  it('shows nothing when there are no similar games', () => {
    const { container } = render(<SimilarGamesCarousel games={[]} />);

    expect(container).toBeEmptyDOMElement();
  });

  it('lists games with their image, and a score only when there is one', async () => {
    await renderLoaded();

    expect(screen.getByRole('heading', { name: 'Game 2' })).toBeInTheDocument();
    expect(screen.getByRole('img', { name: 'Game 2' })).toHaveAttribute('src', cover);
    expect(screen.getByText('88')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Game 3' })).toBeInTheDocument();
    expect(screen.getAllByText('88')).toHaveLength(1);
  });

  it('opens a game when clicked', async () => {
    const { onSelectGame } = await renderLoaded();

    fireEvent.click(screen.getByRole('button', { name: /game 2/i }));

    expect(onSelectGame).toHaveBeenCalledWith(2, makeGame(2, { metacritic: 88, background_image: cover }));
  });

  it('survives a click with no handler', async () => {
    render(<SimilarGamesCarousel games={games(makeGame(2))} />);
    const button = await screen.findByRole('button', { name: /game 2/i });
    // An error inside a click handler reaches window's error event, not this test.
    const onError = vi.fn((event: ErrorEvent) => event.preventDefault());
    window.addEventListener('error', onError);

    fireEvent.click(button);

    window.removeEventListener('error', onError);
    expect(onError).not.toHaveBeenCalled();
  });

  it('has no arrows when everything fits', async () => {
    const { strip } = await renderLoaded();

    layout(strip, { scrollWidth: 600, clientWidth: 600 });

    expect(screen.queryByRole('button', { name: /^scroll/i })).not.toBeInTheDocument();
  });

  it('offers only the direction with more games', async () => {
    const { strip } = await renderLoaded();

    layout(strip, { scrollWidth: 1200, clientWidth: 600 });
    expect(screen.getByRole('button', { name: 'Scroll right' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Scroll left' })).not.toBeInTheDocument();

    layout(strip, { scrollWidth: 1200, clientWidth: 600, scrollLeft: 600 });
    expect(screen.getByRole('button', { name: 'Scroll left' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Scroll right' })).not.toBeInTheDocument();
  });

  it('moves one card width when an arrow is clicked', async () => {
    const { strip } = await renderLoaded();
    const scrollBy = vi.spyOn(strip, 'scrollBy');
    layout(strip, { scrollWidth: 1800, clientWidth: 600, scrollLeft: 300 });

    fireEvent.click(screen.getByRole('button', { name: 'Scroll right' }));
    expect(scrollBy).toHaveBeenLastCalledWith({ left: 296, behavior: 'smooth' });

    fireEvent.click(screen.getByRole('button', { name: 'Scroll left' }));
    expect(scrollBy).toHaveBeenLastCalledWith({ left: -296, behavior: 'smooth' });
  });

  it.fails('BUG-22: does not show a stray 0 for a game scored 0', async () => {
    render(<SimilarGamesCarousel games={games(makeGame(2, { metacritic: 0 }))} />);
    await screen.findByRole('heading', { name: 'Game 2' });

    expect(screen.queryByText('0')).not.toBeInTheDocument();
  });
});
