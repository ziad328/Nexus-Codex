import { fireEvent, render, screen } from '@testing-library/react';
import CustomVideoPlayer from '../../../src/components/shared/CustomVideoPlayer';

const setup = () => {
  const play = vi.spyOn(HTMLMediaElement.prototype, 'play');
  const pause = vi.spyOn(HTMLMediaElement.prototype, 'pause');
  const { container, unmount } = render(<CustomVideoPlayer src="https://video.test/a.mp4" poster="https://video.test/a.jpg" />);
  const video = container.querySelector('video')!;
  const control = (icon: string) => container.querySelector(`button .lucide-${icon}`)!.closest('button')!;
  return {
    container,
    unmount,
    video,
    play,
    pause,
    control,
    player: screen.getByRole('button', { name: 'Video Player' }),
    progress: screen.getByRole('slider', { name: 'Video progress' }),
    volume: container.querySelector<HTMLInputElement>('input[type="range"]')!,
    bigPlayOverlay: container.querySelector('video + div')!,
  };
};

const withTimeline = (video: HTMLVideoElement, duration: number) => {
  Object.defineProperty(video, 'duration', { value: duration, configurable: true });
  Object.defineProperty(video, 'currentTime', { value: 0, writable: true, configurable: true });
};

afterEach(() => {
  vi.restoreAllMocks();
});

describe('CustomVideoPlayer', () => {
  it('loads the video with its poster', () => {
    const { video } = setup();

    expect(video).toHaveAttribute('src', 'https://video.test/a.mp4');
    expect(video).toHaveAttribute('poster', 'https://video.test/a.jpg');
  });

  it('starts paused at half volume, showing the big play button', () => {
    const { video, play, bigPlayOverlay } = setup();

    expect(play).not.toHaveBeenCalled();
    expect(video.volume).toBe(0.5);
    expect(bigPlayOverlay).toHaveClass('opacity-100');
  });

  describe('play and pause', () => {
    it('plays, then pauses, when the video is clicked', () => {
      const { player, play, pause, bigPlayOverlay } = setup();

      fireEvent.click(player);
      expect(play).toHaveBeenCalledTimes(1);
      expect(bigPlayOverlay).toHaveClass('opacity-0');

      fireEvent.click(player);
      expect(pause).toHaveBeenCalledTimes(1);
      expect(bigPlayOverlay).toHaveClass('opacity-100');
    });

    it('toggles once when the control button is clicked', () => {
      const { control, play, pause } = setup();

      fireEvent.click(control('play'));
      expect(play).toHaveBeenCalledTimes(1);

      fireEvent.click(control('pause'));
      expect(pause).toHaveBeenCalledTimes(1);
      expect(play).toHaveBeenCalledTimes(1);
    });

    it.each(['Enter', ' '])('responds to the "%s" key', (key) => {
      const { player, play } = setup();

      fireEvent.keyDown(player, { key });

      expect(play).toHaveBeenCalledTimes(1);
    });

    it('ignores other keys', () => {
      const { player, play } = setup();

      fireEvent.keyDown(player, { key: 'a' });

      expect(play).not.toHaveBeenCalled();
    });
  });

  describe('sound', () => {
    it('mutes and unmutes without pausing', () => {
      const { video, control, play, pause } = setup();

      fireEvent.click(control('volume-2'));
      expect(video.muted).toBe(true);

      fireEvent.click(control('volume-x'));
      expect(video.muted).toBe(false);
      expect(play).not.toHaveBeenCalled();
      expect(pause).not.toHaveBeenCalled();
    });

    it('sets the volume from the slider', () => {
      const { video, volume } = setup();

      fireEvent.change(volume, { target: { value: '0.8' } });

      expect(video.volume).toBe(0.8);
    });

    it('mutes when the slider reaches zero', () => {
      const { video, volume, container } = setup();

      fireEvent.change(volume, { target: { value: '0' } });

      expect(video.muted).toBe(true);
      expect(container.querySelector('button .lucide-volume-x')).toBeInTheDocument();
    });

    it('unmutes when the slider is raised', () => {
      const { video, volume, control } = setup();
      fireEvent.click(control('volume-2'));

      fireEvent.change(volume, { target: { value: '0.3' } });

      expect(video.muted).toBe(false);
    });

    it('restores half volume when unmuting from zero', () => {
      const { video, volume, control } = setup();
      fireEvent.change(volume, { target: { value: '0' } });

      fireEvent.click(control('volume-x'));

      expect(video.volume).toBe(0.5);
      expect(video.muted).toBe(false);
    });
  });

  describe('progress', () => {
    it('follows playback', () => {
      const { video, progress } = setup();
      withTimeline(video, 100);
      video.currentTime = 30;

      fireEvent.timeUpdate(video);

      expect(progress).toHaveAttribute('aria-valuenow', '30');
    });

    it('stays at zero until the length is known', () => {
      const { video, progress } = setup();

      fireEvent.timeUpdate(video);

      expect(progress).toHaveAttribute('aria-valuenow', '0');
    });

    it('resets when the video ends', () => {
      const { video, player, progress, bigPlayOverlay } = setup();
      withTimeline(video, 100);
      fireEvent.click(player);
      video.currentTime = 100;
      fireEvent.timeUpdate(video);

      fireEvent.ended(video);

      expect(progress).toHaveAttribute('aria-valuenow', '0');
      expect(bigPlayOverlay).toHaveClass('opacity-100');
    });

    it('jumps to the clicked point without toggling play', () => {
      const { video, progress, play } = setup();
      withTimeline(video, 100);
      vi.spyOn(progress, 'getBoundingClientRect').mockReturnValue({ left: 100, width: 200 } as DOMRect);

      fireEvent.click(progress, { clientX: 200 });

      expect(video.currentTime).toBe(50);
      expect(play).not.toHaveBeenCalled();
    });

    it.fails('BUG-17: pressing Enter on the progress bar leaves the time valid', () => {
      const { video, progress } = setup();
      withTimeline(video, 100);
      vi.spyOn(progress, 'getBoundingClientRect').mockReturnValue({ left: 100, width: 200 } as DOMRect);

      fireEvent.keyDown(progress, { key: 'Enter' });

      expect(Number.isFinite(video.currentTime)).toBe(true);
    });

    it('stops listening when removed', () => {
      const { video, unmount } = setup();
      const removeListener = vi.spyOn(video, 'removeEventListener');

      unmount();

      expect(removeListener.mock.calls.map(([event]) => event)).toEqual(['timeupdate', 'ended']);
    });
  });

  describe('fullscreen', () => {
    afterEach(() => {
      Reflect.deleteProperty(document, 'fullscreenElement');
    });

    it('enters fullscreen on the player, without toggling play', () => {
      const requestFullscreen = vi.spyOn(Element.prototype, 'requestFullscreen');
      const { control, player, play } = setup();

      fireEvent.click(control('maximize'));

      expect(requestFullscreen.mock.contexts[0]).toBe(player);
      expect(play).not.toHaveBeenCalled();
    });

    it('leaves fullscreen when already in it', () => {
      const exitFullscreen = vi.spyOn(document, 'exitFullscreen');
      const { control } = setup();
      Object.defineProperty(document, 'fullscreenElement', { value: document.body, configurable: true });

      fireEvent.click(control('maximize'));

      expect(exitFullscreen).toHaveBeenCalledTimes(1);
    });
  });

  it.fails('BUG-16: names its controls for screen readers', () => {
    setup();

    expect(screen.getByRole('button', { name: /mute/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /fullscreen/i })).toBeInTheDocument();
  });
});
