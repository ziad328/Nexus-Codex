# Nexus Codex: Project Overview

The one living document for this project: what it's for, what it must do, how it's built, where it stands and what comes next. Update it whenever one of those changes. Day-to-day rules are in [../CLAUDE.md](../CLAUDE.md). The API research is in [rawg-vs-igdb.md](rawg-vs-igdb.md).

_Last updated: 2026-11-07 (genre fixes: one shared request, sidebar survives errors, genre titles never stuck on Loading. Before that: trailer picker shows five, then "Show all". Before that: screenshot gallery with arrows, thumbnails, keys and swipe. Before that: RAWG code removed, README rewritten, IGDB credited. Before that: offline rules for IGDB. Before that: YouTube trailers, click to load. Before that: portrait cover cards. Before that: app moved onto the IGDB proxy; saved games start fresh. Before that: IGDB proxy added, not yet used by the app. Before that: BUG-25 fixed: phones can sign in and out. Before that: coverage report and hand-check list added; database check results recorded. Before that: lint errors fixed without disabling rules, which also fixed BUG-13; Playwright smoke suite, BUG-19 proved; page and `App` tests, BUG-5 proved, BUG-27 to BUG-33, two timing faults in older tests fixed; layout tests, BUG-2 proved, BUG-25 and BUG-26; auth and game component tests, BUG-1, BUG-4 and BUG-6 proved, BUG-20 to BUG-24; shared component tests, BUG-8 proved, BUG-16 to BUG-19; service and hook tests, BUG-3 proved, BUG-11 to BUG-15; store tests, BUG-9 and BUG-10; Phase 2 started with test setup, `CLAUDE.md` and this document)._

---

## 1. Vision

A fast, good-looking place to discover games and keep a personal library, for guests and signed-in users, including offline. A solo project, currently non-commercial.

Live: https://nexus-codex-lib.vercel.app. Repo: https://github.com/ziad328/Nexus-Codex.

## 2. Requirements

**Must hold at all times**
1. **User data is safe:** favorites and lists are never lost, duplicated or shown as the wrong game.
2. **No secret in the browser bundle.** The IGDB keys live only in the proxy; a scan of the build checks it.
3. **Works at 1440 px and 375 px**, with no sideways scroll.
4. **Offline:** saved lists and already-seen data still show; everything else gets a clear message.
5. **Quality bar:** tests, `npx tsc -b --noEmit`, `npm run build` and `npm run lint` all pass.

**Features**
- **Discovery:** paged grid with infinite scroll, genre sidebar, platform, tag and store filters, debounced search, developer and publisher pages, grid/list toggle.
- **Game details modal:** description, release date, developers, publishers, a screenshot gallery (arrows, counter, thumbnails, arrow keys, swipe), trailers, store links, achievements, website and Reddit links, similar games, glow from the cover, `?gameId=` deep links, Share.
- **Library:** favorites and four lists (Playing Now, Backlog, Beaten, Wishlist), guest lists merged to the cloud on sign-in, Recently Viewed (last 10).
- **Sign-in:** magic link with email validation and typo checks, expired-link message.
- **App:** adult-content filter, PWA with update prompt, offline and error states, SEO tags.

## 3. Architecture

| Layer | Choice |
|:--|:--|
| UI | React 19, TypeScript, Tailwind v4, Framer Motion, OverlayScrollbars |
| Routing | React Router 7 |
| State | Redux Toolkit. Redux Persist saves `favorites`, `collections`, and from `ui` only `viewMode` and `recentlyViewed`. |
| Game data | IGDB, through our own GET-only proxy in `api/` (Vercel functions, also served by `npm run dev`). The browser holds no key. |
| Accounts and lists | Supabase: magic-link auth, `favorites` and `collections` tables. The schema isn't in the repo. |
| PWA | `vite-plugin-pwa` (Workbox): images cache-first, API network-first |
| Forms | Formik + Yup |
| Tests | Vitest 5, React Testing Library, jsdom; Playwright smoke suite (Chromium, production build, all outside traffic stubbed or blocked) |
| Hosting | Vercel, deployed from `main` |

**Environment values:** `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` (public by design), and for the proxy only `TWITCH_CLIENT_ID` and `TWITCH_CLIENT_SECRET` (never with a `VITE_` prefix). All go in `.env.local` locally and in Vercel for the live site.

## 4. Status

