import { fireEvent, render, screen, within } from '@testing-library/react';
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

    expect(screen.queryByRole('button', { name: /Previous|Next|Show screenshot/ })).not.toBeInTheDocument();
    expect(screen.getByText('1 / 1')).toBeInTheDocument();
  });

  describe('enlarged', () => {
    const viewer = () => screen.getByRole('dialog', { name: /^Screenshot \d of 3$/ });
    const enlarge = (n = 1) => fireEvent.click(screen.getByRole('button', { name: `Enlarge screenshot ${n}` }));

    it('opens the shown screenshot large, at the 1080p size', () => {
      render(<ScreenshotGallery screenshots={shots} />);
      fireEvent.click(screen.getByRole('button', { name: 'Next screenshot' }));

      enlarge(2);

      expect(within(viewer()).getByRole('img')).toHaveAttribute('src', 'https://images.igdb.com/igdb/image/upload/t_1080p/sc2.jpg');
      expect(within(viewer()).getByText('2 / 3')).toBeInTheDocument();
    });

    it('moves with its own arrows and the arrow keys', () => {
      render(<ScreenshotGallery screenshots={shots} />);
      enlarge();

      fireEvent.click(within(viewer()).getByRole('button', { name: 'Next screenshot' }));
      expect(within(viewer()).getByRole('img')).toHaveAttribute('src', expect.stringContaining('sc2.jpg'));

      fireEvent.keyDown(within(viewer()).getByRole('button', { name: 'Close viewer' }), { key: 'ArrowRight' });
      expect(within(viewer()).getByRole('img')).toHaveAttribute('src', expect.stringContaining('sc3.jpg'));
    });

    it('closes, leaving the gallery on the same screenshot', () => {
      render(<ScreenshotGallery screenshots={shots} />);
      enlarge();
      fireEvent.click(within(viewer()).getByRole('button', { name: 'Next screenshot' }));

      fireEvent.click(screen.getByRole('button', { name: 'Close viewer' }));

      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
      expect(large()).toHaveAttribute('src', shots[1].image);
    });
  });
});
