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
  results: T[];
}

export interface GameQuery {
  genre: Genre | null;
  platform: Platform | null;
  sortOrder: string;
  searchText: string;
}