| Phase | State | Summary |
|:--|:--|:--|
| 1: Compare APIs | ✅ Done | [rawg-vs-igdb.md](rawg-vs-igdb.md). Chosen: IGDB, with a Steam add-on later. |
| 2: Test the current app | ✅ Tasks done, for the owner to review | See the list below |
| 3: Migrate | 🟡 In progress (owner's go-ahead 2026-11-07) | See the list below |

**Phase 2 tasks**
- [x] Test setup, `CLAUDE.md`, this document
- [x] Store
- [x] Services
- [x] Hooks
- [x] Shared components
- [x] Auth and game components
- [x] Layout
- [x] Pages and `App`
- [x] Playwright smoke suite
- [x] Fix existing lint errors
- [x] Coverage report and hand-check list: [test-report.md](test-report.md). The hand checks themselves aren't done.

**Phase 3 tasks** (each ends with the owner's review and its own commit)
- [x] Twitch app and keys in `.env.local`; probe of real IGDB data ([results](rawg-vs-igdb.md#2-feature-by-feature))
- [x] Proxy: `/api/games`, `/api/games/:id`, `/api/genres` on Vercel, with token refresh, validation, caching and tests; runs under `npm run dev` too
- [x] App on the proxy: hooks, filters (platform, tag, store lists), RAWG key removed from the bundle. Saved games start fresh (owner's choice): old saves are cleared from each browser once, and the owner wipes the two tables.
- [x] Portrait cover cards: grid, list, loading placeholders, similar games and Recently Viewed; two per row on phones, the heart always visible on touch screens
- [x] Game details: click-to-load YouTube trailers, store links, similar games, no achievements
- [x] Offline rules for the new API and images: `/api` network-first with a 5 s timeout, IGDB images cache-first, both kept only as full answers; checked offline with the real service worker
- [ ] Saved games: RAWG ids to IGDB ids (owner backs up and runs the SQL)
- [x] Remove RAWG, rewrite README and docs

**Latest verification (2026-11-07):** 627 tests pass and 34 expected failures mark known problems. `npx tsc -b --noEmit`, the build and `npm run lint` are all clean, with no lint warnings. Coverage: `src/store` 99% of lines and 92% of branches; `src/hooks`, `src/services` and `src/components/layout` 100% of both; `src/components/shared` 98% and 93%; `src/components/auth` and `game` 100% and 93%; `src/pages` 100% of lines and 95% of branches. Of 403 deliberate breakages of this code, 396 were caught. The other seven: the two glow lines rewritten in `GameDetailsModal` can't run because of BUG-1; removing `video.muted = isMuted` changes nothing, as it only repeats the default; an empty-value guard in `AuthModal`'s typo check has no visible effect; `Sidebar`'s `if (error)` is BUG-2 itself, pinned by an expected failure; and two things jsdom can't show, which need a hand check: `CollectionsPage` attaching scrollbars to the page body, and `App`'s `reducedMotion="user"`. Smoke suite (`npm run test:e2e`): 18 pass and 1 expected failure (BUG-19) at 1440 px and 375 px, plus offline with the real service worker. All 18 deliberate breakages of the built app were caught, including a trial fix for each of the three bugs. One first attempt, widening the modal, broke nothing because its flex parent shrinks it, so it was replaced by one that really overflows. Live site: still the old RAWG version, with no game data, until `main` is updated.

**Test skips**
| Skipped | Why |
|:--|:--|
| `useAppDispatch`, `useAppSelector` | Thin wrappers |
| `main.tsx` | Start-up only; the smoke suite covers it |
| `api/games/*.ts`, `api/genres.ts` | One-line wrappers around the tested router |
| `localApi` in `vite.config.ts` | Thin adapter; checked by hand against live IGDB. The smoke suite covers it once the app uses the proxy. |
| `types/`, `vite-env.d.ts` | No runtime code |

## 5. Action needed from the owner

1. **Finish the Row Level Security check.** The read-only SQL in [rawg-vs-igdb.md, section 5](rawg-vs-igdb.md#5-report-only-items) came back safe on 2026-11-07. One real test remains: sign in as two different users and confirm neither sees the other's rows.
2. **Before Phase 3:** create the Twitch app, so a short script can test real IGDB data. Exact steps come at that point.

## 6. Open issues and known limits

| # | Issue | Impact | Plan |
|:--|:--|:--|:--|
| 4 | `collections` and `favorites` are read with no user filter, so Row Level Security alone keeps lists private. The owner's SQL (2026-11-07) shows it on, with `auth.uid() = user_id` policies for select, insert and delete. | Lists look private; not yet tested with two real users | Owner runs the two-user test |
| 5 | A game deleted on one device comes back from another at sign-in. Confirmed by `it.fails('ISSUE-5…')` in both slice tests. | Deletions don't stick across devices | Owner to decide; needs deletion records or merging guest items only |

**Known bugs** (each gets an `it.fails` test as Phase 2 reaches it, and none is fixed without the owner's OK. "Pending" means found by reading the code and not yet proved by a test.)

| Bug | What happens | Where | Test |
|:--|:--|:--|:--|
| BUG-1 | Modal glow never works. Three causes: colorthief 3 has no class and the error is swallowed; the colour is built as `rgb(r, g, b)88`, which isn't valid CSS; and the image lacked `crossorigin`, now fixed for the offline cache. | `GameDetailsModal` | ✅ Proved; two causes remain |
| BUG-2 | The whole sidebar, including My Collection, disappears on an API error | `Sidebar` | ✅ Fixed; see section 9 |
| BUG-3 | The previous game's trailers, store links and similar games stay until new ones arrive | `useGameTrailers`, `useGameStores`, `useSimilarGames` | ✅ Fixed; see section 9 |
| BUG-4 | Trailers are hidden when a game has no screenshots | `GameDetailsModal` | ✅ Fixed; see section 9 |
| BUG-5 | Similar-game clicks do nothing on the Collections page | `CollectionsPage` | ✅ Proved |
| BUG-6 | The adult filter covers the grid only, not deep links or similar games | `useGames`, `GameDetailsModal`, `SimilarGamesCarousel` | ✅ Fixed; see section 9 |
| BUG-7 | A failed merge upload is only logged, while the item looks saved. The item isn't lost: the next merge retries it. | both list slices | ✅ Proved |
| BUG-8 | A failed add or remove shows the user nothing. The store does report the failure; the buttons ignore it. | `CollectionButton`, `FavoriteButton` | ✅ Proved |
| BUG-9 | Merges running at once upload the same game twice, and duplicate cloud rows then show as duplicate cards. A magic-link sign-in looks able to trigger this: `App` merges on every auth event with a session, and Supabase's code sends both `INITIAL_SESSION` and `SIGNED_IN`. **The real database blocks this:** the owner's SQL (2026-11-07) shows unique constraints on both tables and no duplicate rows. The real cost is repeated merges, and a rejected upload that is only logged (BUG-7). The test fake has no unique constraints, so it shows duplicates the real database wouldn't. | both list slices, `App` | ✅ Proved in the store and in `App` (two events start two merges and save each game twice; a token refresh merges again) with the fake; not reproduced against real Supabase |
| BUG-10 | `fetchFavorites` with nobody signed in wipes local favorites, while `fetchCollections` keeps its lists. `App` never calls it that way today, so it can't happen yet. | `favoritesSlice` | ✅ Proved |
| BUG-11 | On a non-RAWG URL, the crop helper returns a broken address (`httpscrop/600/400/://images…`). Harmless today, but **every IGDB image would break**. | `image-url` | ✅ Fixed; see section 9 |
| BUG-12 | After one failed request, the error stays even when a later request succeeds. Sections that hide on error stay hidden for later games until the modal closes. | `useData`, `useGameTrailers`, `useGameStores`, `useSimilarGames` | ✅ Fixed; see section 9 |
| BUG-13 | Changing a filter after scrolling first requested page 2 of the new filter, aborted it, then requested page 1. | `useGames` | ✅ Fixed by the lint work; see section 9 |
| BUG-14 | The adult filter hides innocent games: "Command & Conquer: Yuri's Revenge" is hidden because of the word "yuri". | `useGames` | ✅ Proved |
| BUG-15 | With no genre cache, genres are requested twice. | `useGenres` | ✅ Fixed; see section 9 |
| BUG-16 | The video player's mute, play and fullscreen buttons and the sign-in modal's close button have no names, so screen readers can't announce them. | `CustomVideoPlayer`, `AuthModal` | ✅ Proved |
| BUG-17 | Pressing Enter on the progress bar sets the video time to an invalid value, because the key handler reuses the mouse handler. | `CustomVideoPlayer` | ✅ Fixed; see section 9 |
| BUG-18 | A broken image keeps its loading animation forever. It will matter more with IGDB, which removes replaced images after 30 days. | `ProgressiveImage` | ✅ Proved |
| BUG-19 | Mouse-wheel scrolling on Recently Viewed logs "Unable to preventDefault inside passive event listener", because React's wheel listeners are passive. Whether the page scrolls too isn't tested. | `RecentlyViewed` | ✅ Proved in Chromium by the smoke suite |
| BUG-20 | Every email typo gets "Did you mean @gmail.com?", even `@hotmai.com` or `@yahoo.co`, because the suggestion ignores the typo table's right answer. | `AuthModal` | ✅ Proved |
| BUG-21 | If the adult filter hides a whole page, the grid says "No games found" and stops, though more pages exist. The scroll trigger only renders when games are showing. | `GameGrid` | ✅ Proved |
| BUG-22 | A similar game scored 0 shows a stray "0". | `SimilarGamesCarousel` | ✅ Proved |
| BUG-23 | Escape closes the modal only when its backdrop has focus, not wherever focus is. | `GameDetailsModal` | ✅ Proved |
| BUG-24 | An empty developer list shows a blank instead of "—". The same code handles publishers. | `GameDetailsModal` | ✅ Proved for developers |
| BUG-25 | Phones couldn't reach sign-in or sign-out. The whole account area is `hidden md:flex`, and the mobile menu has no replacement. A signed-out phone user can only sign in from the banner on `/collection`, which appears once they've saved a game. A signed-in phone user can't sign out at all. | `Navbar` | ✅ Fixed; see section 9 |
| BUG-26 | `Layout` mounts two `Sidebar`s at once (mobile and desktop, one hidden by CSS), each asking for genres, so every page load makes at least two requests. `HomePage` asks as well, making three. | `Layout`, `HomePage` | ✅ Fixed; see section 9 |
| BUG-27 | A genre page's title stays on "Loading..." forever if the genre names fail to load or the genre doesn't exist. The browser tab title says it too. | `HomePage` | ✅ Fixed; see section 9 |
| BUG-28 | Recently Viewed only records games opened from `HomePage`'s grid or modal, not from a deep link or the Developer, Publisher or Collections pages. The owner may consider some of this intended. | `HomePage`, `DeveloperPage`, `PublisherPage`, `CollectionsPage` | ✅ Proved |
| BUG-29 | Opening a game from Recently Viewed doesn't set `?gameId=` and doesn't move the game to the front. | `HomePage` | ✅ Proved |
| BUG-30 | The Collections page has no deep link: `?gameId=` is ignored, and opening a game doesn't set the URL. The Share button is unaffected, because it always links to the home page. | `CollectionsPage` | ✅ Proved |
| BUG-31 | An unknown URL shows a blank screen with no navbar and no way back. There is no catch-all route. | `App` | ✅ Proved |
| BUG-32 | The expired-link message's dismiss button has no name, so screen readers can't announce it. | `App` | ✅ Proved |
| BUG-33 | **On a first visit, with no genres saved in the browser, only the first `useGenres` to get a response shows them.** The others find the list already saved, treat it as unchanged and never update. In order of requests, that leaves the visible desktop sidebar empty and a genre page's title on "Loading..." until a reload. | `useGenres` | ✅ Fixed; see section 9 |

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
| 2026-11-07 | **Portrait cover cards** | IGDB has a cover for every game, but a wide image for only 24% of lesser-known ones. |
| 2026-11-07 | **Trailers: thumbnail, then YouTube on click** | IGDB has YouTube ids only. Nothing loads from YouTube until the visitor asks; `youtube-nocookie.com` player. |
| 2026-11-07 | **Genres: IGDB's 23 plus Action** | Action is a theme in IGDB but the most popular category; keeps `/genre/action` working. |

## 9. Fix history

| Date | Fixed | How |
|:--|:--|:--|
| 2026-11-07 | BUG-4, BUG-17 | Trailers moved to their own section with YouTube's player; the old video player and its bug are gone. |
| 2026-11-07 | BUG-3, BUG-6, BUG-11, BUG-12 | Moving onto the proxy: one details request replaces five hooks (BUG-3, BUG-12), the proxy filters adult games everywhere (BUG-6), and the crop helper only touches RAWG URLs (BUG-11). |
| 2026-11-07 | BUG-25 | Phones get the account at the top of the slide-out menu: a labelled Sign In card for guests, or the email and a Sign Out button (`MobileAccount`). The phone header keeps its original menu, logo and search, so it stays uncluttered down to 320 px. From 768 px the navbar shows the account as before. |
| 2026-11-07 | BUG-13, a side effect of the lint fixes | `useGames` now resets while rendering, not in an effect after the request has started. The owner reviews this with the lint task. |
| 2026-11-07 | BUG-2, BUG-15, BUG-26, BUG-27, BUG-33 | `useGenres` shares one request per page load between both sidebars and the home page, so every user gets the genres (33) and they're asked for once (15, 26); a failed request is forgotten so the next user retries. The per-hook abort on unmount went with it: the shared request isn't cancelled, which costs nothing for one small list. The sidebar keeps My Collection and All Games on an error and says "Genres couldn't load." (2). A genre title falls back to the address when the names fail to load and says "Unknown Genre" for a slug that isn't one (27). |
