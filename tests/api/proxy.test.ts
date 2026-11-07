import { cleanSearch } from '../../api/_lib/games';
import { resetIgdbState } from '../../api/_lib/igdb';
import type { Deps } from '../../api/_lib/igdb';
import { handleApi } from '../../api/_lib/router';

interface Call { url: string; body: string; token?: string }

/** A fake Twitch and IGDB. `answer` decides each IGDB response; the clock only moves when the code sleeps. */
const fakeUpstream = (answer: (endpoint: string, body: string) => unknown = () => []) => {
  const calls: Call[] = [];
  const tokenRequests: string[] = [];
  let clock = 1_000_000;
  let tokenCount = 0;
  const statuses: number[] = [];
  const deps: Deps = {
    env: { TWITCH_CLIENT_ID: 'client-1', TWITCH_CLIENT_SECRET: 'secret-1' },
    now: () => clock,
    sleep: async (ms) => { clock += ms; },
    fetch: async (input, init) => {
      const url = String(input);
      if (url.startsWith('https://id.twitch.tv/')) {
        tokenRequests.push(url);
        tokenCount++;
        return Response.json({ access_token: `token-${tokenCount}`, expires_in: 60 * 86_400 });
      }
      const body = String(init?.body);
      const token = (init?.headers as Record<string, string>).Authorization;
      calls.push({ url, body, token });
      const status = statuses.shift();
      if (status) return new Response('{}', { status });
      return Response.json(answer(url.replace('https://api.igdb.com/v4/', ''), body));
    },
  };
  return { deps, calls, tokenRequests, failNext: (...codes: number[]) => statuses.push(...codes), tick: (ms: number) => { clock += ms; }, clockAt: () => clock };
};

const get = (path: string, deps: Deps) => handleApi(new Request(`http://localhost${path}`), deps);
const igdbGame = (id: number, extra: object = {}) => ({
  id, name: `Game ${id}`, slug: `game-${id}`, cover: { id: 9, image_id: `co${id}` }, aggregated_rating: 87.6, platforms: [6, 48], ...extra,
});

beforeEach(() => resetIgdbState());

describe('routes', () => {
  it.each(['/api/nope', '/api', '/api/games/1/screenshots'])('answers 404 for %s, without caching it', async (path) => {
    const { deps, calls } = fakeUpstream();

    const res = await get(path, deps);

    expect(res.status).toBe(404);
    expect(res.headers.get('Cache-Control')).toBe('no-store');
    expect(calls).toEqual([]);
  });

  it('allows only reading', async () => {
    const { deps } = fakeUpstream();

    const res = await handleApi(new Request('http://localhost/api/games', { method: 'POST', body: 'fields *;' }), deps);

    expect(res.status).toBe(405);
    expect(res.headers.get('Allow')).toBe('GET, HEAD');
  });

  it.each([
    ['both keys', {}],
    ['the secret', { TWITCH_CLIENT_ID: 'client-1' }],
    ['the client id', { TWITCH_CLIENT_SECRET: 'secret-1' }],
  ])('says the server is not set up when %s is missing, and asks Twitch for nothing', async (_, env) => {
    const { deps, tokenRequests } = fakeUpstream();
    deps.env = env;

    const res = await get('/api/genres', deps);

    expect(res.status).toBe(503);
    expect(await res.json()).toEqual({ error: 'The server is missing its IGDB credentials' });
    expect(tokenRequests).toEqual([]);
  });

  it('answers 502 when Twitch or IGDB can not be reached, and never shows the keys', async () => {
    const { deps } = fakeUpstream();
    deps.fetch = async () => { throw new Error('network down'); };

    const res = await get('/api/genres', deps);
    const text = await res.text();

    expect(res.status).toBe(502);
    expect(text).toContain('Twitch could not be reached');
    expect(text).not.toContain('secret-1');
    expect(text).not.toContain('client-1');
  });

  it('answers 502 when IGDB itself can not be reached', async () => {
    const upstream = fakeUpstream();
    const realFetch = upstream.deps.fetch;
    upstream.deps.fetch = async (input, init) => {
      if (String(input).includes('igdb.com')) throw new Error('network down');
      return realFetch(input, init);
    };

    const res = await get('/api/genres', upstream.deps);

    expect(res.status).toBe(502);
    expect(await res.json()).toEqual({ error: 'IGDB could not be reached' });
  });
});

