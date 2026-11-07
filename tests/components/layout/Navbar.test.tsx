import { act, fireEvent, screen, waitFor } from '@testing-library/react';
import type { User } from '@supabase/supabase-js';
import Navbar from '../../../src/components/layout/Navbar';
import { supabase } from '../../fakes/supabase';
import { renderWithProviders } from '../../render';

const signedIn = {
  auth: { user: { id: 'user-1', email: 'player@example.com' } as User, session: null, isLoading: false },
};

describe('Navbar', () => {
  it('links both logos to the home page', () => {
    renderWithProviders(<Navbar />);

    const links = screen.getAllByRole('link', { name: /nexus codex/i });
    expect(links).toHaveLength(2);
    links.forEach((link) => expect(link).toHaveAttribute('href', '/'));
  });

  it('includes the search box', () => {
    renderWithProviders(<Navbar />);

    expect(screen.getByPlaceholderText('Search games...')).toBeInTheDocument();
  });

  describe('menu button', () => {
    it('is absent without a handler', () => {
      renderWithProviders(<Navbar />);

      expect(screen.queryByRole('button', { name: 'Toggle Menu' })).not.toBeInTheDocument();
    });

    it('calls the handler, without the click reaching the page', () => {
      const onMenuToggle = vi.fn();
      const onPageClick = vi.fn();
      renderWithProviders(<div onClick={onPageClick}><Navbar onMenuToggle={onMenuToggle} /></div>);

      fireEvent.click(screen.getByRole('button', { name: 'Toggle Menu' }));

      expect(onMenuToggle).toHaveBeenCalledTimes(1);
      expect(onPageClick).not.toHaveBeenCalled();
    });
  });

  describe('mobile search', () => {
    it('opens, and closes again', async () => {
      renderWithProviders(<Navbar />);

      fireEvent.click(screen.getByRole('button', { name: 'Open Search' }));
      await waitFor(() => expect(screen.queryByRole('button', { name: 'Open Search' })).not.toBeInTheDocument());

      fireEvent.click(screen.getByRole('button', { name: 'Close search' }));
      expect(await screen.findByRole('button', { name: 'Open Search' })).toBeInTheDocument();
      expect(screen.queryByRole('button', { name: 'Close search' })).not.toBeInTheDocument();
    });

    it('focuses the box once opened', async () => {
      renderWithProviders(<Navbar />);

      fireEvent.click(screen.getByRole('button', { name: 'Open Search' }));

      await waitFor(() => expect(screen.getByPlaceholderText('Search games...')).toHaveFocus());
    });
  });

  describe('as a guest', () => {
    it('opens the sign-in modal', () => {
      const { store } = renderWithProviders(<Navbar />);

      fireEvent.click(screen.getByRole('button', { name: 'Sign In' }));

      expect(store.getState().ui.isAuthModalOpen).toBe(true);
    });

    it('has no user menu', () => {
      renderWithProviders(<Navbar />);

      expect(screen.queryByRole('button', { name: 'User Menu' })).not.toBeInTheDocument();
    });

  });

  describe('when signed in', () => {
    const openMenu = () => fireEvent.click(screen.getByRole('button', { name: 'User Menu' }));

    it('replaces Sign In with a closed user menu', () => {
      renderWithProviders(<Navbar />, { preloadedState: signedIn });

      expect(screen.queryByRole('button', { name: 'Sign In' })).not.toBeInTheDocument();
      expect(screen.queryByText('player@example.com')).not.toBeInTheDocument();
    });

    it('shows the email when opened', () => {
      renderWithProviders(<Navbar />, { preloadedState: signedIn });

      openMenu();

      expect(screen.getByText('player@example.com')).toBeInTheDocument();
    });

    it('signs out and closes the menu', async () => {
      renderWithProviders(<Navbar />, { preloadedState: signedIn });
      openMenu();

      fireEvent.click(screen.getByRole('button', { name: 'Sign Out' }));

      expect(supabase.auth.signOut).toHaveBeenCalledTimes(1);
      await waitFor(() => expect(screen.queryByText('player@example.com')).not.toBeInTheDocument());
    });

    it('closes when clicked again', async () => {
      renderWithProviders(<Navbar />, { preloadedState: signedIn });

      openMenu();
      openMenu();

      await waitFor(() => expect(screen.queryByText('player@example.com')).not.toBeInTheDocument());
    });

    it('closes when clicking elsewhere, but not inside', async () => {
      renderWithProviders(<Navbar />, { preloadedState: signedIn });
      openMenu();

      fireEvent.mouseDown(screen.getByText('player@example.com'));
      // Wait past the closing animation, which keeps the menu on the page while it plays.
      await act(() => new Promise((resolve) => setTimeout(resolve, 300)));
      expect(screen.getByText('player@example.com')).toBeInTheDocument();

      fireEvent.mouseDown(document.body);
      await waitFor(() => expect(screen.queryByText('player@example.com')).not.toBeInTheDocument());
    });

  });
});
