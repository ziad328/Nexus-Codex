import { fireEvent, screen } from '@testing-library/react';
import RecentlyViewed from '../../../src/components/shared/RecentlyViewed';
import type { FavoriteGame } from '../../../src/types';
import { makeGame } from '../../fixtures';
import { renderWithProviders } from '../../render';

const setup = (recentlyViewed: FavoriteGame[]) => {
  const onSelectGame = vi.fn();
  const view = renderWithProviders(<RecentlyViewed onSelectGame={onSelectGame} />, {
    preloadedState: { ui: { viewMode: 'grid', recentlyViewed, searchQueries: {}, isAuthModalOpen: false } },
  });
  return { onSelectGame, ...view };
};

/** jsdom does no layout, so a scroll position has to be described by hand. */
const layout = (element: Element, { scrollWidth, clientWidth, scrollLeft = 0 }: Record<string, number>) => {
  Object.defineProperty(element, 'scrollWidth', { value: scrollWidth, configurable: true });
  Object.defineProperty(element, 'clientWidth', { value: clientWidth, configurable: true });
  element.scrollLeft = scrollLeft;
  fireEvent.scroll(element);
};

const strip = (container: HTMLElement) => container.querySelector('.overflow-x-auto')!;

describe('RecentlyViewed', () => {
  it('shows nothing when empty', () => {
    const { container } = setup([]);

    expect(container).toBeEmptyDOMElement();
  });

  it('lists games with a cropped image', () => {
    setup([makeGame(1), makeGame(2)]);

    expect(screen.getByText('Recently Viewed')).toBeInTheDocument();
    expect(screen.getByRole('img', { name: 'Game 1' })).toHaveAttribute(
      'src',
      'https://images.igdb.com/igdb/image/upload/t_cover_big_2x/co1.jpg',
    );
    expect(screen.getByRole('img', { name: 'Game 2' })).toBeInTheDocument();
  });

  it('shows a placeholder for a game with no image', () => {
    setup([makeGame(1, { background_image: '' })]);

    expect(screen.getByText('No Img')).toBeInTheDocument();
    expect(screen.queryByRole('img')).not.toBeInTheDocument();
  });

  it('opens a game when clicked', () => {
    const { onSelectGame } = setup([makeGame(7)]);

    fireEvent.click(screen.getByTitle('Game 7'));

    expect(onSelectGame).toHaveBeenCalledWith(7);
  });

  it('clears the list', () => {
    const { store, container } = setup([makeGame(1)]);

    fireEvent.click(screen.getByRole('button', { name: 'Clear' }));

    expect(store.getState().ui.recentlyViewed).toEqual([]);
    expect(container).toBeEmptyDOMElement();
  });

  describe('scrolling', () => {
    it('has no arrows when everything fits', () => {
      const { container } = setup([makeGame(1)]);

      layout(strip(container), { scrollWidth: 300, clientWidth: 300 });

      expect(screen.queryByRole('button', { name: 'Scroll left' })).not.toBeInTheDocument();
      expect(screen.queryByRole('button', { name: 'Scroll right' })).not.toBeInTheDocument();
    });

    it('offers only the direction with more games', () => {
      const { container } = setup([makeGame(1)]);

      layout(strip(container), { scrollWidth: 900, clientWidth: 300 });
      expect(screen.getByRole('button', { name: 'Scroll right' })).toBeInTheDocument();
      expect(screen.queryByRole('button', { name: 'Scroll left' })).not.toBeInTheDocument();

      layout(strip(container), { scrollWidth: 900, clientWidth: 300, scrollLeft: 600 });
      expect(screen.getByRole('button', { name: 'Scroll left' })).toBeInTheDocument();
      expect(screen.queryByRole('button', { name: 'Scroll right' })).not.toBeInTheDocument();
    });

    it('moves 200 px when an arrow is clicked', () => {
      const { container } = setup([makeGame(1)]);
      const element = strip(container);
      const scrollBy = vi.spyOn(element, 'scrollBy');
      layout(element, { scrollWidth: 900, clientWidth: 300, scrollLeft: 100 });

      fireEvent.click(screen.getByRole('button', { name: 'Scroll right' }));
      expect(scrollBy).toHaveBeenLastCalledWith({ left: 200, behavior: 'smooth' });

      fireEvent.click(screen.getByRole('button', { name: 'Scroll left' }));
      expect(scrollBy).toHaveBeenLastCalledWith({ left: -200, behavior: 'smooth' });
    });

    it('turns the mouse wheel into sideways movement', () => {
      const { container } = setup([makeGame(1)]);
      const element = strip(container);

      fireEvent.wheel(element, { deltaY: 50 });

      expect(element.scrollLeft).toBe(50);
    });
  });
});
