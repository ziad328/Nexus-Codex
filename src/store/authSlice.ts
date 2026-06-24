import { createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import type { User, Session } from '@supabase/supabase-js';

interface AuthState {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
}

const initialState: AuthState = {
  user: null,
  session: null,
  isLoading: true, // Starts true until we check session
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setSession(state, action: PayloadAction<{ session: Session | null; user: User | null }>) {
      state.session = action.payload.session;
      state.user = action.payload.user;
      state.isLoading = false;
    },
    setAuthLoading(state, action: PayloadAction<boolean>) {
      state.isLoading = action.payload;
    },
    signOut(state) {
      state.user = null;
      state.session = null;
      state.isLoading = false;
    }
  },
});

export const { setSession, setAuthLoading, signOut } = authSlice.actions;
export default authSlice.reducer;
