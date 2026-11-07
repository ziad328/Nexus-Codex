// One entry point for every /api route, used by the Vercel functions and by the Vite dev server alike.
import { BadRequest, getGame, listGames, listGenres } from './games.js';
import { realDeps, UpstreamError } from './igdb.js';
import type { Deps } from './igdb.js';

const HOUR = 3600;
const DAY = 24 * HOUR;

// The CDN keeps answers, serves a stale copy while refreshing, and keeps serving it if IGDB fails.
const cacheFor = (seconds: number) =>
  `public, max-age=60, s-maxage=${seconds}, stale-while-revalidate=${seconds}, stale-if-error=${7 * DAY}`;

const json = (status: number, body: unknown, headers: Record<string, string> = {}) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8', ...headers },
  });

const noStore = { 'Cache-Control': 'no-store' };

export const handleApi = async (request: Request, deps: Deps = realDeps()): Promise<Response> => {
  if (request.method !== 'GET' && request.method !== 'HEAD') {
    return json(405, { error: 'Only GET is allowed' }, { ...noStore, Allow: 'GET, HEAD' });
  }
  const url = new URL(request.url);
  const path = url.pathname.replace(/\/+$/, '');

  try {
    if (path === '/api/games') {
      return json(200, await listGames(deps, url.searchParams), { 'Cache-Control': cacheFor(HOUR) });
    }
    const gameMatch = path.match(/^\/api\/games\/([^/]+)$/);
    if (gameMatch) {
      const game = await getGame(deps, gameMatch[1]);
      return game
        ? json(200, game, { 'Cache-Control': cacheFor(DAY) })
        : json(404, { error: 'Game not found' }, { 'Cache-Control': cacheFor(HOUR) });
    }
    if (path === '/api/genres') {
      return json(200, await listGenres(deps), { 'Cache-Control': cacheFor(7 * DAY) });
    }
    return json(404, { error: 'No such API route' }, noStore);
  } catch (error) {
    if (error instanceof BadRequest) return json(400, { error: error.message }, noStore);
    if (error instanceof UpstreamError) {
      return json(error.status, { error: error.message }, error.status === 503 ? { ...noStore, 'Retry-After': '5' } : noStore);
    }
    console.error('Unexpected API error', error);
    return json(500, { error: 'Something went wrong' }, noStore);
  }
};
