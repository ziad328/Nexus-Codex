import { fireEvent, screen, waitFor, within } from '@testing-library/react';
import { Link, Route, Routes } from 'react-router-dom';
import Layout from '../../../src/components/layout/Layout';
import { apiRequests, mockApi } from '../../fakes/network';
import { renderWithProviders } from '../../render';

const setup = () =>
  renderWithProviders(
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Link to="/other">Home page</Link>} />
        <Route path="/other" element={<p>Other page</p>} />
      </Route>
    </Routes>,
  );

const overlay = () => screen.queryByRole('button', { name: 'Close mobile menu' });
const openMenu = () => fireEvent.click(screen.getByRole('button', { name: 'Toggle Menu' }));

/** The sliding panel that holds the mobile sidebar. */
const drawer = (container: HTMLElement) => container.querySelector('.fixed.inset-y-0')!;

describe('Layout', () => {
  beforeEach(() => {
    mockApi('/genres', { results: [] });
  });

  it('shows the navbar, sidebar and current page', async () => {
    setup();

    expect(screen.getByPlaceholderText('Search games...')).toBeInTheDocument();
    expect(screen.getAllByRole('link', { name: /my collection/i }).length).toBeGreaterThan(0);
    expect(screen.getByRole('link', { name: 'Home page' })).toBeInTheDocument();
    await waitFor(() => expect(apiRequests.length).toBeGreaterThan(0));
  });

  describe('mobile menu', () => {
    it('starts closed', () => {
      const { container } = setup();

      expect(overlay()).not.toBeInTheDocument();
      expect(drawer(container)).toHaveClass('-translate-x-full');
    });

    it('opens from the menu button, and closes when pressed again', () => {
      const { container } = setup();

      openMenu();
      expect(overlay()).toBeInTheDocument();
      expect(drawer(container)).toHaveClass('translate-x-0');

      openMenu();
      expect(overlay()).not.toBeInTheDocument();
      expect(drawer(container)).toHaveClass('-translate-x-full');
    });

    it('closes when the overlay is clicked', () => {
      setup();
      openMenu();

      fireEvent.click(overlay()!);

      expect(overlay()).not.toBeInTheDocument();
    });

    it.each(['Enter', ' '])('closes with the "%s" key on the overlay', (key) => {
      setup();
      openMenu();

      fireEvent.keyDown(overlay()!, { key });

      expect(overlay()).not.toBeInTheDocument();
    });

    it('stays open for other keys', () => {
      setup();
      openMenu();

      fireEvent.keyDown(overlay()!, { key: 'a' });

      expect(overlay()).toBeInTheDocument();
    });

    it('holds the account, and closes when Sign In is chosen', () => {
      const { store, container } = setup();
      openMenu();

      fireEvent.click(within(drawer(container) as HTMLElement).getByRole('button', { name: 'Sign In' }));

      expect(store.getState().ui.isAuthModalOpen).toBe(true);
      expect(overlay()).not.toBeInTheDocument();
    });

    it('closes when moving to another page', async () => {
      setup();
      openMenu();

      fireEvent.click(screen.getByRole('link', { name: 'Home page' }));

      expect(await screen.findByText('Other page')).toBeInTheDocument();
      expect(overlay()).not.toBeInTheDocument();
    });
  });

  it.fails('BUG-26: asks for genres once, not once per sidebar', async () => {
    localStorage.setItem('nexus-genres-v2', JSON.stringify([{ id: 1, name: 'Action', slug: 'action', image_background: 'a.jpg' }]));
    mockApi('/genres', { results: [{ id: 1, name: 'Action', slug: 'action', image_background: 'a.jpg' }] });

    setup();
    await waitFor(() => expect(apiRequests.length).toBeGreaterThan(0));
    await new Promise((resolve) => setTimeout(resolve));

    expect(apiRequests.filter((request) => request.url === '/genres')).toHaveLength(1);
  });
});