describe('GET /api/games', () => {
  const list = async (query: string, games: object[] = [igdbGame(1)]) => {
    const upstream = fakeUpstream(() => games);
    const res = await get(`/api/games${query}`, upstream.deps);
    return { res, body: await res.json(), query: upstream.calls.at(-1)?.body ?? '', calls: upstream.calls };
  };

  it('asks for popular, playable, non-adult games with covers', async () => {
    const { res, query } = await list('');

    expect(res.status).toBe(200);
    expect(query).toContain('where game_type = (0,4,8,9,10) & version_parent = null & themes != (42) & cover != null;');
    expect(query).toContain('sort total_rating_count desc;');
    expect(query).toContain('limit 21; offset 0;');
  });

  it("answers in the app's shape", async () => {
    const { body } = await list('');

    expect(body.results).toEqual([{
      id: 1,
      name: 'Game 1',
      slug: 'game-1',
      background_image: 'https://images.igdb.com/igdb/image/upload/t_cover_big/co1.jpg',
      metacritic: 88,
      parent_platforms: [{ platform: { id: 1, name: 'PC', slug: 'pc' } }, { platform: { id: 2, name: 'PlayStation', slug: 'playstation' } }],
    }]);
  });

  it('leaves the image empty and the score null when IGDB has none', async () => {
    const { body } = await list('', [{ id: 2, name: 'Bare', slug: 'bare' }]);

    expect(body.results[0]).toMatchObject({ background_image: '', metacritic: null, parent_platforms: [] });
  });

  it('can be cached by the CDN for an hour', async () => {
    const { res } = await list('');

    expect(res.headers.get('Cache-Control')).toContain('s-maxage=3600');
    expect(res.headers.get('Content-Type')).toContain('application/json');
  });

  describe('pages', () => {
    const many = Array.from({ length: 21 }, (_, i) => igdbGame(i + 1));

    it('shows 20 and links to the next page when there are more', async () => {
      const { body } = await list('?genres=shooter', many);

      expect(body.results).toHaveLength(20);
      expect(body.next).toBe('/api/games?genres=shooter&page=2');
    });

    it('has no next page at the end', async () => {
      const { body } = await list('', many.slice(0, 20));

      expect(body.next).toBeNull();
    });

    it('turns a page number into an offset', async () => {
      const { query } = await list('?page=3');

      expect(query).toContain('limit 21; offset 40;');
    });

    it.each(['0', '-1', 'abc', '1.5', '501'])('refuses page %s', async (page) => {
      const { res, calls } = await list(`?page=${page}`);

      expect(res.status).toBe(400);
      expect(calls).toEqual([]);
    });
  });

  describe('filters', () => {
    it.each([
      ['?genres=shooter', 'genres.slug = "shooter"'],
      ['?genres=action', 'themes = (1)'],
      ['?parent_platforms=1', 'platforms = (6)'],
      ['?parent_platforms=3', 'platforms = (11,12,49,169)'],
      ['?stores=1', 'external_games.external_game_source = 1'],
      ['?stores=11', 'external_games.external_game_source = 26'],
      ['?tags=co-op', 'game_modes = (3)'],
      ['?tags=open-world', 'themes = (38)'],
    ])('%s becomes %s', async (query, clause) => {
      const { res, query: sent } = await list(query);

      expect(res.status).toBe(200);
      expect(sent).toContain(clause);
    });

    it('combines filters', async () => {
      const { query } = await list('?genres=shooter&parent_platforms=1&tags=co-op');

      expect(query).toContain('& genres.slug = "shooter" & platforms = (6) & game_modes = (3);');
    });

    it.each([
      ['an unknown platform', '?parent_platforms=99'],
      ['an unknown store', '?stores=999'],
      ['a store IGDB can not filter', '?stores=6'],
      ['an unknown tag', '?tags=nope'],
      ['a genre with quotes', '?genres=a"b'],
      ['a genre with spaces', '?genres=a%20b'],
      ['a developer that breaks out of the query', '?developers=x";%20fields%20*'],
    ])('refuses %s', async (_, query) => {
      const { res, calls } = await list(query);

      expect(res.status).toBe(400);
      expect(calls).toEqual([]);
    });
  });

  describe('search', () => {
    it('searches, with no sort and covers not required', async () => {
      const { query } = await list('?search=zelda');

      expect(query).toMatch(/^search "zelda";/);
      expect(query).not.toContain('sort');
      expect(query).not.toContain('cover != null');
    });

    it.each([
      ['quotes', 'a"b', 'a b'],
      ['a backslash', 'a\\', 'a'],
      ['a semicolon', 'x; fields *', 'x fields *'],
      ['extra spaces', '  halo   2 ', 'halo 2'],
    ])('drops %s from the search text', (_, input, output) => {
      expect(cleanSearch(input)).toBe(output);
    });

    it('caps search at 100 characters', () => {
      expect(cleanSearch('x'.repeat(300))).toHaveLength(100);
    });

    it('ignores a search that is only punctuation', async () => {
      const { query } = await list('?search=%22%3B');

      expect(query).not.toContain('search');
    });
  });

  describe('developer and publisher pages', () => {
    const company = (role: 'developed' | 'published', ids: number[] | undefined) => {
      const upstream = fakeUpstream((endpoint) => (endpoint === 'companies' ? [{ id: 5, [role]: ids }] : [igdbGame(1)]));
      return upstream;
    };

    it.each([['developers', 'developed'], ['publishers', 'published']] as const)(
      '%s: looks up the company, then lists its own games', async (param, role) => {
        const upstream = company(role, [10, 20]);

        await get(`/api/games?${param}=valve`, upstream.deps);

        expect(upstream.calls[0].body).toBe(`fields ${role}; where slug = "valve"; limit 1;`);
        expect(upstream.calls[1].body).toContain('& id = (10,20)');
      },
    );

    it('answers an empty page for an unknown company, without a second request', async () => {
      const upstream = fakeUpstream(() => []);

      const res = await get('/api/games?developers=nobody', upstream.deps);

      expect(await res.json()).toEqual({ count: 0, next: null, results: [] });
      expect(upstream.calls).toHaveLength(1);
    });
  });
});

