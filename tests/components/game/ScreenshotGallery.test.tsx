import { fireEvent, render, screen } from '@testing-library/react';
import ScreenshotGallery from '../../../src/components/game/ScreenshotGallery';

const shots = [1, 2, 3].map((id) => ({ id, image: `https://images.igdb.com/igdb/image/upload/t_screenshot_big/sc${id}.jpg` }));

const large = () => screen.getByRole('img', { name: /^Screenshot \d of \d$/ });
const gallery = () => screen.getByRole('region', { name: 'Screenshots' });

describe('ScreenshotGallery', () => {
  it('shows nothing without screenshots', () => {
    const { container } = render(<ScreenshotGallery screenshots={[]} />);

    expect(container).toBeEmptyDOMElement();
  });

  it('shows the first screenshot large, with a counter', () => {
    render(<ScreenshotGallery screenshots={shots} />);

    expect(large()).toHaveAttribute('src', shots[0].image);
    expect(large()).toHaveAccessibleName('Screenshot 1 of 3');
    expect(screen.getByText('1 / 3')).toBeInTheDocument();
  });

  it('moves with the arrow buttons, wrapping at both ends', () => {
    render(<ScreenshotGallery screenshots={shots} />);

    fireEvent.click(screen.getByRole('button', { name: 'Next screenshot' }));
    expect(large()).toHaveAttribute('src', shots[1].image);
    expect(screen.getByText('2 / 3')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Previous screenshot' }));
    fireEvent.click(screen.getByRole('button', { name: 'Previous screenshot' }));
    expect(large()).toHaveAttribute('src', shots[2].image);

    fireEvent.click(screen.getByRole('button', { name: 'Next screenshot' }));
    expect(large()).toHaveAttribute('src', shots[0].image);
  });

  it('jumps to a screenshot from its thumbnail, and marks it', () => {
    render(<ScreenshotGallery screenshots={shots} />);

    fireEvent.click(screen.getByRole('button', { name: 'Show screenshot 3' }));

    expect(large()).toHaveAttribute('src', shots[2].image);
    expect(screen.getByRole('button', { name: 'Show screenshot 3' })).toHaveAttribute('aria-current', 'true');
    expect(screen.getByRole('button', { name: 'Show screenshot 1' })).toHaveAttribute('aria-current', 'false');
  });

  it('uses the smaller IGDB size for thumbnails', () => {
    render(<ScreenshotGallery screenshots={shots} />);

    expect(screen.getByRole('button', { name: 'Show screenshot 2' }).querySelector('img'))
      .toHaveAttribute('src', 'https://images.igdb.com/igdb/image/upload/t_screenshot_med/sc2.jpg');
  });

  it('moves with the left and right arrow keys while it has focus, and leaves other keys alone', () => {
    render(<ScreenshotGallery screenshots={shots} />);

    expect(fireEvent.keyDown(gallery(), { key: 'ArrowRight' })).toBe(false);
    expect(large()).toHaveAttribute('src', shots[1].image);

    fireEvent.keyDown(screen.getByRole('button', { name: 'Show screenshot 1' }), { key: 'ArrowLeft' });
    expect(large()).toHaveAttribute('src', shots[0].image);

    expect(fireEvent.keyDown(gallery(), { key: 'ArrowDown' })).toBe(true);
    expect(large()).toHaveAttribute('src', shots[0].image);
  });

  it('can take keyboard focus', () => {
    render(<ScreenshotGallery screenshots={shots} />);

    expect(gallery()).toHaveAttribute('tabindex', '0');
  });

  it('swipes on touch screens, ignoring small movements', () => {
    render(<ScreenshotGallery screenshots={shots} />);
    const swipe = (from: number, to: number) => {
      fireEvent.touchStart(large(), { touches: [{ clientX: from }] });
      fireEvent.touchEnd(large(), { changedTouches: [{ clientX: to }] });
    };

    swipe(200, 100);
    expect(large()).toHaveAttribute('src', shots[1].image);

    swipe(100, 200);
    expect(large()).toHaveAttribute('src', shots[0].image);

    swipe(200, 180);
    expect(large()).toHaveAttribute('src', shots[0].image);
  });

  it('has no arrows or thumbnails for a single screenshot', () => {
    render(<ScreenshotGallery screenshots={[shots[0]]} />);

    expect(screen.queryAllByRole('button')).toHaveLength(0);
    expect(screen.getByText('1 / 1')).toBeInTheDocument();
  });
});
