import { apiRequests, mockApi } from '../fakes/network';
import { makeGame } from '../fixtures';

export const portal = makeGame(1, { name: 'Portal' });
export const doom = makeGame(2, { name: 'Doom' });

/** Answers everything a page asks for on load: the genres and the grid. The filter menus are fixed lists. */
export const mockCatalog = (games = [portal, doom]) => {
  mockApi('/genres', { results: [{ id: -1, name: 'Action', slug: 'action', image_background: null }, { id: 9, name: 'Puzzle', slug: 'puzzle', image_background: null }] });
  mockApi('/games', { results: games, next: null });
};

/** Answers the details request, which carries everything the modal shows. */
export const mockGameDetails = (id: number, name: string, similar: object[] = []) => {
  mockApi(`/games/${id}`, {
    id,
    name,
    slug: name.toLowerCase(),
    background_image: `https://images.igdb.com/igdb/image/upload/t_cover_big/co${id}.jpg`,
    parent_platforms: [],
    metacritic: 90,
    description_raw: 'About this game',
    released: '2007-10-10',
    developers: [{ id: 1, name: 'Valve', slug: 'valve' }],
    publishers: [{ id: 3, name: 'EA', slug: 'ea' }],
    stores: [],
    store_links: [],
    website: null,
    reddit_url: null,
    screenshots: [],
    trailers: [],
    similar,
  });
};

/** The params of the latest request for the grid. */
export const lastGamesParams = () => apiRequests.filter((request) => request.url === '/games').at(-1)?.params ?? {};
