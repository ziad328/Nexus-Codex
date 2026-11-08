# Nexus Codex: Project Overview

The one living document for this project: what it's for, what it must do, how it's built, where it stands and what comes next. Update it whenever one of those changes. Day-to-day rules are in [../CLAUDE.md](../CLAUDE.md). Older history is in git.

_Last updated: 2026-11-08 (docs tidied: the RAWG-vs-IGDB research and the Phase 2 test report were folded in here and removed. Before that: the IGDB move, the gallery, the trailer viewer and BUG-1 to BUG-35 fixed, all on 2026-11-07)._

---

## 1. Vision

A fast, good-looking place to discover games and keep a personal library, for guests and signed-in users, including offline. A solo project, currently non-commercial.

Live: https://nexus-codex-lib.vercel.app. Repo: https://github.com/ziad328/Nexus-Codex.

## 2. Requirements

**Must hold at all times**
1. **User data is safe:** favorites and lists are never lost, duplicated or shown as the wrong game.
2. **No secret in the browser bundle.** The IGDB keys live only in the proxy.
3. **Works at 1440 px and 375 px**, with no sideways scroll.
4. **Offline:** saved lists and already-seen data still show; everything else gets a clear message.
5. **Quality bar:** tests, `npx tsc -b --noEmit`, `npm run build` and `npm run lint` all pass.

**Features**
- **Discovery:** paged grid with infinite scroll, genre sidebar, platform, tag and store filters, debounced search, developer and publisher pages, grid/list toggle.
- **Game details modal:** description, release date, developers, publishers, a screenshot gallery (arrows, counter, thumbnails, arrow keys, swipe, click to enlarge), trailers in a full-screen player, store links, website and Reddit links, similar games, glow from the cover, `?game=` deep links on every page, Share.
- **Library:** favorites and four lists (Playing Now, Backlog, Beaten, Wishlist), guest lists merged to the cloud on sign-in, Recently Viewed (last 10, every game opened in the modal).
- **Sign-in:** magic link with email validation and typo hints, expired-link message.
- **App:** adult-content filter, not-found page, PWA that updates itself, offline and error states, SEO tags.

## 3. Architecture

| Layer | Choice |
|:--|:--|
| UI | React 19, TypeScript, Tailwind v4, Framer Motion, OverlayScrollbars |
| Routing | React Router 7 |
| State | Redux Toolkit. Redux Persist saves `favorites`, `collections`, and from `ui` only `viewMode` and `recentlyViewed`. |
| Game data | IGDB, through our own GET-only proxy in `api/` (Vercel functions, also served by `npm run dev`). The browser holds no key. |
| Accounts and lists | Supabase: magic-link auth, `favorites` and `collections` tables. The schema isn't in the repo. |
| PWA | `vite-plugin-pwa` (Workbox), `autoUpdate`: IGDB images cache-first, `/api` network-first with a 5 s timeout |
| Forms | Formik + Yup |
| Tests | Vitest, React Testing Library, jsdom; Playwright smoke suite (Chromium, production build, all outside traffic stubbed or blocked) |
| Hosting | Vercel, deployed from `main` |

**Environment values:** `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` (public by design), and for the proxy only `TWITCH_CLIENT_ID` and `TWITCH_CLIENT_SECRET` (never with a `VITE_` prefix). All go in `.env.local` locally and in Vercel for the live site.

**IGDB facts that shaped the code** (measured 2026-11-07 on 100 games)
- Every game has a portrait cover; only 24% of lesser-known games have a wide image, hence cover cards.
- Trailers are YouTube ids only. Critic scores exist for 98% of popular games but 32% of lesser-known ones.
- There are no achievements. "Action" is a theme in IGDB, not a genre, so the proxy adds it to the genre list.
- Company filters need the company's id; filtering by slug times out, so the proxy looks the slug up first.
- Adult games carry the "Erotic" theme, which the proxy filters out of every answer.
- The Twitch token lasts about 58 days; the proxy renews it.

**Steam facts** (measured 2026-11-08 on 20 games; endpoints are undocumented and may change)
- `store.steampowered.com/api/appdetails` (no key, ~0.4 s, one app per call) gives Metacritic for all 6 big games but only 6 of 14 lesser-known ones, and an achievement count with 10 highlighted names and icons for all 20.
- Its trailers are DASH/HLS streams only. The old MP4 URLs still work for older uploads but 404 for new ones, so playable trailers would need `hls.js`.
- Global unlock percentages work without a key but give only internal names; display names need a keyed endpoint.
- No published rate limit; others report about 200 calls per 5 minutes per IP. The CDN caching of `/api/games/:id` keeps calls low.