describe('GET /api/games/:id', () => {
  const full = igdbGame(7, {
    summary: 'A summary.',
    storyline: 'A story.',
    first_release_date: 1_191_974_400, // 2007-10-10 00:00 UTC
    screenshots: [{ id: 3, image_id: 'sc3', width: 1920, height: 1080 }],
    videos: [{ id: 4, name: 'Launch Trailer', video_id: 'yt123' }, { id: 5, video_id: 'yt456' }],
    involved_companies: [
      { developer: true, publisher: false, company: { id: 1, name: 'Valve', slug: 'valve' } },
      { developer: false, publisher: true, company: { id: 2, name: 'EA', slug: 'electronic-arts' } },
    ],
    websites: [
      { id: 1, type: 1, url: 'https://portal.test' },
      { id: 2, type: 14, url: 'https://reddit.test/r/portal' },
      { id: 3, type: 13, url: 'https://store.steampowered.com/app/400' },
    ],
    external_games: [
      { id: 8, external_game_source: 1, url: 'https://steam.example/other' },
      { id: 9, external_game_source: 5, url: 'https://gog.test/portal' },
      { id: 10, external_game_source: 36 },
    ],
    similar_games: [igdbGame(8), igdbGame(9, { themes: [42] }), igdbGame(10, { themes: [19] })],
  });

  const details = async (id: string, games: object[] = [full]) => {
    const upstream = fakeUpstream(() => games);
    const res = await get(`/api/games/${id}`, upstream.deps);
    return { res, body: await res.json(), calls: upstream.calls };
  };

  it('asks for one non-adult game, in one request', async () => {
    const { calls } = await details('7');

    expect(calls).toHaveLength(1);
    expect(calls[0].body).toContain('where id = 7 & themes != (42); limit 1;');
  });

  it("answers everything the modal needs, in the app's shape", async () => {
    const { res, body } = await details('7');

    expect(res.headers.get('Cache-Control')).toContain('s-maxage=86400');
    expect(body).toMatchObject({
      id: 7,
      name: 'Game 7',
      description_raw: 'A summary.\n\nA story.',
      released: '2007-10-10',
      developers: [{ id: 1, name: 'Valve', slug: 'valve' }],
      publishers: [{ id: 2, name: 'EA', slug: 'electronic-arts' }],
      website: 'https://portal.test',
      reddit_url: 'https://reddit.test/r/portal',
      screenshots: [{ id: 3, image: 'https://images.igdb.com/igdb/image/upload/t_screenshot_big/sc3.jpg', width: 1920, height: 1080 }],
      trailers: [{ id: 4, name: 'Launch Trailer', youtube_id: 'yt123' }, { id: 5, name: 'Trailer', youtube_id: 'yt456' }],
    });
  });

  it('prefers a store link from the websites list, then from the store ids, and skips stores without a link', async () => {
    const { body } = await details('7');

    expect(body.store_links).toEqual([
      { id: 1, store_id: 1, url: 'https://store.steampowered.com/app/400' },
      { id: 5, store_id: 5, url: 'https://gog.test/portal' },
    ]);
    expect(body.stores.map((entry: { store: { name: string } }) => entry.store.name)).toEqual(['Steam', 'GOG']);
  });

  it('never suggests an adult game as similar (BUG-6 for the new API)', async () => {
    const { body } = await details('7');

    expect(body.similar.map((game: { id: number }) => game.id)).toEqual([8, 10]);
  });

  it('copes with a game that has almost nothing', async () => {
    const { body } = await details('2', [{ id: 2, name: 'Bare', slug: 'bare' }]);

    expect(body).toMatchObject({
      description_raw: '', released: null, developers: [], publishers: [], stores: [], store_links: [],
      website: null, reddit_url: null, screenshots: [], trailers: [], similar: [],
    });
  });

  it('answers 404 for a missing or adult game, cached briefly', async () => {
    const { res } = await details('7', []);

    expect(res.status).toBe(404);
    expect(res.headers.get('Cache-Control')).toContain('s-maxage=3600');
  });

  it.each(['abc', '0', '1e3', '-5', '12345678901'])('refuses the id %s', async (id) => {
    const { res, calls } = await details(id);

    expect(res.status).toBe(400);
    expect(calls).toEqual([]);
  });
});

