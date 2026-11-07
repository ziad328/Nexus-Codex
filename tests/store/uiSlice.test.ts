import uiReducer, {
  addRecentlyViewed,
  clearRecentlyViewed,
  setAuthModalOpen,
  setSearchQuery,
  setViewMode,
} from '../../src/store/uiSlice';
import { makeGame } from '../fixtures';

const initial = uiReducer(undefined, { type: 'init' });

const viewAll = (ids: number[]) =>
  ids.reduce((state, id) => uiReducer(state, addRecentlyViewed(makeGame(id))), initial);

const recentIds = (state: typeof initial) => state.recentlyViewed.map((game) => game.id);

describe('uiSlice', () => {
  it('starts in grid view with nothing open or remembered', () => {
    expect(initial).toEqual({ viewMode: 'grid', recentlyViewed: [], searchQueries: {}, isAuthModalOpen: false });
  });

  it('switches the view mode', () => {
    expect(uiReducer(initial, setViewMode('list')).viewMode).toBe('list');
  });

  it('opens and closes the sign-in modal', () => {
    const open = uiReducer(initial, setAuthModalOpen(true));
    expect(open.isAuthModalOpen).toBe(true);
    expect(uiReducer(open, setAuthModalOpen(false)).isAuthModalOpen).toBe(false);
  });

  it('remembers search text separately for each page', () => {
    const home = uiReducer(initial, setSearchQuery({ path: '/', text: 'zelda' }));
    const both = uiReducer(home, setSearchQuery({ path: '/collection', text: 'mario' }));

    expect(both.searchQueries).toEqual({ '/': 'zelda', '/collection': 'mario' });
  });

  it('copes with saved state from before search text existed', () => {
    const older: Partial<typeof initial> = { ...initial };
    delete older.searchQueries;
    const state = uiReducer(older as typeof initial, setSearchQuery({ path: '/', text: 'zelda' }));

    expect(state.searchQueries).toEqual({ '/': 'zelda' });
  });
});

describe('Recently Viewed', () => {
  it('puts the newest game first', () => {
    expect(recentIds(viewAll([1, 2, 3]))).toEqual([3, 2, 1]);
  });

  it('moves a game back to the front instead of listing it twice', () => {
    expect(recentIds(viewAll([1, 2, 3, 1]))).toEqual([1, 3, 2]);
  });

  it('keeps exactly 10 games', () => {
    const ten = viewAll([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
    expect(recentIds(ten)).toEqual([10, 9, 8, 7, 6, 5, 4, 3, 2, 1]);
  });

  it('drops the oldest game when an 11th arrives', () => {
    const state = viewAll([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]);

    expect(state.recentlyViewed).toHaveLength(10);
    expect(recentIds(state)).not.toContain(1);
    expect(recentIds(state)[0]).toBe(11);
  });

  it('drops nothing when a game already in a full list is viewed again', () => {
    const state = uiReducer(viewAll([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]), addRecentlyViewed(makeGame(1)));

    expect(recentIds(state)).toEqual([1, 10, 9, 8, 7, 6, 5, 4, 3, 2]);
  });

  it('clears the list', () => {
    expect(uiReducer(viewAll([1, 2]), clearRecentlyViewed()).recentlyViewed).toEqual([]);
  });
});
