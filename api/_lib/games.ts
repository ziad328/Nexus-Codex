// Builds IGDB queries from the app's named filters, and turns IGDB's answers into the app's shapes.
// The browser never sends query text; every value is checked or looked up in a fixed list first.
import { ACTION_GENRE, IGDB_EROTIC_THEME, PARENT_PLATFORMS, STORES, TAGS, WEBSITE_OFFICIAL, WEBSITE_SUBREDDIT } from './catalog.js';
import { igdb } from './igdb.js';
import type { Deps } from './igdb.js';

export const PAGE_SIZE = 20;
const MAX_PAGE = 500;
const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export class BadRequest extends Error {}

// ---- Shapes the app receives ----

export interface PlatformRef { platform: { id: number; name: string; slug: string } }

export interface GameSummary {
  id: number;
  name: string;
  slug: string;
  /** Portrait cover, or '' when IGDB has none. */
  background_image: string;
  /** IGDB's critic score (`aggregated_rating`), rounded; not Metacritic. */
  metacritic: number | null;
  parent_platforms: PlatformRef[];
}

export interface GamePage { count: number; next: string | null; results: GameSummary[] }

export interface GameDetails extends GameSummary {
  description_raw: string;
  released: string | null;
  developers: { id: number; name: string; slug: string }[];
  publishers: { id: number; name: string; slug: string }[];
  stores: { id: number; store: { id: number; name: string; slug: string; domain: string } }[];
  store_links: { id: number; store_id: number; url: string }[];
  website: string | null;
  reddit_url: string | null;
  screenshots: { id: number; image: string; width: number; height: number }[];
  trailers: { id: number; name: string; youtube_id: string }[];
  similar: GameSummary[];
}

export interface GenreSummary { id: number; name: string; slug: string; image_background: null }

// ---- IGDB's shapes, only the fields asked for ----

interface IgdbImage { id: number; image_id: string; width?: number; height?: number }
interface IgdbGame {
  id: number;
  name: string;
  slug: string;
  cover?: IgdbImage;
  aggregated_rating?: number;
  platforms?: number[];
  summary?: string;
  storyline?: string;
  first_release_date?: number;
  screenshots?: IgdbImage[];
  videos?: { id: number; name?: string; video_id: string }[];
  involved_companies?: { developer: boolean; publisher: boolean; company: { id: number; name: string; slug: string } }[];
  websites?: { id: number; type: number; url: string }[];
  external_games?: { id: number; external_game_source: number; url?: string }[];
  similar_games?: IgdbGame[];
  themes?: number[];
}

export const imageUrl = (imageId: string, size: 'cover_big' | 'screenshot_big' | '1080p') =>
  `https://images.igdb.com/igdb/image/upload/t_${size}/${imageId}.jpg`;

const parentPlatforms = (ids: number[] = []): PlatformRef[] =>
  PARENT_PLATFORMS.filter((parent) => parent.igdb.some((id) => ids.includes(id)))
    .map(({ id, name, slug }) => ({ platform: { id, name, slug } }));

const toSummary = (game: IgdbGame): GameSummary => ({
  id: game.id,
  name: game.name,
  slug: game.slug,
  background_image: game.cover ? imageUrl(game.cover.image_id, 'cover_big') : '',
  metacritic: game.aggregated_rating == null ? null : Math.round(game.aggregated_rating),
  parent_platforms: parentPlatforms(game.platforms),
});

const SUMMARY_FIELDS = 'name,slug,cover.image_id,aggregated_rating,platforms';
// Main games, remakes, remasters, expanded and standalone games; no DLC, bundles or editions, and nothing adult.
const PLAYABLE = `game_type = (0,4,8,9,10) & version_parent = null & themes != (${IGDB_EROTIC_THEME})`;

// ---- Validation ----

const positiveInt = (value: string | null, name: string, max: number) => {
  if (value === null) return null;
  if (!/^\d{1,9}$/.test(value) || Number(value) < 1 || Number(value) > max) throw new BadRequest(`Invalid ${name}`);
  return Number(value);
};

const slug = (value: string | null, name: string) => {
  if (value === null) return null;
  if (value.length > 80 || !SLUG.test(value)) throw new BadRequest(`Invalid ${name}`);
  return value;
};

