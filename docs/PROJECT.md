# Nexus Codex: Project Overview

The one living document for this project: what it's for, what it must do, how it's built, where it stands and what comes next. Update it whenever one of those changes. Day-to-day rules are in [../CLAUDE.md](../CLAUDE.md). The API research is in [rawg-vs-igdb.md](rawg-vs-igdb.md).

_Last updated: 2026-11-07 (service and hook tests added, BUG-3 proved, BUG-11 to BUG-15 found. Before that: store tests, BUG-9 and BUG-10; Phase 2 started with test setup, `CLAUDE.md` and this document)._

---

## 1. Vision

A fast, good-looking place to discover games and keep a personal library, for guests and signed-in users, including offline. A solo project, currently non-commercial.

Live: https://nexus-codex-lib.vercel.app. Repo: https://github.com/ziad328/Nexus-Codex.

## 2. Requirements

**Must hold at all times**
1. **User data is safe:** favorites and lists are never lost, duplicated or shown as the wrong game.
2. **No secret in the browser bundle.** (Not met yet: issue 1.)
3. **Works at 1440 px and 375 px**, with no sideways scroll.
4. **Offline:** saved lists and already-seen data still show; everything else gets a clear message.
5. **Quality bar:** tests, `npx tsc -b --noEmit`, `npm run build` and `npm run lint` all pass. (Lint not met yet: issue 3.)

**Features**
- **Discovery:** paged grid with infinite scroll, genre sidebar, platform, tag and store filters, debounced search, developer and publisher pages, grid/list toggle.
- **Game details modal:** description, release date, developers, publishers, screenshots, trailers, store links, achievements, website and Reddit links, similar games, glow from the cover, `?gameId=` deep links, Share.
- **Library:** favorites and four lists (Playing Now, Backlog, Beaten, Wishlist), guest lists merged to the cloud on sign-in, Recently Viewed (last 10).
- **Sign-in:** magic link with email validation and typo checks, expired-link message.
- **App:** adult-content filter, PWA with update prompt, offline and error states, SEO tags.

## 3. Architecture

| Layer | Choice |
|:--|:--|
| UI | React 19, TypeScript, Tailwind v4, Framer Motion, OverlayScrollbars |
| Routing | React Router 7 |
| State | Redux Toolkit. Redux Persist saves `favorites`, `collections`, and from `ui` only `viewMode` and `recentlyViewed`. |
| Game data | RAWG through Axios, called from the browser. **Down; being replaced (section 7).** |
| Accounts and lists | Supabase: magic-link auth, `favorites` and `collections` tables. The schema isn't in the repo. |
| PWA | `vite-plugin-pwa` (Workbox): images cache-first, API network-first |
| Forms | Formik + Yup |
| Tests | Vitest 5, React Testing Library, jsdom |
| Hosting | Vercel, deployed from `main` |

**Environment values:** `VITE_RAWG_API_KEY`, `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`.

## 4. Status

| Phase | State | Summary |
|:--|:--|:--|
| 1: Compare APIs | ✅ Done | [rawg-vs-igdb.md](rawg-vs-igdb.md). Chosen: IGDB, with a Steam add-on later. |
| 2: Test the current app | 🟡 In progress | See the list below |
| 3: Migrate | ⬜ Waiting for Phase 2 and the owner's go-ahead | |

**Phase 2 tasks**
- [x] Test setup, `CLAUDE.md`, this document
- [x] Store
- [x] Services
- [x] Hooks
- [ ] Shared components
- [ ] Auth and game components
- [ ] Layout
- [ ] Pages and `App`
- [ ] Playwright smoke suite
- [ ] Fix existing lint errors
- [ ] Coverage report and hand-check list

**Latest verification (2026-11-07):** 171 tests pass and 20 expected failures mark known problems. `npx tsc -b --noEmit` clean, build passes. `npm run lint` still fails on the same 24 existing errors (issue 3); the test code adds none. Coverage: `src/store` 99% of lines and 92% of branches; `src/hooks` and `src/services` 100% of both. 54 deliberate breakages of this code were all caught. Live site: game data doesn't load (issue 2).

**Test skips**
| Skipped | Why |
|:--|:--|
| `useAppDispatch`, `useAppSelector` | Thin wrappers |
| `main.tsx` | Start-up only; the smoke suite will cover it |
| `types/`, `vite-env.d.ts` | No runtime code |

## 5. Action needed from the owner