describe('GET /api/genres', () => {
  it("lists Action first, then IGDB's genres, cached for a week", async () => {
    const upstream = fakeUpstream(() => [{ id: 5, name: 'Shooter', slug: 'shooter' }]);

    const res = await get('/api/genres', upstream.deps);

    expect(await res.json()).toEqual({
      count: 2,
      next: null,
      results: [
        { id: -1, name: 'Action', slug: 'action', image_background: null },
        { id: 5, name: 'Shooter', slug: 'shooter', image_background: null },
      ],
    });
    expect(res.headers.get('Cache-Control')).toContain('s-maxage=604800');
  });
});

describe('talking to IGDB', () => {
  it('sends the client id and token', async () => {
    const upstream = fakeUpstream();

    await get('/api/genres', upstream.deps);

    expect(upstream.tokenRequests[0]).toContain('client_id=client-1');
    expect(upstream.tokenRequests[0]).toContain('grant_type=client_credentials');
    expect(upstream.calls[0].token).toBe('Bearer token-1');
  });

  it('reuses one token, and asks for it once even when many requests start together', async () => {
    const upstream = fakeUpstream();

    await Promise.all([get('/api/genres', upstream.deps), get('/api/games', upstream.deps), get('/api/games/1', upstream.deps)]);
    await get('/api/genres', upstream.deps);

    expect(upstream.tokenRequests).toHaveLength(1);
  });

  it('renews the token a day before it expires', async () => {
    const upstream = fakeUpstream();
    await get('/api/genres', upstream.deps);

    // The fake token lasts 60 days.
    upstream.tick(58.9 * 86_400_000);
    await get('/api/genres', upstream.deps);
    expect(upstream.tokenRequests).toHaveLength(1);

    upstream.tick(0.2 * 86_400_000);
    await get('/api/genres', upstream.deps);
    expect(upstream.tokenRequests).toHaveLength(2);
  });

  it('gets a new token and retries once when the token is refused', async () => {
    const upstream = fakeUpstream(() => []);
    upstream.failNext(401);

    const res = await get('/api/genres', upstream.deps);

    expect(res.status).toBe(200);
    expect(upstream.tokenRequests).toHaveLength(2);
    expect(upstream.calls.map((call) => call.token)).toEqual(['Bearer token-1', 'Bearer token-2']);
  });

  it('gives up after a second refusal', async () => {
    const upstream = fakeUpstream();
    upstream.failNext(401, 401);

    const res = await get('/api/genres', upstream.deps);

    expect(res.status).toBe(502);
    expect(upstream.tokenRequests).toHaveLength(2);
  });

  it('waits and retries twice when IGDB is busy, then answers 503 with Retry-After', async () => {
    const upstream = fakeUpstream();
    upstream.failNext(429, 429, 429);
    const before = upstream.clockAt();

    const res = await get('/api/genres', upstream.deps);

    expect(res.status).toBe(503);
    expect(res.headers.get('Retry-After')).toBe('5');
    expect(res.headers.get('Cache-Control')).toBe('no-store');
    expect(upstream.calls).toHaveLength(3);
    expect(upstream.clockAt() - before).toBeGreaterThanOrEqual(1500);
  });

  it('recovers when a retry succeeds', async () => {
    const upstream = fakeUpstream(() => []);
    upstream.failNext(429);

    expect((await get('/api/genres', upstream.deps)).status).toBe(200);
  });

  it('answers 502 for other IGDB errors, without caching', async () => {
    const upstream = fakeUpstream();
    upstream.failNext(500);

    const res = await get('/api/games', upstream.deps);

    expect(res.status).toBe(502);
    expect(res.headers.get('Cache-Control')).toBe('no-store');
  });

  it('answers 502 when Twitch refuses the keys', async () => {
    const upstream = fakeUpstream();
    const realFetch = upstream.deps.fetch;
    upstream.deps.fetch = async (input, init) =>
      (String(input).startsWith('https://id.twitch.tv/') ? new Response('{}', { status: 400 }) : realFetch(input, init));

    expect((await get('/api/genres', upstream.deps)).status).toBe(502);
  });

  it('starts at most 4 requests per second', async () => {
    // Real timers, faked, so waiting requests share one clock.
    vi.useFakeTimers();
    const upstream = fakeUpstream();
    upstream.deps.now = () => Date.now();
    upstream.deps.sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
    const startedAt: number[] = [];
    const realFetch = upstream.deps.fetch;
    upstream.deps.fetch = async (input, init) => {
      if (String(input).includes('igdb.com')) startedAt.push(Date.now());
      return realFetch(input, init);
    };

    const all = Promise.all(Array.from({ length: 9 }, () => get('/api/genres', upstream.deps)));
    await vi.runAllTimersAsync();
    const answers = await all;
    vi.useRealTimers();

    expect(answers.every((res) => res.status === 200)).toBe(true);
    expect(startedAt).toHaveLength(9);
    for (let i = 4; i < startedAt.length; i++) expect(startedAt[i] - startedAt[i - 4]).toBeGreaterThanOrEqual(1000);
    expect(startedAt[8] - startedAt[0]).toBeLessThan(3000);
  });

  it('still waits for a request that arrives just after a burst', async () => {
    vi.useFakeTimers();
    const upstream = fakeUpstream();
    upstream.deps.now = () => Date.now();
    upstream.deps.sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
    const startedAt: number[] = [];
    const realFetch = upstream.deps.fetch;
    upstream.deps.fetch = async (input, init) => {
      if (String(input).includes('igdb.com')) startedAt.push(Date.now());
      return realFetch(input, init);
    };

    await Promise.all(Array.from({ length: 4 }, () => get('/api/genres', upstream.deps)));
    await vi.advanceTimersByTimeAsync(200);
    const late = get('/api/genres', upstream.deps);
    await vi.runAllTimersAsync();
    await late;
    vi.useRealTimers();

    expect(startedAt[4] - startedAt[0]).toBeGreaterThanOrEqual(1000);
  });
});
