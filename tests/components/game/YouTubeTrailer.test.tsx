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
});
