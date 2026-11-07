import type { User } from '@supabase/supabase-js';
import type { FavoriteGame } from '../src/types';
import type { TestState } from './render';

export const USER_ID = 'user-1';

export const makeGame = (id: number, overrides: Partial<FavoriteGame> = {}): FavoriteGame => ({
  id,
  name: `Game ${id}`,
  slug: `game-${id}`,
  background_image: `https://media.rawg.io/media/games/${id}.jpg`,
  metacritic: 80,
  parent_platforms: [{ platform: { id: 1, name: 'PC', slug: 'pc' } }],
  ...overrides,
});

/** The row Supabase holds for a saved game. */
export const makeRow = (game: FavoriteGame, extra: Record<string, unknown> = {}) => ({
  user_id: USER_ID,
  game_id: game.id,
  name: game.name,
  slug: game.slug,
  background_image: game.background_image,
  metacritic: game.metacritic,
  parent_platforms: game.parent_platforms,
  ...extra,
});

export const signedIn: TestState['auth'] = {
  user: { id: USER_ID } as User,
  session: null,
  isLoading: false,
};
