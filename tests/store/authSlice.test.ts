import type { Session, User } from '@supabase/supabase-js';
import authReducer, { setAuthLoading, setSession, signOut } from '../../src/store/authSlice';

const user = { id: 'user-1' } as User;
const session = { access_token: 'token' } as Session;
const initial = authReducer(undefined, { type: 'init' });

describe('authSlice', () => {
  it('starts loading, with nobody signed in', () => {
    expect(initial).toEqual({ user: null, session: null, isLoading: true });
  });

  it('stores a session and stops loading', () => {
    expect(authReducer(initial, setSession({ session, user }))).toEqual({ user, session, isLoading: false });
  });

  it('stops loading when there is no session', () => {
    expect(authReducer(initial, setSession({ session: null, user: null }))).toEqual({
      user: null,
      session: null,
      isLoading: false,
    });
  });

  it('sets the loading flag', () => {
    const loaded = authReducer(initial, setAuthLoading(false));
    expect(loaded.isLoading).toBe(false);
    expect(authReducer(loaded, setAuthLoading(true)).isLoading).toBe(true);
  });

  it('forgets the user on sign-out', () => {
    const active = authReducer(initial, setSession({ session, user }));
    expect(authReducer(active, signOut())).toEqual({ user: null, session: null, isLoading: false });
  });
});
