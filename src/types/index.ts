export interface Platform {
  id: number;
  name: string;
  slug: string;
}

export interface PlatformInfo {
  platform: Platform;
}

export interface Genre {
  id: number;
  name: string;
  slug: string;
  image_background: string;
}

export interface Game {
  id: number;
  name: string;
  background_image: string;
  parent_platforms: PlatformInfo[];
  metacritic: number;
  rating_top: number;
}

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

export interface Publisher {
  id: number;
  name: string;
  slug: string;
}

export interface Developer {
  id: number;
  name: string;
  slug: string;
}

export interface Store {
  id: number;
  name: string;
  slug: string;
  domain: string;
}

export interface GameStore {
  id: number;
  store_id: number;
  url: string;
}

export interface GameDetails extends Game {
  description_raw: string;
  released: string;
  publishers: Publisher[];
  developers: Developer[];
  stores: { id: number; store: Store }[];
  reddit_url?: string;
  website?: string;
}

export interface Screenshot {
  id: number;
  image: string;
  width: number;
  height: number;
}

export interface Trailer {
  id: number;
  name: string;
  preview: string;
  data: {
    480: string;
    max: string;
  };
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

export interface Achievement {
  id: number;
  name: string;
  description: string;
  image: string;
  percent: string;
}

export interface RedditPost {
  id: number;
  name: string;
  text: string;
  image: string;
  url: string;
  username: string;
  created: string;
}
