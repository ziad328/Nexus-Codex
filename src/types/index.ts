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

export interface Publisher {
  id: number;
  name: string;
}

export interface Developer {
  id: number;
  name: string;
}

export interface GameDetails extends Game {
  description_raw: string;
  released: string;
  publishers: Publisher[];
  developers: Developer[];
}

export interface Screenshot {
  id: number;
  image: string;
  width: number;
  height: number;
}