## 4. Status

| Phase | State |
|:--|:--|
| 1: Compare APIs | ✅ Done. IGDB chosen, with a Steam add-on later. |
| 2: Test the app | ✅ Done: unit tests for every layer, Playwright smoke suite, lint clean. |
| 3: Move to IGDB | ✅ Done and live. Saved games started fresh (owner's choice) instead of mapping RAWG ids. |
| Steam add-on | ✅ Metacritic score and achievements in the details modal, through `/api/games/:id`. Steam trailers dropped (owner's choice); trailers stay YouTube from IGDB. |

**Latest verification (2026-11-08):** 687 tests pass, and 2 expected failures pin ISSUE-5. `npx tsc -b --noEmit`, the build and `npm run lint` are clean. Coverage: 99% of lines and 96% of branches overall (`src/utils` shows 0% only because tests always use the fake Supabase). Smoke suite (`npm run test:e2e`): 19 of 19 pass at 1440 px and 375 px, plus offline with the real service worker. Every bigger fix was checked by breaking the code on purpose; the only miss is a guard `App` itself never triggers (see BUG-9 in section 9).

**Test skips**
| Skipped | Why |
|:--|:--|
| `useAppDispatch`, `useAppSelector` | Thin wrappers |
| `main.tsx` | Start-up and service-worker registration only; the smoke suite covers it |
| `api/games/*.ts`, `api/genres.ts` | One-line wrappers around the tested router |
| `localApi` in `vite.config.ts` | Thin adapter; the smoke suite and `npm run dev` use it |
| `types/`, `vite-env.d.ts` | No runtime code |

## 5. Action needed from the owner

1. **Two-user privacy test.** Save a game as user A, then sign in as user B in a private window: B must not see it. The read-only check below came back safe on 2026-11-07 (RLS on, `auth.uid() = user_id` policies for select, insert and delete, unique constraints, no duplicate rows); only the real two-user test remains.
   ```sql
   select relname, relrowsecurity from pg_class
   where oid in ('public.collections'::regclass, 'public.favorites'::regclass);
   select tablename, policyname, cmd, qual, with_check from pg_policies
   where tablename in ('collections', 'favorites');
   ```
2. **Decide ISSUE-5** (below).
3. **Confirm BUG-35 on the live site** after the next deploy: a browser that had the previous version should switch to the new one on its own.

## 6. Open issues and known limits

| # | Issue | Impact | Plan |
|:--|:--|:--|:--|
| 4 | `collections` and `favorites` are read with no user filter, so Row Level Security alone keeps lists private. | Lists look private; not yet tested with two real users | Owner runs the two-user test |
| 5 | A game deleted on one device comes back from another at sign-in, because the merge uploads every local game missing from the cloud. Pinned by `it.fails('ISSUE-5…')` in both slice tests. | Deletions don't stick across devices | Recommended: a `deleted_at` column on both tables; removing sets it, the merge skips such games, re-adding clears it. Fits "never delete rows". Simpler option: upload only games saved while signed out. Owner decides and runs the SQL. |

**Known bugs:** none open. New ones get an `it.fails('BUG-n: …')` test and a row here.

| Bug | What happened | Where | Status |
|:--|:--|:--|:--|
| BUG-1 | Modal glow never worked: colorthief 3 used as a class, and an invalid colour string. | `GameDetailsModal` | ✅ Fixed |
| BUG-2 | The whole sidebar, including My Collection, disappeared on an API error. | `Sidebar` | ✅ Fixed |
| BUG-3 | The previous game's trailers, store links and similar games stayed until new ones arrived. | old hooks | ✅ Fixed |
| BUG-4 | Trailers were hidden when a game had no screenshots. | `GameDetailsModal` | ✅ Fixed |
| BUG-5 | Similar-game clicks did nothing on the Collections page. | `CollectionsPage` | ✅ Fixed |
| BUG-6 | The adult filter covered the grid only, not deep links or similar games. | proxy | ✅ Fixed |
| BUG-7 | A failed merge upload was only logged, while the game looked saved. | both list slices | ✅ Fixed |
| BUG-8 | A failed add or remove showed the user nothing. | `CollectionButton`, `FavoriteButton` | ✅ Fixed |
| BUG-9 | Merges started on every auth event and could run at once, uploading a game twice. | both list slices, `App` | ✅ Fixed (fake Supabase only; the real tables have unique constraints) |
| BUG-10 | `fetchFavorites` with nobody signed in wiped local favorites. | `favoritesSlice` | ✅ Fixed |
| BUG-11 | The image crop helper broke non-RAWG URLs. | removed | ✅ Fixed |
| BUG-12 | One failed request left its error showing after later successes. | old hooks | ✅ Fixed |
| BUG-13 | Changing a filter after scrolling requested page 2 of the new filter first. | `useGames` | ✅ Fixed |
| BUG-14 | The adult name filter hid innocent games such as "Yuri's Revenge". | `useGames` | ✅ Fixed |
| BUG-15 | With no genre cache, genres were requested twice. | `useGenres` | ✅ Fixed |
| BUG-16 | Unnamed buttons: the old video player's controls and the sign-in close button. | `AuthModal` | ✅ Fixed |
| BUG-17 | Enter on the old video player's progress bar set an invalid time. | removed | ✅ Fixed |
| BUG-18 | A broken image kept its loading shimmer forever. | `ProgressiveImage` | ✅ Fixed |
| BUG-19 | Wheel-scrolling Recently Viewed logged a passive-listener error. | `RecentlyViewed` | ✅ Fixed |
| BUG-20 | Every email typo got "Did you mean @gmail.com?". | `AuthModal` | ✅ Fixed |
| BUG-21 | A page emptied by the adult filter ended infinite scroll. | `GameGrid` | ✅ Fixed |
| BUG-22 | A similar game scored 0 showed a stray "0". | `SimilarGamesCarousel` | ✅ Fixed |
| BUG-23 | Escape closed the modal only when its backdrop had focus. | `GameDetailsModal` | ✅ Fixed |
| BUG-24 | An empty developer or publisher list showed a blank instead of "—". | `GameDetailsModal` | ✅ Fixed |
| BUG-25 | Phones couldn't reach sign-in or sign-out. | `Navbar` | ✅ Fixed |
| BUG-26 | Every page load asked for genres two or three times. | `Layout`, `HomePage` | ✅ Fixed |
| BUG-27 | A genre title stuck on "Loading..." when names failed or the genre didn't exist. | `HomePage` | ✅ Fixed |
| BUG-28 | Recently Viewed only recorded games opened from the home grid. | pages | ✅ Fixed |
| BUG-29 | Opening from Recently Viewed didn't set the URL or move the game to the front. | `HomePage` | ✅ Fixed |
| BUG-30 | The Collections page had no `?game=` deep link. | `CollectionsPage` | ✅ Fixed |
| BUG-31 | An unknown URL showed a blank screen. | `App` | ✅ Fixed |
| BUG-32 | The expired-link message's dismiss button had no name. | `App` | ✅ Fixed |
| BUG-33 | On a first visit only one `useGenres` user got genres, leaving the desktop sidebar empty. | `useGenres` | ✅ Fixed |
| BUG-34 | Trailers couldn't be controlled: clicks never reached the YouTube player inside the modal's rounded corners. | `YouTubeTrailer` | ✅ Fixed |
| BUG-35 | After a deploy, visitors stayed on the old app until they cleared site data; "Reload & Update" did nothing. | `vite.config.ts` | ✅ Fixed; to confirm live |

## 7. Roadmap

1. ISSUE-5, once the owner decides.

**Hand checks** (tests can't judge these; use a production build: `npm run build`, then `npm run preview`)

| Check | How | Pass looks like |
|:--|:--|:--|
| Two-user privacy | See section 5 | B never sees A's games |
| Real magic link | Sign in with your own email on the live site | Email arrives, the link signs you in, guest games merge once |
| Self-updating PWA | Install it, deploy a change, reopen it | The new version loads by itself (BUG-35) |
| Motion and reduced motion | Scroll, open and close modals, then repeat with the system's reduce-motion setting | Smooth; reduced when asked; nothing breaks |
| Other browsers and a real phone | Main flows in Safari and Firefox, and on a phone (swipe the gallery and Recently Viewed) | Same behaviour; the smoke suite is Chromium only |
| Screen reader | Search, a card, the modal, the viewer and sign-in with NVDA or VoiceOver | Everything is announced and reachable |
| Share previews | Paste a `?game=` link into a chat app | Shows the game's title and image |

## 8. Key decisions

| Date | Decision | Why |
|:--|:--|:--|
| 2026-11-07 | **IGDB as the main API** | RAWG is unreachable. IGDB is free, documented, and has the data for the app's filters. No alternative checked (MobyGames, TheGamesDB, GameBrain, Steam alone) beat it. |
| 2026-11-07 | **GET-only proxy with fixed routes** | Keeps secrets off the browser and allows CDN and offline caching. Never forwards raw query text. |
| 2026-11-07 | **Saved games start fresh** | Owner's choice over mapping RAWG ids to IGDB ids. A RAWG id must never be read as an IGDB id. |
| 2026-11-07 | **Playwright smoke suite** | jsdom can't see CSS, layout or a real service worker. |
| 2026-11-07 | **Commit directly on `dev`** | Owner's instruction. The owner merges into `main`. |
| 2026-11-07 | **Portrait cover cards** | IGDB has a cover for every game, but a wide image for only 24% of lesser-known ones. |
| 2026-11-08 | **No Steam trailers** | Owner's choice. Steam now serves only HLS/DASH streams, which would need `hls.js`; IGDB's YouTube trailers are enough. |
| 2026-11-08 | **Steam extras inside `/api/games/:id`** | One request for the modal, cached with the game. Steam gets 2.5 s; any failure or odd field drops the extras and the modal looks as before. The app id comes from the game's Steam store link. A Steam miss is cached with the game for up to a day. |
| 2026-11-07 | **Trailers: thumbnail, then YouTube on click** | Nothing loads from YouTube until the visitor asks; `youtube-nocookie.com` player. |
| 2026-11-07 | **Trailers play in a full-screen viewer** | Chrome drops clicks into a cross-origin iframe inside any rounded clip, and the modal is rounded. A bigger player is also nicer. |
| 2026-11-07 | **Genres: IGDB's 23 plus Action** | Action is a theme in IGDB but the most popular category; keeps `/genre/action` working. |
| 2026-11-07 | **Service worker updates itself** | The update prompt left visitors stuck on the old app (BUG-35). |

## 9. Fix history

| Date | Fixed | How |
|:--|:--|:--|
| 2026-11-07 | BUG-4, BUG-17 | Trailers moved to their own section with YouTube's player; the old video player and its bug are gone. |
| 2026-11-07 | BUG-3, BUG-6, BUG-11, BUG-12 | Moving onto the proxy: one details request replaces five hooks (3, 12), the proxy filters adult games everywhere (6), and the crop helper only touches RAWG URLs (11). |
| 2026-11-07 | BUG-25 | Phones get the account at the top of the slide-out menu (`MobileAccount`). |
| 2026-11-07 | BUG-13 | `useGames` resets while rendering, not in an effect after the request has started. |
| 2026-11-07 | BUG-2, BUG-15, BUG-26, BUG-27, BUG-33 | `useGenres` shares one request per page load, so every user gets the genres (33) and they're asked for once (15, 26); a failed request is retried by the next user. The shared request isn't cancelled on unmount. The sidebar keeps My Collection and All Games on an error and says "Genres couldn't load." (2). A genre title falls back to the address, or says "Unknown Genre" (27). |
| 2026-11-07 | BUG-5, BUG-28, BUG-29, BUG-30, BUG-31 | `useGameParam` keeps the open game in `?game=` on every page (5, 29, 30). The modal adds each loaded game to Recently Viewed, moving it to the front (28, 29). Unknown URLs get a not-found page (31). |
| 2026-11-07 | BUG-1, BUG-16, BUG-18, BUG-20, BUG-22, BUG-23, BUG-24, BUG-32 | Glow from colorthief 3's `getColor()` as `rgba(…, 0.53)` (1). Named buttons: "Close sign-in", "Dismiss" (16, 32). A broken image ends its shimmer (18). The typo hint names the intended domain (20). `CriticScore` handles 0 (22). Escape closes the modal from anywhere (23). Empty lists show "—" (24). |
| 2026-11-07 | BUG-14, BUG-19, BUG-21 | The name filter keeps only words with no innocent meaning, and the unused tag check went (14). Recently Viewed's wheel listener is non-passive (19). The scroll trigger stays while more pages exist (21). |
| 2026-11-07 | BUG-7, BUG-8, BUG-9, BUG-10 | A merge with nobody signed in changes nothing (10). A failed upload rejects the merge, keeps the games and shows "Sync Failed"; the next merge retries (7). Buttons say "Couldn't save…" on failure (8). One merge at a time, duplicate cloud rows show once, and `App` merges once per signed-in user (9). One untestable guard: `App` ignores a merge skipped because one is running. |
| 2026-11-07 | BUG-34 | Trailers play in a full-screen `Lightbox` on the page body, outside every rounded clip; the same viewer enlarges screenshots at IGDB's 1080p size. Escape closes the viewer only. |
| 2026-11-07 | BUG-35 | `autoUpdate`: a new service worker installs, takes over and reloads the page once. The update prompt was removed. Not yet confirmed on the live site. |
