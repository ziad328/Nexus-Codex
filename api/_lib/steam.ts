// Extra details from Steam's public store API, which is undocumented: any failure just means no extras.
import type { Deps } from './igdb.js';

export interface SteamExtras {
  /** Metacritic's own score, as Steam lists it. Null when Steam has none. */
  steam_metacritic: { score: number; url: string } | null;
  /** Steam's achievement count and the few it highlights. Null when the game has none. */
  steam_achievements: { total: number; highlighted: { name: string; icon: string }[] } | null;
}

export const NO_STEAM: SteamExtras = { steam_metacritic: null, steam_achievements: null };
const TIMEOUT_MS = 2500;
const APP_LINK = /^https:\/\/store\.steampowered\.com\/app\/(\d{1,10})(?:[/?#]|$)/;
const METACRITIC = /^https:\/\/www\.metacritic\.com\//;
const ICON = /^https:\/\/[a-z0-9.-]+\.steamstatic\.com\//;

/** The Steam app id in a Steam store link, or null. */
export const steamAppId = (url: string | undefined) => url?.match(APP_LINK)?.[1] ?? null;

interface AppDetails {
  success?: boolean;
  data?: {
    metacritic?: { score?: unknown; url?: unknown };
    achievements?: { total?: unknown; highlighted?: { name?: unknown; path?: unknown }[] };
  };
}

/** Steam's Metacritic score and achievements for one app; every field is checked before it reaches the app.
 * Null when Steam failed (unreachable, slow, an error or not JSON), so the caller can cache that briefly. */
export const getSteamExtras = async (deps: Deps, appId: string | null): Promise<SteamExtras | null> => {
  if (!appId) return NO_STEAM;
  try {
    const res = await deps.fetch(`https://store.steampowered.com/api/appdetails?appids=${appId}&l=english`, {
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    if (!res.ok) return null;
    const entry = ((await res.json()) as Record<string, AppDetails>)[appId];
    if (!entry?.success || !entry.data) return NO_STEAM;
    const { metacritic, achievements } = entry.data;

    const score = metacritic?.score;
    const scoreUrl = metacritic?.url;
    const total = achievements?.total;
    return {
      steam_metacritic: Number.isInteger(score) && (score as number) > 0 && (score as number) <= 100
        && typeof scoreUrl === 'string' && METACRITIC.test(scoreUrl)
        ? { score: score as number, url: scoreUrl }
        : null,
      steam_achievements: Number.isInteger(total) && (total as number) > 0
        ? {
          total: total as number,
          highlighted: (Array.isArray(achievements!.highlighted) ? achievements!.highlighted : []).flatMap(({ name, path }) =>
            typeof name === 'string' && name && typeof path === 'string' && ICON.test(path) ? [{ name, icon: path }] : []),
        }
        : null,
    };
  } catch {
    return null;
  }
};
