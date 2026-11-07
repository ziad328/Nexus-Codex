import { fireEvent, render, screen } from '@testing-library/react';
import PWAReloadPrompt from '../../../src/components/shared/PWAReloadPrompt';
import { pwaFake } from '../../fakes/pwa-register';

describe('PWAReloadPrompt', () => {
  afterEach(() => {
    pwaFake.needRefresh = false;
    pwaFake.setNeedRefresh.mockClear();
    pwaFake.updateServiceWorker.mockClear();
  });

  it('stays hidden when there is no update', () => {
    render(<PWAReloadPrompt />);

    expect(screen.queryByText('Update available!')).not.toBeInTheDocument();
  });

  it('tells the user when an update is ready', () => {
    pwaFake.needRefresh = true;

    render(<PWAReloadPrompt />);

    expect(screen.getByText('Update available!')).toBeInTheDocument();
  });

  it('applies the update and reloads when asked', () => {
    pwaFake.needRefresh = true;
    render(<PWAReloadPrompt />);

    fireEvent.click(screen.getByRole('button', { name: /reload & update/i }));

    expect(pwaFake.updateServiceWorker).toHaveBeenCalledWith(true);
  });

  it('can be dismissed without updating', () => {
    pwaFake.needRefresh = true;
    render(<PWAReloadPrompt />);

    fireEvent.click(screen.getAllByRole('button')[0]);

    expect(pwaFake.setNeedRefresh).toHaveBeenCalledWith(false);
    expect(pwaFake.updateServiceWorker).not.toHaveBeenCalled();
  });
});