1. **Check Row Level Security** with the read-only SQL in [rawg-vs-igdb.md, section 5](rawg-vs-igdb.md#5-report-only-items). Until confirmed, treat lists as possibly public.
2. **Before Phase 3:** create the Twitch app, so a short script can test real IGDB data. Exact steps come at that point.

## 6. Open issues and known limits

| # | Issue | Impact | Plan |
|:--|:--|:--|:--|
| 1 | The RAWG key ships in the browser bundle | Anyone can copy it | Removed in Phase 3 |
| 2 | RAWG's API and site return 522 (checked 2026-11-07) | The live app shows no games | Phase 3 |
| 3 | `npm run lint`: 24 errors and 1 warning in 21 files, all there before testing started (15 `no-explicit-any`, 9 `set-state-in-effect`) | One of the four checks can't pass | Fix at the end of Phase 2, once tests protect the code, without disabling rules |
| 4 | RLS is unconfirmed; `collections` and `favorites` are read with no user filter | Lists may be readable by anyone | Owner checks |
| 5 | A game deleted on one device comes back from another at sign-in. Confirmed by `it.fails('ISSUE-5…')` in both slice tests. | Deletions don't stick across devices | Owner to decide; needs deletion records or merging guest items only |
| 6 | RAWG's terms require a link on pages using its data; the app has none | Terms breach while RAWG is in use | Goes away with RAWG |
| 7 | The README names `VITE_SUPABASE_ANON_KEY`; the code reads `VITE_SUPABASE_PUBLISHABLE_KEY`. Other claims are wrong too. | Misleads setup | Rewrite in Phase 3 |

**Known bugs** (each gets an `it.fails` test as Phase 2 reaches it, and none is fixed without the owner's OK. "Pending" means found by reading the code and not yet proved by a test.)

| Bug | What happens | Where | Test |
|:--|:--|:--|:--|
| BUG-1 | Modal glow never works: colorthief 3 has no class, the error is swallowed, and the image lacks `crossorigin` | `GameDetailsModal` | Pending |
| BUG-2 | The whole sidebar, including My Collection, disappears on an API error | `Sidebar` | Pending |
| BUG-3 | The previous game's trailers, store links and similar games stay until new ones arrive | `useGameTrailers`, `useGameStores`, `useSimilarGames` | ✅ Proved |
| BUG-4 | Trailers are hidden when a game has no screenshots | `GameDetailsModal` | Pending |
| BUG-5 | Similar-game clicks do nothing on the Collections page | `CollectionsPage` | Pending |
| BUG-6 | The adult filter covers the grid only, not deep links or similar games | `useGames` | Pending |
| BUG-7 | A failed merge upload is only logged, while the item looks saved. The item isn't lost: the next merge retries it. | both list slices | ✅ Proved |
| BUG-8 | A failed add or remove shows the user nothing. The store does report the failure; the buttons ignore it. | `CollectionButton`, `FavoriteButton` | Pending |
| BUG-9 | Merges running at once upload the same game twice, and duplicate cloud rows then show as duplicate cards. A magic-link sign-in looks able to trigger this: `App` merges on every auth event with a session, and Supabase's code sends both `INITIAL_SESSION` and `SIGNED_IN`. **A database unique constraint would block the duplicates, but the schema is unknown.** | both list slices, `App` | ✅ Proved in the store with the fake; not reproduced against real Supabase |
| BUG-10 | `fetchFavorites` with nobody signed in wipes local favorites, while `fetchCollections` keeps its lists. `App` never calls it that way today, so it can't happen yet. | `favoritesSlice` | ✅ Proved |
| BUG-11 | On a non-RAWG URL, the crop helper returns a broken address (`httpscrop/600/400/://images…`). Harmless today, but **every IGDB image would break**. | `image-url` | ✅ Proved; must change in Phase 3 |
| BUG-12 | After one failed request, the error stays even when a later request succeeds. Sections that hide on error stay hidden for later games until the modal closes. | `useData`, `useGameTrailers`, `useGameStores`, `useSimilarGames` | ✅ Proved |
| BUG-13 | Changing a filter after scrolling first requests page 2 of the new filter, aborts it, then requests page 1. A wasted request, which matters more with IGDB's 4 per second limit. | `useGames` | ✅ Proved |
| BUG-14 | The adult filter hides innocent games: "Command & Conquer: Yuri's Revenge" is hidden because of the word "yuri". | `useGames` | ✅ Proved |
| BUG-15 | With no genre cache, genres are requested twice. | `useGenres` | ✅ Proved |

## 7. Roadmap

**Phase 2: test the current app.** Tasks in section 4, then a coverage report and the list of what tests can't judge (motion, layout, real PWA), with how each is checked by hand.

**Phase 3: move to IGDB** (only after the owner approves)
1. Test real IGDB data with a short script.
2. Add a Vercel proxy with GET routes and a typed API layer, so components don't depend on IGDB's format.
3. Move each feature, one task at a time, keeping Phase 2 tests passing.
4. Migrate saved ids, after a backup and the owner's review. The owner runs the SQL.
5. Remove RAWG code and config, and list what was removed.
6. Check sign-in, guest merge, offline and a deep link on a production build at 1440 px and 375 px.
7. Rewrite the README, overview, `CLAUDE.md` and this document to match the real stack.

**After IGDB works:** Steam add-on for achievements, Metacritic and trailers on Steam games.

## 8. Key decisions

| Date | Decision | Why |
|:--|:--|:--|
| 2026-11-07 | **IGDB as the main API** | RAWG is unreachable. IGDB is free and documented, and has the data for the app's filters (store filter still to test). No alternative beat it ([comparison](rawg-vs-igdb.md#other-apis-checked)). |
| 2026-11-07 | **Steam add-on, after IGDB works** | Restores achievements, Metacritic and playable trailers for Steam games. Undocumented endpoints, so it must fail silently back to IGDB. |
| 2026-11-07 | **GET-only proxy with fixed routes** | Keeps secrets off the browser and allows CDN and offline caching. Never forwards raw query text. |
| 2026-11-07 | **Match old saved games through Wikidata**, then slug and name | Wikidata links RAWG and IGDB for about 59,000 games. A RAWG id must never be read as an IGDB id. |
| 2026-11-07 | **Small Playwright suite in Phase 2** | jsdom can't see CSS, layout or a real service worker. |
| 2026-11-07 | **Fix lint last in Phase 2** | Some fixes can change behaviour, so tests come first. |
| 2026-11-07 | **Commit directly on `dev`** | Owner's instruction. |

## 9. Fix history

Nothing fixed yet.
