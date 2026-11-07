import { fireEvent, screen } from '@testing-library/react';
import type { User } from '@supabase/supabase-js';
import MobileAccount from '../../../src/components/layout/MobileAccount';
import { supabase } from '../../fakes/supabase';
import { renderWithProviders } from '../../render';

const signedIn = {
  auth: { user: { id: 'user-1', email: 'player@example.com' } as User, session: null, isLoading: false },
};

const setup = (preloadedState?: typeof signedIn) => {
  const onAction = vi.fn();
  const view = renderWithProviders(<MobileAccount onAction={onAction} />, { preloadedState });
  return { onAction, ...view };
};

describe('MobileAccount (BUG-25, fixed)', () => {
  it('shows only below the size where the navbar takes over', () => {
    const { container } = setup();

    expect(container.firstElementChild).toHaveClass('md:hidden');
  });

  describe('as a guest', () => {
    it('explains and offers sign-in', () => {
      setup();

      expect(screen.getByText('Sync your library')).toBeInTheDocument();
      expect(screen.queryByRole('button', { name: 'Sign Out' })).not.toBeInTheDocument();
    });

    it('opens the sign-in modal and closes the menu', () => {
      const { store, onAction } = setup();

      fireEvent.click(screen.getByRole('button', { name: 'Sign In' }));

      expect(store.getState().ui.isAuthModalOpen).toBe(true);
      expect(onAction).toHaveBeenCalledOnce();
    });
  });

  describe('when signed in', () => {
    it('shows the email instead of Sign In', () => {
      setup(signedIn);

      expect(screen.getByText('player@example.com')).toHaveAttribute('title', 'player@example.com');
      expect(screen.queryByRole('button', { name: 'Sign In' })).not.toBeInTheDocument();
    });

    it('signs out and closes the menu', () => {
      const { onAction } = setup(signedIn);

      fireEvent.click(screen.getByRole('button', { name: 'Sign Out' }));

      expect(supabase.auth.signOut).toHaveBeenCalledOnce();
      expect(onAction).toHaveBeenCalledOnce();
    });
  });
});
