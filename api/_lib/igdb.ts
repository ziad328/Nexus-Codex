// Talks to IGDB: gets and refreshes the Twitch app token, keeps under IGDB's rate limit, retries what's worth retrying.

export interface Deps {
  fetch: typeof fetch;
  env: Record<string, string | undefined>;
  now: () => number;
  sleep: (ms: number) => Promise<void>;
}

export const realDeps = (): Deps => ({
  fetch: (...args) => fetch(...args),
  // Through globalThis, because the browser app's type check also reads this file (for the shared types).
  env: (globalThis as { process?: { env: Record<string, string | undefined> } }).process?.env ?? {},
  now: () => Date.now(),
  sleep: (ms) => new Promise((resolve) => setTimeout(resolve, ms)),
});

export class UpstreamError extends Error {
  readonly status: 502 | 503;

  constructor(message: string, status: 502 | 503) {
    super(message);
    this.status = status;
  }
}

const IGDB_URL = 'https://api.igdb.com/v4/';
const TOKEN_URL = 'https://id.twitch.tv/oauth2/token';
const PER_SECOND = 4;
const MAX_OPEN = 8;

// shortcut: the token lives in this instance's memory only. Each cold start asks Twitch for one, and Twitch keeps
// only 25 per app, so a busy site may see a 401 now and then; it's handled by one refresh and retry. Add a
// shared cache (Vercel Runtime Cache or Redis) if the logs show many refreshes.
let token: { value: string; expiresAt: number } | null = null;
let pendingToken: Promise<string> | null = null;
const started: number[] = [];
let open = 0;

/** Only for tests: forget the token and the rate-limit history. */
export const resetIgdbState = () => {
  token = null;
  pendingToken = null;
  started.length = 0;
  open = 0;
};

const credentials = (deps: Deps) => {
  const clientId = deps.env.TWITCH_CLIENT_ID;
  const secret = deps.env.TWITCH_CLIENT_SECRET;
  if (!clientId || !secret) throw new UpstreamError('The server is missing its IGDB credentials', 503);
  return { clientId, secret };
};

const getToken = async (deps: Deps): Promise<string> => {
  if (token && token.expiresAt > deps.now()) return token.value;
  // One request at a time, so a burst of visitors doesn't use up the 25 tokens.
  pendingToken ??= (async () => {
    try {
      const { clientId, secret } = credentials(deps);
      const params = new URLSearchParams({ client_id: clientId, client_secret: secret, grant_type: 'client_credentials' });
      const res = await deps.fetch(`${TOKEN_URL}?${params}`, { method: 'POST' }).catch(() => {
        throw new UpstreamError('Twitch could not be reached', 502);
      });
      if (!res.ok) throw new UpstreamError(`Twitch refused the token request (${res.status})`, 502);
      const body = (await res.json()) as { access_token: string; expires_in: number };
      // Renew a day early, so a token never expires between check and use.
      token = { value: body.access_token, expiresAt: deps.now() + (body.expires_in - 86_400) * 1000 };
      return token.value;
    } finally {
      pendingToken = null;
    }
  })();
  return pendingToken;
};

/** Waits for a free slot: at most 4 requests started per second and 8 open at once, as IGDB allows. */
const takeSlot = async (deps: Deps) => {
  for (;;) {
    const now = deps.now();
    while (started.length && now - started[0] >= 1000) started.shift();
    if (started.length < PER_SECOND && open < MAX_OPEN) {
      started.push(now);
      open++;
      return;
    }
    await deps.sleep(started.length ? 1000 - (now - started[0]) : 50);
  }
};

/** Runs one IGDB query. Retries once after a 401 with a new token, and twice after a 429. */
export const igdb = async <T>(deps: Deps, endpoint: string, query: string): Promise<T> => {
  const { clientId } = credentials(deps);
  let refreshed = false;
  for (let attempt = 0; ; attempt++) {
    const accessToken = await getToken(deps);
    await takeSlot(deps);
    let res: Response;
    try {
      res = await deps.fetch(`${IGDB_URL}${endpoint}`, {
        method: 'POST',
        headers: { 'Client-ID': clientId, Authorization: `Bearer ${accessToken}`, Accept: 'application/json' },
        body: query,
      });
    } catch {
      throw new UpstreamError('IGDB could not be reached', 502);
    } finally {
      open--;
    }
    if (res.ok) return (await res.json()) as T;
    if (res.status === 401 && !refreshed) {
      refreshed = true;
      token = null;
      continue;
    }
    if (res.status === 429) {
      if (attempt < 2) {
        await deps.sleep(500 * 2 ** attempt);
        continue;
      }
      throw new UpstreamError('IGDB is busy', 503);
    }
    throw new UpstreamError(`IGDB answered ${res.status}`, 502);
  }
};
