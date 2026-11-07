import { fireEvent, render, screen } from '@testing-library/react';
import YouTubeTrailer from '../../../src/components/game/YouTubeTrailer';

const launch = { id: 1, name: 'Launch Trailer', youtube_id: 'abc123DEF_-' };
const gameplay = { id: 2, name: 'Gameplay', youtube_id: 'xyz789' };

const iframe = () => document.querySelector('iframe');

describe('YouTubeTrailer', () => {
  it('shows nothing without trailers', () => {
    const { container } = render(<YouTubeTrailer trailers={[]} />);

    expect(container).toBeEmptyDOMElement();
  });

  it('loads only a thumbnail until play is pressed: no player and no cookies', () => {
    render(<YouTubeTrailer trailers={[launch]} />);

    expect(iframe()).toBeNull();
    expect(screen.getByRole('button', { name: 'Play trailer: Launch Trailer' }).querySelector('img'))
      .toHaveAttribute('src', 'https://i.ytimg.com/vi/abc123DEF_-/hqdefault.jpg');
  });

  it("plays in YouTube's privacy-enhanced player when pressed", () => {
    render(<YouTubeTrailer trailers={[launch]} />);

    fireEvent.click(screen.getByRole('button', { name: 'Play trailer: Launch Trailer' }));

    expect(iframe()).toHaveAttribute('src', 'https://www.youtube-nocookie.com/embed/abc123DEF_-?autoplay=1&rel=0');
    expect(iframe()).toHaveAttribute('title', 'Launch Trailer');
    expect(iframe()).toHaveAttribute('allowfullscreen');
  });

  it('plays in a full-screen viewer, outside the rounded frame that blocks clicks in Chrome, and stops when closed', () => {
    const { container } = render(<YouTubeTrailer trailers={[launch]} />);
    fireEvent.click(screen.getByRole('button', { name: 'Play trailer: Launch Trailer' }));

    const viewer = screen.getByRole('dialog', { name: 'Launch Trailer' });
    expect(viewer).toContainElement(iframe());
    expect(container).not.toContainElement(iframe());
    expect(iframe()!.closest('.rounded-xl')).toBeNull();

    fireEvent.click(screen.getByRole('button', { name: 'Close viewer' }));

    expect(iframe()).toBeNull();
    expect(screen.getByRole('button', { name: 'Play trailer: Launch Trailer' })).toBeInTheDocument();
  });

  it('offers a choice when there are several, and stops the playing one when switching', () => {
    render(<YouTubeTrailer trailers={[launch, gameplay]} />);
    expect(screen.getByRole('button', { name: 'Launch Trailer' })).toHaveAttribute('aria-pressed', 'true');
    fireEvent.click(screen.getByRole('button', { name: 'Play trailer: Launch Trailer' }));

    fireEvent.click(screen.getByRole('button', { name: 'Gameplay' }));

    expect(iframe()).toBeNull();
    expect(screen.getByRole('button', { name: 'Gameplay' })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('button', { name: 'Play trailer: Gameplay' })).toBeInTheDocument();
  });

  it('has no choice buttons for a single trailer', () => {
    render(<YouTubeTrailer trailers={[launch]} />);

    expect(screen.getAllByRole('button')).toHaveLength(1);
  });

  it('skips an id that is not a YouTube id, rather than put it in a URL', () => {
    const { container } = render(<YouTubeTrailer trailers={[{ id: 3, name: 'Bad', youtube_id: 'x"/><script>' }]} />);

    expect(container).toBeEmptyDOMElement();
  });

  describe('with many trailers', () => {
    const many = (count: number) =>
      Array.from({ length: count }, (_, i) => ({ id: i + 1, name: `Trailer ${i + 1}`, youtube_id: `vid${i + 1}xyz` }));
    const choices = () => screen.getAllByRole('button', { name: /^Trailer \d+$/ }).map((button) => button.textContent);

    it('shows five choices and a button for the rest', () => {
      render(<YouTubeTrailer trailers={many(20)} />);

      expect(choices()).toEqual(['Trailer 1', 'Trailer 2', 'Trailer 3', 'Trailer 4', 'Trailer 5']);
      expect(screen.getByRole('button', { name: 'Show all (20)' })).toBeInTheDocument();
    });

    it('reveals every choice, then hides the button', () => {
      render(<YouTubeTrailer trailers={many(20)} />);

      fireEvent.click(screen.getByRole('button', { name: 'Show all (20)' }));

      expect(choices()).toHaveLength(20);
      expect(screen.queryByRole('button', { name: /Show all/ })).not.toBeInTheDocument();

      fireEvent.click(screen.getByRole('button', { name: 'Trailer 17' }));
      expect(screen.getByRole('button', { name: 'Play trailer: Trailer 17' })).toBeInTheDocument();
    });

    it('needs no button for exactly five', () => {
      render(<YouTubeTrailer trailers={many(5)} />);

      expect(choices()).toHaveLength(5);
      expect(screen.queryByRole('button', { name: /Show all/ })).not.toBeInTheDocument();
    });

    it('counts only playable trailers', () => {
      render(<YouTubeTrailer trailers={[...many(6), { id: 99, name: 'Bad', youtube_id: 'x"/>' }]} />);

      expect(screen.getByRole('button', { name: 'Show all (6)' })).toBeInTheDocument();
    });
  });
});
