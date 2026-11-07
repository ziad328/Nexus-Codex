import '@testing-library/jest-dom/vitest';
import { afterEach, beforeEach, vi } from 'vitest';
import { installBrowserFakes, resetBrowserFakes } from './fakes/browser';
import { installFakeApi, resetFakeApi } from './fakes/network';
import { supabaseFake } from './fakes/supabase';

// Every test gets the in-memory Supabase, so the real project can never be reached.
vi.mock('../src/utils/supabase', async () => ({
  supabase: (await import('./fakes/supabase')).supabase,
}));

installBrowserFakes();

beforeEach(() => {
  installFakeApi();
  supabaseFake.reset();
  localStorage.clear();
});

afterEach(() => {
  resetFakeApi();
  resetBrowserFakes();
});
