import { fireEvent, render, screen } from '@testing-library/react';
import Lightbox from '../../../src/components/shared/Lightbox';

const setup = () => {
  const onClose = vi.fn();
  const behind = vi.fn();
  window.addEventListener('keydown', behind);
  const view = render(
    <div>
      <button>Opener</button>
      <Lightbox label="Launch Trailer" onClose={onClose}><p>Content</p></Lightbox>
    </div>,
  );
  return { onClose, behind, ...view, cleanup: () => window.removeEventListener('keydown', behind) };
};

describe('Lightbox', () => {
  it('shows its content in a named dialog on the page body, outside any clipping parent', () => {
    const { container, cleanup } = setup();

    const dialog = screen.getByRole('dialog', { name: 'Launch Trailer' });
    expect(dialog).toHaveAttribute('aria-modal', 'true');
    expect(dialog).toHaveTextContent('Content');
    expect(container).not.toContainElement(dialog);
    cleanup();
  });

  it('puts focus on its close button, and gives it back when closed', () => {
    const opener = document.createElement('button');
    document.body.appendChild(opener);
    opener.focus();
    const { unmount } = render(<Lightbox label="Shot" onClose={vi.fn()}>x</Lightbox>);

    expect(screen.getByRole('button', { name: 'Close viewer' })).toHaveFocus();

    unmount();
    expect(opener).toHaveFocus();
    opener.remove();
  });

  it('closes from its button and from the dark area around the content, not from the content', () => {
    const { onClose, cleanup } = setup();

    fireEvent.click(screen.getByText('Content'));
    expect(onClose).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole('dialog'));
    fireEvent.click(screen.getByRole('button', { name: 'Close viewer' }));
    expect(onClose).toHaveBeenCalledTimes(2);
    cleanup();
  });

  it('closes with Escape without letting it reach the game modal behind', () => {
    const { onClose, behind, cleanup } = setup();

    fireEvent.keyDown(document.body, { key: 'Escape' });

    expect(onClose).toHaveBeenCalledTimes(1);
    expect(behind).not.toHaveBeenCalled();
    cleanup();
  });

  it('lets other keys through', () => {
    const { onClose, behind, cleanup } = setup();

    fireEvent.keyDown(document.body, { key: 'ArrowRight' });

    expect(onClose).not.toHaveBeenCalled();
    expect(behind).toHaveBeenCalledTimes(1);
    cleanup();
  });
});
