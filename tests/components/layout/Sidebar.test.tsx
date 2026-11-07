import { screen, waitFor } from '@testing-library/react';
import { Route, Routes } from 'react-router-dom';
import Sidebar from '../../../src/components/layout/Sidebar';
import { apiRequests, deferred, mockApi, mockApiError } from '../../fakes/network';
import { makeGame } from '../../fixtures';
import { renderWithProviders } from '../../render';
import type { TestState } from '../../render';

const action = { id: -1, name: 'Action', slug: 'action', image_background: null };
const puzzle = { id: 9, name: 'Puzzle', slug: 'puzzle', image_background: null };

const setup = (route = '/', preloadedState?: Partial<TestState>) =>
  renderWithProviders(
    <Routes>
      <Route path="/" element={<Sidebar />} />
      <Route path="/genre/:genreSlug" element={<Sidebar />} />
      <Route path="/collection" element={<Sidebar />} />
    </Routes>,
    { route, preloadedState },
  );

// A genre's icon is decorative, so its link is named by the genre alone.
const genre = (name: string) => ({ name });
const collectionLink = () => screen.getByRole('link', { name: /my collection/i });

describe('genres', () => {
  it('shows 15 placeholders and hides All Games while loading', () => {
    mockApi('/genres', () => deferred().promise);

    const { container } = setup();

    expect(container.querySelectorAll('.animate-shimmer')).toHaveLength(15);
    expect(screen.queryByRole('link', { name: 'All Games' })).not.toBeInTheDocument();
  });

  it('links each genre to its page, with its own icon', async () => {
    mockApi('/genres', { results: [action, puzzle, { id: 99, name: 'Brand New', slug: 'brand-new', image_background: null }] });

    setup();

    expect(await screen.findByRole('link', genre('Puzzle'))).toHaveAttribute('href', '/genre/puzzle');
    expect(screen.getByRole('link', genre('Action')).querySelector('.lucide-swords')).toBeInTheDocument();
    expect(screen.getByRole('link', genre('Puzzle')).querySelector('.lucide-puzzle')).toBeInTheDocument();
    expect(screen.getByRole('link', genre('Brand New')).querySelector('.lucide-gamepad-2, .lucide-gamepad2')).toBeInTheDocument();
    expect(screen.queryByRole('img')).not.toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'All Games' })).toHaveAttribute('href', '/');
  });

  it('highlights All Games on the home page', async () => {
    mockApi('/genres', { results: [action] });

    setup();

    expect(await screen.findByRole('link', { name: 'All Games' })).toHaveClass('ring-accent');
    expect(screen.getByRole('link', genre('Action'))).not.toHaveClass('ring-accent');
  });

  it('highlights only the current genre on a genre page', async () => {
    mockApi('/genres', { results: [action, puzzle] });

    setup('/genre/puzzle');

    expect(await screen.findByRole('link', genre('Puzzle'))).toHaveClass('ring-accent');
    expect(screen.getByRole('link', genre('Action'))).not.toHaveClass('ring-accent');
    expect(screen.getByRole('link', { name: 'All Games' })).not.toHaveClass('ring-accent');
  });

  it('shows cached genres at once', () => {
    localStorage.setItem('nexus-genres-v2', JSON.stringify([action]));
    mockApi('/genres', () => deferred().promise);

    setup();

    expect(screen.getByRole('link', genre('Action'))).toBeInTheDocument();
  });
});

describe('My Collection link', () => {
  beforeEach(() => {
    mockApi('/genres', { results: [] });
  });

  it('is not highlighted elsewhere', () => {
    setup();

    expect(collectionLink()).not.toHaveClass('ring-accent');
  });

  it('goes to the collection page', () => {
    setup();

    expect(collectionLink()).toHaveAttribute('href', '/collection');
  });

  it('is highlighted on the collection page only', async () => {
    setup('/collection');

    expect(collectionLink()).toHaveClass('ring-accent');
    await waitFor(() => expect(screen.getByRole('link', { name: 'All Games' })).not.toHaveClass('ring-accent'));
  });

  it('shows no count when empty', () => {
    setup();

    expect(collectionLink()).toHaveAccessibleName('My Collection');
  });

  it('counts each game once across favorites and lists', () => {
    const lists = (['playing', 'beaten', 'backlog', 'wishlist'] as const).map((name) => ({
      name,
      games: name === 'playing' || name === 'beaten' ? [makeGame(1), makeGame(2)] : [],
    }));

    setup('/', { favorites: { items: [makeGame(2), makeGame(3)] }, collections: { lists } });

    expect(collectionLink()).toHaveTextContent('3');
  });
});

it.fails('BUG-2: keeps the My Collection link when genres fail to load', async () => {
  mockApiError('/genres');

  setup();
  await waitFor(() => expect(apiRequests).toHaveLength(1));
  await new Promise((resolve) => setTimeout(resolve));

  expect(collectionLink()).toBeInTheDocument();
});
