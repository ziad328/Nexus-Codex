import { test as base } from '@playwright/test';
import type { BrowserContext, Page, Route } from '@playwright/test';

const IMAGE_HOST = 'images.igdb.com';
const SUPABASE_HOST = 'supabase.test.invalid';
const AUTH_KEY = 'sb-supabase-auth-token';

const cors = {
  'access-control-allow-origin': '*',
  'access-control-allow-headers': '*',
  'access-control-allow-methods': '*',
};

// A 1x1 transparent PNG, for every cover image.
const PIXEL = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==', 'base64');

export const USER_ID = '00000000-0000-4000-8000-000000000001';

const makeGame = (id: number, name: string) => ({
  id,
  name,
  slug: name.toLowerCase(),
  background_image: `https://${IMAGE_HOST}/igdb/image/upload/t_cover_big/co${id}.jpg`,
  metacritic: 90,
  parent_platforms: [{ platform: { id: 1, name: 'PC', slug: 'pc' } }],
});

export const portal = makeGame(1, 'Portal');
export const doom = makeGame(2, 'Doom');
export const halo = makeGame(3, 'Halo');

export const genres = [
  { id: -1, name: 'Action', slug: 'action', image_background: null },
  { id: 9, name: 'Puzzle', slug: 'puzzle', image_background: null },
];

// What our own /api answers. The filter menus are fixed lists in the app, so only genres and games are asked for.
const lists: Record<string, unknown[]> = {
  '/genres': genres,
  '/games': [portal, doom],
};

const answerApi = (path: string) => {
  if (lists[path]) return { count: lists[path].length, next: null, results: lists[path] };
  const [, id] = path.match(/^\/games\/(\d+)$/) ?? [];
  if (id) {
    const game = [portal, doom, halo].find((candidate) => candidate.id === Number(id)) ?? portal;
    return {
      ...game,
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
      similar: [],
    };
  }
  return null;
};

/** Controls the stubbed outside world from a test, and records what the app asked it. */
export class Outside {
  apiDown = false;
  offline = false;
  gameRequests: URLSearchParams[] = [];
  cloudRows: Record<string, unknown[]> = { favorites: [], collections: [] };
  inserts: { table: string; rows: unknown }[] = [];
  magicLinks: unknown[] = [];
  signOuts = 0;

  private async api(route: Route, url: URL) {
    // Routes run even with the network off, so going offline has to be mirrored here.
    if (this.offline) return route.abort('internetdisconnected');
    const path = url.pathname.replace(/^\/api/, '');
    if (path === '/games') this.gameRequests.push(url.searchParams);
    const body = this.apiDown ? null : answerApi(path);
    if (!body) return route.fulfill({ status: this.apiDown ? 503 : 404, json: { error: 'stubbed failure' } });
    return route.fulfill({ json: body });
  }

  private async supabase(route: Route, url: URL) {
    const request = route.request();
    if (url.pathname === '/auth/v1/otp') {
      this.magicLinks.push(request.postDataJSON());
      return route.fulfill({ headers: cors, json: {} });
    }
    if (url.pathname === '/auth/v1/logout') {
      this.signOuts++;
      return route.fulfill({ status: 204, headers: cors });
    }
    const table = url.pathname.replace('/rest/v1/', '');
    if (request.method() === 'POST') {
      this.inserts.push({ table, rows: request.postDataJSON() });
      return route.fulfill({ status: 201, headers: cors });
    }
    if (request.method() === 'GET') return route.fulfill({ headers: cors, json: this.cloudRows[table] ?? [] });
    return route.fulfill({ status: 204, headers: cors });
  }

  async install(context: BrowserContext) {
    await context.route('**/*', async (route) => {
      const url = new URL(route.request().url());
      // Our own /api is answered here; the preview server refuses to call IGDB during tests anyway.
      if (url.hostname === 'localhost') return url.pathname.startsWith('/api/') ? this.api(route, url) : route.continue();
      if (route.request().method() === 'OPTIONS') return route.fulfill({ status: 204, headers: cors });
      if (url.hostname === IMAGE_HOST) return route.fulfill({ contentType: 'image/png', body: PIXEL });
      if (url.hostname === SUPABASE_HOST) return this.supabase(route, url);
      return route.abort('blockedbyclient');
    });
  }
}

/** Makes the browser look as if it has signed in before. The token is fake and nothing checks it. */
export const signIn = async (context: BrowserContext) => {
  const part = (value: object) => Buffer.from(JSON.stringify(value)).toString('base64url');
  const expiresAt = Math.floor(Date.now() / 1000) + 3600;
  const user = { id: USER_ID, email: 'player@test.invalid', aud: 'authenticated', role: 'authenticated', app_metadata: {}, user_metadata: {}, created_at: '2026-01-01T00:00:00Z' };
  const session = {
    access_token: `${part({ alg: 'none' })}.${part({ sub: USER_ID, exp: expiresAt, role: 'authenticated' })}.fake`,
    refresh_token: 'fake-refresh-token',
    token_type: 'bearer',
    expires_in: 3600,
    expires_at: expiresAt,
    user,
  };
  await context.addInitScript(([key, value]) => localStorage.setItem(key, value), [AUTH_KEY, JSON.stringify(session)]);
};

/** Saves the genre list as an earlier visit would have, which avoids BUG-33. */
export const rememberGenres = (context: BrowserContext) =>
  context.addInitScript((value) => localStorage.setItem('nexus-genres-v2', value), JSON.stringify(genres));

export const card = (page: Page, name: string) => page.getByRole('button', { name: `View details for ${name}` });

/** Fails if the page, or the app's scroll area, can be scrolled sideways. */
export const sidewaysOverflow = (page: Page) =>
  page.evaluate(() => {
    const areas = [document.documentElement, ...document.querySelectorAll('[data-overlayscrollbars-viewport]')];
    return areas.filter((area) => area.clientWidth > 0 && area.scrollWidth > area.clientWidth + 1).length;
  });

export const test = base.extend<{ outside: Outside; pageErrors: string[] }>({
  outside: [async ({ context }, provide) => {
    const outside = new Outside();
    await outside.install(context);
    await provide(outside);
  }, { auto: true }],

  // Any uncaught error in the browser fails the test that caused it.
  pageErrors: [async ({ page }, provide, testInfo) => {
    const errors: string[] = [];
    page.on('pageerror', (error) => errors.push(error.message));
    await provide(errors);
    if (errors.length > 0 && testInfo.status === testInfo.expectedStatus && testInfo.expectedStatus === 'passed') {
      throw new Error(`Uncaught errors in the page:\n${errors.join('\n')}`);
    }
  }, { auto: true }],
});

export { expect } from '@playwright/test';
