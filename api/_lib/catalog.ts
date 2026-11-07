// The app's fixed filter lists, and what each means in IGDB. Ids were checked against the live API on 2026-11-07.
// Platform and store ids keep RAWG's numbers, so links and saved filters stay meaningful.

export const IGDB_EROTIC_THEME = 42;

export interface ParentPlatform { id: number; name: string; slug: string; igdb: number[] }

export const PARENT_PLATFORMS: ParentPlatform[] = [
  { id: 1, name: 'PC', slug: 'pc', igdb: [6] },
  { id: 2, name: 'PlayStation', slug: 'playstation', igdb: [7, 8, 9, 38, 46, 48, 167] },
  { id: 3, name: 'Xbox', slug: 'xbox', igdb: [11, 12, 49, 169] },
  { id: 7, name: 'Nintendo', slug: 'nintendo', igdb: [4, 5, 18, 19, 20, 21, 22, 24, 33, 37, 41, 130, 508] },
  { id: 5, name: 'Apple Macintosh', slug: 'mac', igdb: [14] },
  { id: 6, name: 'Linux', slug: 'linux', igdb: [3] },
  { id: 4, name: 'iOS', slug: 'ios', igdb: [39] },
  { id: 8, name: 'Android', slug: 'android', igdb: [34] },
  { id: 14, name: 'Web', slug: 'web', igdb: [82] },
];

export interface StoreInfo { id: number; name: string; slug: string; domain: string; source: number | null; websiteTypes: number[] }

// `source` is IGDB's external_game_source, used to filter; `websiteTypes` are the matching link types.
// Nintendo has no source in IGDB, so it can't be a filter, but its links still show.
export const STORES: StoreInfo[] = [
  { id: 1, name: 'Steam', slug: 'steam', domain: 'store.steampowered.com', source: 1, websiteTypes: [13] },
  { id: 3, name: 'PlayStation Store', slug: 'playstation-store', domain: 'store.playstation.com', source: 36, websiteTypes: [23] },
  { id: 2, name: 'Xbox Store', slug: 'xbox-store', domain: 'microsoft.com', source: 11, websiteTypes: [22] },
  { id: 11, name: 'Epic Games', slug: 'epic-games', domain: 'epicgames.com', source: 26, websiteTypes: [16] },
  { id: 5, name: 'GOG', slug: 'gog', domain: 'gog.com', source: 5, websiteTypes: [17] },
  { id: 4, name: 'App Store', slug: 'apple-appstore', domain: 'apps.apple.com', source: 13, websiteTypes: [10, 11] },
  { id: 8, name: 'Google Play', slug: 'google-play', domain: 'play.google.com', source: 15, websiteTypes: [12] },
  { id: 9, name: 'itch.io', slug: 'itch', domain: 'itch.io', source: 30, websiteTypes: [15] },
  { id: 6, name: 'Nintendo Store', slug: 'nintendo', domain: 'nintendo.com', source: null, websiteTypes: [24] },
];

export const WEBSITE_OFFICIAL = 1;
export const WEBSITE_SUBREDDIT = 14;

export interface TagInfo { id: number; name: string; slug: string; where: string }

// IGDB has no tags like RAWG's, so these are curated from game modes, perspectives and themes.
export const TAGS: TagInfo[] = [
  { id: 1, name: 'Singleplayer', slug: 'singleplayer', where: 'game_modes = (1)' },
  { id: 2, name: 'Multiplayer', slug: 'multiplayer', where: 'game_modes = (2)' },
  { id: 3, name: 'Co-op', slug: 'co-op', where: 'game_modes = (3)' },
  { id: 4, name: 'Split Screen', slug: 'split-screen', where: 'game_modes = (4)' },
  { id: 5, name: 'MMO', slug: 'mmo', where: 'game_modes = (5)' },
  { id: 6, name: 'Battle Royale', slug: 'battle-royale', where: 'game_modes = (6)' },
  { id: 7, name: 'First-Person', slug: 'first-person', where: 'player_perspectives = (1)' },
  { id: 8, name: 'Third-Person', slug: 'third-person', where: 'player_perspectives = (2)' },
  { id: 9, name: 'Isometric', slug: 'isometric', where: 'player_perspectives = (3)' },
  { id: 10, name: 'Side View', slug: 'side-view', where: 'player_perspectives = (4)' },
  { id: 11, name: 'VR', slug: 'vr', where: 'player_perspectives = (7)' },
  { id: 12, name: 'Open World', slug: 'open-world', where: 'themes = (38)' },
  { id: 13, name: 'Sandbox', slug: 'sandbox', where: 'themes = (33)' },
  { id: 14, name: 'Survival', slug: 'survival', where: 'themes = (21)' },
  { id: 15, name: 'Horror', slug: 'horror', where: 'themes = (19)' },
  { id: 16, name: 'Stealth', slug: 'stealth', where: 'themes = (23)' },
  { id: 17, name: 'Fantasy', slug: 'fantasy', where: 'themes = (17)' },
  { id: 18, name: 'Sci-fi', slug: 'sci-fi', where: 'themes = (18)' },
  { id: 19, name: 'Comedy', slug: 'comedy', where: 'themes = (27)' },
  { id: 20, name: 'Historical', slug: 'historical', where: 'themes = (22)' },
];

// IGDB has no "Action" genre; it's a theme there, but it's the category people look for first.
export const ACTION_GENRE = { id: -1, name: 'Action', slug: 'action', where: 'themes = (1)' };
