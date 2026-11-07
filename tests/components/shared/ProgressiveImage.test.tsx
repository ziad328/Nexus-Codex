import { fireEvent, render, screen } from '@testing-library/react';
import ProgressiveImage from '../../../src/components/shared/ProgressiveImage';

const stubImageComplete = (complete: boolean) =>
  vi.spyOn(HTMLImageElement.prototype, 'complete', 'get').mockReturnValue(complete);

const placeholder = (container: HTMLElement) => container.querySelector('.animate-pulse')!;

afterEach(() => {
  vi.restoreAllMocks();
});

describe('ProgressiveImage', () => {
  it('lazy-loads the image with its description', () => {
    render(<ProgressiveImage src="https://img.test/a.jpg" alt="Portal" />);

    const image = screen.getByAltText('Portal');
    expect(image).toHaveAttribute('src', 'https://img.test/a.jpg');
    expect(image).toHaveAttribute('loading', 'lazy');
  });

  it('adds the given class to the frame', () => {
    const { container } = render(<ProgressiveImage src="a.jpg" alt="Portal" className="w-full" />);

    expect(container.firstChild).toHaveClass('w-full');
  });

  it('shows the placeholder until the image loads', () => {
    stubImageComplete(false);
    const { container } = render(<ProgressiveImage src="a.jpg" alt="Portal" />);

    expect(placeholder(container)).toHaveClass('opacity-100');
    expect(screen.getByAltText('Portal')).toHaveClass('opacity-0');

    fireEvent.load(screen.getByAltText('Portal'));

    expect(placeholder(container)).toHaveClass('opacity-0');
    expect(screen.getByAltText('Portal')).toHaveClass('opacity-100');
  });

  it('shows an already cached image straight away', () => {
    stubImageComplete(true);
    render(<ProgressiveImage src="a.jpg" alt="Portal" />);

    expect(screen.getByAltText('Portal')).toHaveClass('opacity-100');
  });

  it('goes back to the placeholder when the image changes', () => {
    stubImageComplete(false);
    const { container, rerender } = render(<ProgressiveImage src="a.jpg" alt="Portal" />);
    fireEvent.load(screen.getByAltText('Portal'));

    rerender(<ProgressiveImage src="b.jpg" alt="Portal" />);

    expect(placeholder(container)).toHaveClass('opacity-100');
  });

  it.fails('BUG-18: stops the loading placeholder when the image fails', () => {
    stubImageComplete(false);
    const { container } = render(<ProgressiveImage src="missing.jpg" alt="Portal" />);

    fireEvent.error(screen.getByAltText('Portal'));

    expect(placeholder(container)).toHaveClass('opacity-0');
  });
});
