import { act, render, screen } from '@testing-library/react';
import SaveFailedNotice from '../../../src/components/shared/SaveFailedNotice';

describe('SaveFailedNotice', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('says the save failed, on the page body so cards cannot clip it', () => {
    const { container } = render(<div><SaveFailedNotice /></div>);

    expect(screen.getByRole('alert')).toHaveTextContent("Couldn't save. Check your connection and try again.");
    expect(container).not.toContainElement(screen.getByRole('alert'));
  });

  it('goes away after four seconds', () => {
    vi.useFakeTimers();
    render(<SaveFailedNotice />);

    act(() => { vi.advanceTimersByTime(3999); });
    expect(screen.getByRole('alert')).toBeInTheDocument();

    act(() => { vi.advanceTimersByTime(1); });
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('leaves no timer behind when removed early', () => {
    vi.useFakeTimers();
    const { unmount } = render(<SaveFailedNotice />);

    unmount();

    expect(vi.getTimerCount()).toBe(0);
  });
});