/** Search text can't break out of IGDB's quotes: quotes, backslashes and semicolons are dropped. */
export const cleanSearch = (value: string | null) => {
  if (value === null) return null;
  const text = value.replace(/["\\;]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 100);
  return text || null;
};

const lookup = <T extends { id: number }>(list: T[], value: string | null, name: string) => {
  const id = positiveInt(value, name, 1_000_000);
  if (id === null) return null;
  const found = list.find((item) => item.id === id);
  if (!found) throw new BadRequest(`Unknown ${name}`);
  return found;
};

// ---- Queries ----

const companyGames = async (deps: Deps, companySlug: string, role: 'developed' | 'published') => {
  const [company] = await igdb<{ developed?: number[]; published?: number[] }[]>(
    deps, 'companies', `fields ${role}; where slug = "${companySlug}"; limit 1;`,
  );
  return company?.[role] ?? [];
};

/** One page of the grid. Accepts RAWG's parameter names, so the app's hooks barely change. */
export const listGames = async (deps: Deps, params: URLSearchParams): Promise<GamePage> => {
  const page = positiveInt(params.get('page'), 'page', MAX_PAGE) ?? 1;
  const genre = slug(params.get('genres'), 'genre');
  const platform = lookup(PARENT_PLATFORMS, params.get('parent_platforms'), 'platform');
  const store = lookup(STORES, params.get('stores'), 'store');
  const tag = TAGS.find((item) => item.slug === slug(params.get('tags'), 'tag'));
  if (params.get('tags') && !tag) throw new BadRequest('Unknown tag');
  const developer = slug(params.get('developers'), 'developer');
  const publisher = slug(params.get('publishers'), 'publisher');
  const search = cleanSearch(params.get('search'));
  if (store && store.source === null) throw new BadRequest('That store can not be filtered');

  const where = [PLAYABLE];
  if (!search) where.push('cover != null');
  if (genre) where.push(genre === ACTION_GENRE.slug ? ACTION_GENRE.where : `genres.slug = "${genre}"`);
  if (platform) where.push(`platforms = (${platform.igdb.join(',')})`);
  if (store) where.push(`external_games.external_game_source = ${store.source}`);
  if (tag) where.push(tag.where);
  // A company's own lists, not involved_companies: two conditions there can match two different companies.
  for (const [companySlug, role] of [[developer, 'developed'], [publisher, 'published']] as const) {
    if (!companySlug) continue;
    const ids = await companyGames(deps, companySlug, role);
    if (ids.length === 0) return { count: 0, next: null, results: [] };
    where.push(`id = (${ids.join(',')})`);
  }

  const offset = (page - 1) * PAGE_SIZE;
  // One extra result shows whether another page exists; IGDB gives no total for free.
  const query = [
    search ? `search "${search}";` : '',
    `fields ${SUMMARY_FIELDS};`,
    `where ${where.join(' & ')};`,
    search ? '' : 'sort total_rating_count desc;',
    `limit ${PAGE_SIZE + 1}; offset ${offset};`,
  ].join(' ');
  const games = await igdb<IgdbGame[]>(deps, 'games', query);

  const hasMore = games.length > PAGE_SIZE && page < MAX_PAGE;
  const next = new URLSearchParams(params);
  next.set('page', String(page + 1));
  return {
    count: offset + Math.min(games.length, PAGE_SIZE),
    next: hasMore ? `/api/games?${next}` : null,
    results: games.slice(0, PAGE_SIZE).map(toSummary),
  };
};

const DETAIL_FIELDS = [
  SUMMARY_FIELDS, 'summary', 'storyline', 'first_release_date',
  'screenshots.image_id', 'screenshots.width', 'screenshots.height', 'videos.video_id', 'videos.name',
  'involved_companies.developer', 'involved_companies.publisher', 'involved_companies.company.name', 'involved_companies.company.slug',
  'websites.type', 'websites.url', 'external_games.external_game_source', 'external_games.url',
  'similar_games.name', 'similar_games.slug', 'similar_games.cover.image_id', 'similar_games.aggregated_rating',
  'similar_games.platforms', 'similar_games.themes',
].join(',');

/** Everything the details modal shows, in one IGDB request. Null when the game doesn't exist or is adult. */
export const getGame = async (deps: Deps, idText: string): Promise<GameDetails | null> => {
  const id = positiveInt(idText, 'game id', 999_999_999)!;
  const [game] = await igdb<IgdbGame[]>(
    deps, 'games', `fields ${DETAIL_FIELDS}; where id = ${id} & themes != (${IGDB_EROTIC_THEME}); limit 1;`,
  );
  if (!game) return null;

  const companies = (role: 'developer' | 'publisher') =>
    (game.involved_companies ?? []).filter((item) => item[role]).map(({ company }) => company);
  const websites = game.websites ?? [];
  const firstUrl = (type: number) => websites.find((site) => site.type === type)?.url ?? null;

  // A store's link comes from its website entry, else from the store's own id for the game.
  const storeLinks = STORES.flatMap((store) => {
    const url = websites.find((site) => store.websiteTypes.includes(site.type))?.url
      ?? game.external_games?.find((entry) => entry.external_game_source === store.source && entry.url)?.url;
    return url ? [{ id: store.id, store_id: store.id, url }] : [];
  });

  return {
    ...toSummary(game),
    description_raw: [game.summary, game.storyline].filter(Boolean).join('\n\n'),
    released: game.first_release_date ? new Date(game.first_release_date * 1000).toISOString().slice(0, 10) : null,
    developers: companies('developer'),
    publishers: companies('publisher'),
    stores: storeLinks.map(({ store_id }) => {
      const { id, name, slug: storeSlug, domain } = STORES.find((store) => store.id === store_id)!;
      return { id, store: { id, name, slug: storeSlug, domain } };
    }),
    store_links: storeLinks,
    website: firstUrl(WEBSITE_OFFICIAL),
    reddit_url: firstUrl(WEBSITE_SUBREDDIT),
    screenshots: (game.screenshots ?? []).map((shot) => ({
      id: shot.id, image: imageUrl(shot.image_id, 'screenshot_big'), width: shot.width ?? 0, height: shot.height ?? 0,
    })),
    trailers: (game.videos ?? []).map((video) => ({ id: video.id, name: video.name ?? 'Trailer', youtube_id: video.video_id })),
    similar: (game.similar_games ?? []).filter((other) => !other.themes?.includes(IGDB_EROTIC_THEME)).map(toSummary),
  };
};

/** IGDB's genres, with Action first. */
export const listGenres = async (deps: Deps): Promise<GenreSummary[]> => {
  const genres = await igdb<{ id: number; name: string; slug: string }[]>(deps, 'genres', 'fields name,slug; sort name asc; limit 100;');
  return [ACTION_GENRE, ...genres].map(({ id, name, slug: genreSlug }) => ({ id, name, slug: genreSlug, image_background: null }));
};
