export interface Platform {
  id: number;
  name: string;
  slug: string;
}

export interface PlatformInfo {
  platform: Platform;
}

// What the proxy (api/) answers. One definition, so the app and the server can't drift apart.
export type { GameDetails, GenreSummary as Genre } from '../../api/_lib/games';
import type { GameSummary } from '../../api/_lib/games';

export type Game = GameSummary & { tags?: Tag[] };

export interface FetchResponse<T> {
  count: number;
  next?: string | null;
  results: T[];
}

export interface GameQuery {
  genreSlug?: string;
  platform?: Platform | null;
  sortOrder?: string;
  searchText?: string;
  developers?: string;
  publishers?: string;
  storeId?: number | null;
  tagSlug?: string;
}

export interface FavoriteGame {
  id: number;
  name: string;
  slug: string;
  background_image: string;
  metacritic: number | null;
  parent_platforms?: PlatformInfo[];
}

export type ViewMode = 'grid' | 'list';

export type CollectionName = 'playing' | 'beaten' | 'backlog' | 'wishlist';

export interface Collection {
  name: CollectionName;
  games: FavoriteGame[];
}

export interface Tag {
  id: number;
  name: string;
  slug: string;
}
