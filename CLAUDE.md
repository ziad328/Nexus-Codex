# Nexus Codex

A game discovery and library app: React 19, TypeScript, Vite, Tailwind v4, Redux Toolkit + Redux Persist, Axios, Supabase, Workbox PWA, on Vercel. Tested with Vitest.
Vision, status, open issues, roadmap and decisions: [docs/PROJECT.md](docs/PROJECT.md).

## Commands
- `npm install`, then `npm run dev`
- `npm test`, `npx tsc -b --noEmit`, `npm run build`, `npm run lint`: all four must pass before a commit
- `npm run test:watch`, `npm run test:coverage`
- `npm run test:e2e`: Playwright smoke suite in `e2e/`, run separately. It builds to `dist-e2e` with fake keys, and first needs `npx playwright install chromium`.
- Use `tsc -b`. Plain `npx tsc --noEmit` checks **0 files** here, because the root `tsconfig.json` only has references.

## Layout
- `api/`: the IGDB proxy. `api/_lib/router.ts` handles every route for Vercel and for `npm run dev`; keys come from `TWITCH_CLIENT_ID` and `TWITCH_CLIENT_SECRET` in `.env.local` (or Vercel), never `VITE_`. Tests: `tests/api/`, with a fake IGDB.
- `src/pages/`: routes (`/`, `/genre/:genreSlug`, `/developer/:developerSlug`, `/publisher/:publisherSlug`, `/collection`), set up in `App.tsx`
- `src/components/`: `auth/`, `game/`, `layout/`, `shared/`
- `src/hooks/`: data hooks built on Axios and `AbortController`, all calling our `/api`. There is no React Query. Filter lists (platforms, stores, tags) are fixed, in `api/_lib/catalog.ts`, shared by the app and the proxy.
- `src/services/api-client.ts`: the only Axios instance, pointed at our `/api`.
- `src/store/`: `favoritesSlice` and `collectionsSlice` (user data, guest and Supabase), `authSlice`, `uiSlice`, `index.ts` (what is persisted)
- `src/utils/supabase.ts`: the only Supabase client. It throws at import when its env values are missing.
- `src/types/index.ts`: shared types
- `tests/`: mirrors `src/`. `tests/setup.ts` runs before every file. `tests/fakes/` holds the fake API, Supabase and browser APIs. `tests/render.tsx` has `renderWithProviders` and `renderHookWithProviders`. `tests/fixtures.ts` has sample games and a signed-in state.

## Conventions
- **Styling**: Tailwind with the tokens in `src/index.css` (`bg-background`, `bg-background-card`, `text-accent`, `font-medieval`). Every view must work at 1440 px and 375 px.
- **Reuse** what exists: `ProgressiveImage`, `CriticScore`, `PlatformIconList`, the selectors, `SmoothScrollbar`. Icons come from `lucide-react`, platform icons from `react-icons`.
- **Motion**: Framer Motion, inside the app's `MotionConfig reducedMotion="user"`.
- **Secrets**: never in the repo or chat. A `VITE_` variable ends up in the browser bundle, so server secrets must not use that prefix. Local values go in a gitignored `.env.local`.
- **User data**: lists and favorites must never be lost, duplicated or show the wrong game. Back up first, never delete rows in a migration, and the owner runs all SQL.

## Testing
- All new logic and every new component needs a test. Thin wrappers with no logic don't; record skips in `docs/PROJECT.md`.
- Test what the user sees and what the code does, not implementation details.
- Tests never reach a real service: `fetch` and `XMLHttpRequest` throw, and Supabase is always the in-memory fake.
  - API: `mockApi(url, data)`, `mockApiError(url, status)`, `deferred()`, `apiRequests` from `tests/fakes/network.ts`
  - Supabase: `supabaseFake.seed`, `.rows`, `.queries`, `.failNext`, `.emitAuth` from `tests/fakes/supabase.ts`
  - Scroll: `triggerIntersection()` from `tests/fakes/browser.ts`
- Never skip or weaken a test to get a pass.
- **Known bugs**: don't fix silently. Write `it.fails('BUG-n: correct behaviour', …)`, add it to the bug table in `docs/PROJECT.md`, and ask the owner. The test states the right behaviour, so it starts failing the moment the bug is fixed.
- When an API change alters a test's input data, update the data and keep what it checks. If what it checks has to change, tell the owner first.

## Workflow
Work in phases and wait for the owner's go-ahead before starting the next one.

Each task:
1. Build the change.
2. Add its test.
3. Check it in the browser at 1440 px and 375 px. If nothing visible changed, say so instead.
4. Run the four checks.
5. Update `docs/PROJECT.md` if status, issues, conventions or decisions changed.
6. Show the owner the result, and commit only once they approve.

**Git**
- Commit on `dev`, never on `main`. One commit per task: `feat(scope): Capitalized summary`, ending with the co-author line.
- Don't push or merge without asking. The owner merges into `main`, and Vercel deploys from `main`.

**Working with the owner**
- Keep answers short, and list what's still not done in very few words.
- State only what you verified, and say clearly what you couldn't test.
- Ask only about real decisions.
- Report side findings instead of fixing them unasked.
