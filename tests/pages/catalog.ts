import { apiRequests, mockApi } from '../fakes/network';
import { makeGame } from '../fixtures';

export const portal = makeGame(1, { name: 'Portal' });
export const doom = makeGame(2, { name: 'Doom' });

/** Answers everything a page asks for on load: the filter menus and the grid. */
export const mockCatalog = (games = [portal, doom]) => {
  mockApi('/genres', { results: [{ id: 4, name: 'Action', slug: 'action', image_background: 'a.jpg' }, { id: 5, name: 'Puzzle', slug: 'puzzle', image_background: 'p.jpg' }] });
  mockApi('/tags', { results: [{ id: 31, name: 'Singleplayer', slug: 'singleplayer' }] });
  mockApi('/stores', { results: [{ id: 11, name: 'Steam', slug: 'steam' }] });
  mockApi('/platforms/lists/parents', { results: [{ id: 3, name: 'Xbox', slug: 'xbox' }] });
  mockApi('/games', { results: games, next: null });
};

/** Answers everything the details modal asks for about one game. */
export const mockGameDetails = (id: number, name: string, similar: object[] = []) => {
  mockApi(`/games/${id}`, {
    id,
    name,
    slug: name.toLowerCase(),
    background_image: `https://media.rawg.io/media/games/${id}.jpg`,
    parent_platforms: [],
    metacritic: 90,
    rating_top: 5,
    description_raw: 'About this game',
    released: '2007-10-10',
    developers: [{ id: 1, name: 'Valve', slug: 'valve' }],
    publishers: [{ id: 3, name: 'EA', slug: 'ea' }],
    stores: [],
  });
  mockApi(`/games/${id}/screenshots`, { results: [] });
  mockApi(`/games/${id}/movies`, { results: [] });
  mockApi(`/games/${id}/stores`, { results: [] });
  mockApi(`/games/${id}/achievements`, { results: [] });
  mockApi(`/games/${id}/game-series`, { results: similar });
};

/** The params of the latest request for the grid, without the API key every request carries. */
export const lastGamesParams = () => {
  const params = apiRequests.filter((request) => request.url === '/games').at(-1)?.params ?? {};
  return Object.fromEntries(Object.entries(params).filter(([name]) => name !== 'key'));
};
