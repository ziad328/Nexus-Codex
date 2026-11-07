import { fireEvent, screen, waitFor } from '@testing-library/react';
import CollectionButton from '../../../src/components/shared/CollectionButton';
import type { CollectionName } from '../../../src/types';
import { supabaseFake } from '../../fakes/supabase';
import { makeGame, makeRow, signedIn } from '../../fixtures';
import { renderWithProviders } from '../../render';

const game = makeGame(1);

const listsWith = (...names: CollectionName[]) => ({
  lists: (['playing', 'beaten', 'backlog', 'wishlist'] as const).map((name) => ({
    name,
    games: names.includes(name) ? [game] : [],
  })),
});

const openMenu = () => fireEvent.click(screen.getByRole('button', { name: 'Add to collection' }));
const menuItem = (name: string) => screen.getByRole('button', { name });
const isChecked = (name: string) => menuItem(name).querySelector('.lucide-check') !== null;

describe('CollectionButton', () => {
  it('keeps the menu closed until clicked', () => {
    renderWithProviders(<CollectionButton game={game} />);

    expect(screen.queryByText('Add to list')).not.toBeInTheDocument();
  });

  it('opens with all four lists', () => {
    renderWithProviders(<CollectionButton game={game} />);

    openMenu();

    ['Playing Now', 'Backlog', 'Beaten', 'Wishlist'].forEach((name) => {
      expect(menuItem(name)).toBeInTheDocument();
    });
  });

  it('closes when clicked again', () => {
    renderWithProviders(<CollectionButton game={game} />);

    openMenu();
    openMenu();

    expect(screen.queryByText('Add to list')).not.toBeInTheDocument();
  });

  it('closes when clicking elsewhere, but not inside the menu', () => {
    renderWithProviders(<CollectionButton game={game} />);
    openMenu();

    fireEvent.mouseDown(screen.getByText('Add to list'));
    expect(screen.getByText('Add to list')).toBeInTheDocument();

    fireEvent.mouseDown(document.body);
    expect(screen.queryByText('Add to list')).not.toBeInTheDocument();
  });

  it('marks only the lists holding the game', () => {
    renderWithProviders(<CollectionButton game={game} />, { preloadedState: { collections: listsWith('beaten', 'wishlist') } });

    openMenu();

    expect(isChecked('Beaten')).toBe(true);
    expect(isChecked('Wishlist')).toBe(true);
    expect(isChecked('Playing Now')).toBe(false);
    expect(isChecked('Backlog')).toBe(false);
  });

  it('adds the game and stays open, so several lists can be chosen', async () => {
    const { store } = renderWithProviders(<CollectionButton game={game} />);
    openMenu();

    fireEvent.click(menuItem('Backlog'));

    await waitFor(() => expect(isChecked('Backlog')).toBe(true));
    expect(store.getState().collections.lists.find((list) => list.name === 'backlog')?.games).toEqual([game]);
    expect(screen.getByText('Add to list')).toBeInTheDocument();
  });

  it('removes the game from a list it is in', async () => {
    const { store } = renderWithProviders(<CollectionButton game={game} />, {
      preloadedState: { collections: listsWith('playing', 'beaten') },
    });
    openMenu();

    fireEvent.click(menuItem('Playing Now'));

    await waitFor(() => expect(isChecked('Playing Now')).toBe(false));
    expect(store.getState().collections.lists.find((list) => list.name === 'beaten')?.games).toEqual([game]);
  });

  it('saves to the cloud when signed in', async () => {
    renderWithProviders(<CollectionButton game={game} />, { preloadedState: { auth: signedIn } });
    openMenu();

    fireEvent.click(menuItem('Wishlist'));

    await waitFor(() => {
      expect(supabaseFake.rows('collections')).toEqual([makeRow(game, { collection_name: 'wishlist' })]);
    });
  });

  it('does not open the card it sits on', () => {
    const onCardClick = vi.fn();
    renderWithProviders(<div onClick={onCardClick}><CollectionButton game={game} /></div>);

    openMenu();
    fireEvent.click(menuItem('Backlog'));

    expect(onCardClick).not.toHaveBeenCalled();
  });

  it.each([
    ['down', 'top-full'],
    ['up', 'bottom-full'],
  ] as const)('opens %s', (dropDirection, className) => {
    renderWithProviders(<CollectionButton game={game} dropDirection={dropDirection} />);

    openMenu();

    expect(screen.getByText('Add to list').parentElement?.parentElement).toHaveClass(className);
  });

  it('tells the user when saving fails (BUG-8, fixed)', async () => {
    supabaseFake.failNext('collections', 'insert');
    renderWithProviders(<CollectionButton game={game} />, { preloadedState: { auth: signedIn } });
    openMenu();

    fireEvent.click(menuItem('Backlog'));

    expect(await screen.findByRole('alert')).toHaveTextContent("Couldn't save");
  });
});
