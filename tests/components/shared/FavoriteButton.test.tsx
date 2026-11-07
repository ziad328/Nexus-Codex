import { fireEvent, screen, waitFor } from '@testing-library/react';
import FavoriteButton from '../../../src/components/shared/FavoriteButton';
import { supabaseFake } from '../../fakes/supabase';
import { makeGame, makeRow, signedIn } from '../../fixtures';
import { renderWithProviders } from '../../render';

const game = makeGame(1);

describe('FavoriteButton', () => {
  it('offers to add a game that is not a favorite', () => {
    renderWithProviders(<FavoriteButton game={game} />);

    expect(screen.getByRole('button', { name: 'Add to favorites' })).toBeInTheDocument();
  });

  it('offers to remove a game that is a favorite', () => {
    renderWithProviders(<FavoriteButton game={game} />, { preloadedState: { favorites: { items: [game] } } });

    expect(screen.getByRole('button', { name: 'Remove from favorites' })).toBeInTheDocument();
  });

  it('adds and removes the game as a guest', async () => {
    const { store } = renderWithProviders(<FavoriteButton game={game} />);

    fireEvent.click(screen.getByRole('button', { name: 'Add to favorites' }));
    await screen.findByRole('button', { name: 'Remove from favorites' });
    expect(store.getState().favorites.items).toEqual([game]);

    fireEvent.click(screen.getByRole('button', { name: 'Remove from favorites' }));
    await screen.findByRole('button', { name: 'Add to favorites' });
    expect(store.getState().favorites.items).toEqual([]);
  });

  it('saves to the cloud when signed in', async () => {
    renderWithProviders(<FavoriteButton game={game} />, { preloadedState: { auth: signedIn } });

    fireEvent.click(screen.getByRole('button', { name: 'Add to favorites' }));

    await waitFor(() => expect(supabaseFake.rows('favorites')).toEqual([makeRow(game)]));
  });

  it('does not open the card it sits on', () => {
    const onCardClick = vi.fn();
    renderWithProviders(<div onClick={onCardClick}><FavoriteButton game={game} /></div>);

    fireEvent.click(screen.getByRole('button'));

    expect(onCardClick).not.toHaveBeenCalled();
  });

  it('keeps showing the old state when saving fails', async () => {
    supabaseFake.failNext('favorites', 'insert');
    renderWithProviders(<FavoriteButton game={game} />, { preloadedState: { auth: signedIn } });

    fireEvent.click(screen.getByRole('button', { name: 'Add to favorites' }));
    await waitFor(() => expect(supabaseFake.queries()).toHaveLength(1));
    await new Promise((resolve) => setTimeout(resolve));

    expect(screen.getByRole('button', { name: 'Add to favorites' })).toBeInTheDocument();
  });

  it('tells the user when saving fails (BUG-8, fixed)', async () => {
    supabaseFake.failNext('favorites', 'insert');
    renderWithProviders(<FavoriteButton game={game} />, { preloadedState: { auth: signedIn } });

    fireEvent.click(screen.getByRole('button', { name: 'Add to favorites' }));

    expect(await screen.findByRole('alert')).toHaveTextContent("Couldn't save");
  });
});
