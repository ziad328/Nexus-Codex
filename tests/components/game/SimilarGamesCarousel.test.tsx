import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import SimilarGamesCarousel from '../../../src/components/game/SimilarGamesCarousel';
import { apiRequests, deferred, mockApi, mockApiError } from '../../fakes/network';
import { makeGame } from '../../fixtures';

const URL = '/games/1/game-series';
const settle = () => new Promise((resolve) => setTimeout(resolve));

const renderLoaded = async (onSelectGame = vi.fn()) => {
  mockApi(URL, { results: [makeGame(2, { metacritic: 88 }), makeGame(3, { metacritic: null })] });
  const view = render(<SimilarGamesCarousel gameId={1} onSelectGame={onSelectGame} />);
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
  it('shows a spinner while loading', async () => {
    mockApi(URL, () => deferred().promise);

    const { container } = render(<SimilarGamesCarousel gameId={1} />);

    await waitFor(() => expect(container.querySelector('.animate-spin')).toBeInTheDocument());
  });

  it('shows nothing when there are no similar games', async () => {
    mockApi(URL, { results: [] });

    const { container } = render(<SimilarGamesCarousel gameId={1} />);

    await waitFor(() => expect(apiRequests).toHaveLength(1));
    await waitFor(() => expect(container).toBeEmptyDOMElement());
  });

  it('shows nothing when loading fails', async () => {
    mockApiError(URL);

    const { container } = render(<SimilarGamesCarousel gameId={1} />);

    await waitFor(() => expect(apiRequests).toHaveLength(1));
    await settle();
    await waitFor(() => expect(container).toBeEmptyDOMElement());
  });

  it('lists games with a cropped image, and a score only when there is one', async () => {
    await renderLoaded();

    expect(screen.getByRole('heading', { name: 'Game 2' })).toBeInTheDocument();
    expect(screen.getByRole('img', { name: 'Game 2' })).toHaveAttribute(
      'src',
      'https://media.rawg.io/media/crop/600/400/games/2.jpg',
    );
    expect(screen.getByText('88')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Game 3' })).toBeInTheDocument();
    expect(screen.getAllByText('88')).toHaveLength(1);
  });

  it('opens a game when clicked', async () => {
    const { onSelectGame } = await renderLoaded();

    fireEvent.click(screen.getByRole('button', { name: /game 2/i }));

    expect(onSelectGame).toHaveBeenCalledWith(2, makeGame(2, { metacritic: 88 }));
  });

  it('survives a click with no handler', async () => {
    mockApi(URL, { results: [makeGame(2)] });
    render(<SimilarGamesCarousel gameId={1} />);
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
    mockApi(URL, { results: [makeGame(2, { metacritic: 0 })] });
    render(<SimilarGamesCarousel gameId={1} />);
    await screen.findByRole('heading', { name: 'Game 2' });

    expect(screen.queryByText('0')).not.toBeInTheDocument();
  });
});
