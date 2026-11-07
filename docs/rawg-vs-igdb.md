# RAWG vs IGDB

Phase 1 report, checked 2026-11-07. No application code changed.

**How far to trust this.** I have no IGDB credentials, so I could not run any logged-in IGDB query. "Match" below means what IGDB's documentation says it offers, not how much data real games have. Anything marked **Probe** needs one read-only query once credentials exist (see [section 7](#7-not-verified)). RAWG's live site and API are down, so RAWG terms come from a Wayback copy of `rawg.io/apidocs` dated 2026-10-21.

**Verdict: migrate.** RAWG's API has been unreachable in every check today, and IGDB is free and documented. Most features map across. Achievements are lost, trailers change to YouTube, and saved lists need a careful id migration.

---

## 1. Overview

| | RAWG | IGDB |
|:--|:--|:--|
| **Status today (live test)** | `api.rawg.io` and `rawg.io` both answer **HTTP 522** after about 20 s. `media.rawg.io` images still answer 200. Latest Wayback captures: API 200 on 2026-09-24, site 200 on 2026-10-23, so this looks recent, but a 522 only says the origin didn't respond, not why or for how long. | `api.igdb.com` answers **401** without a token, which is the expected response. Docs and `images.igdb.com` answer 200. |
| **Live app today** | Shows "Failed to connect to Nexus / Network Error". Skeleton cards show while the request hangs. | n/a |
| **Auth** | API key as a query parameter. Today it ships in the browser: a 32-character key is in the live bundle. | Twitch app with 2FA, then Client ID + Secret → app token. Token lasts about 60 days, with **at most 25 active per app**; going over disables older tokens. No refresh token, so you request a new one. |
| **Price** | Free: 20,000 requests/month. Business: $149/month for 50,000. | Free, with no monthly cap stated. |
| **Commercial terms** | The pricing table says Free is "non-commercial projects only", while the terms allow commercial use under 100,000 monthly users. The two conflict. | Docs say free for non-commercial use under the Twitch Developer Service Agreement. Monetized products need a partnership (`partner@igdb.com`). |
| **Attribution** | **Required:** an active link to RAWG on every page using its data. The app has none today (`grep` finds no RAWG credit in `src/`). | Required only under the commercial partnership: visible and in a fixed place. |
| **Rate limits** | Monthly quota only. | **4 requests/second, 8 open at once.** Over that: HTTP 429. |
| **Browser / CORS** | Called directly from the browser today. | **Blocked by design.** Docs say browser calls will not work and recommend a backend proxy. |
| **Request style** | `GET` with query parameters. | `POST` with a text query (APICalypse) in the body. Max 500 items per request, default 10. |
| **Local caching** | "No data redistribution" (other caching not addressed). | Explicitly allowed and preferred. |
| **Coverage** | Claims 500,000+ games, 58,000 tags. | No figure in the docs. **Probe:** `games/count`. |
| **Images** | `media.rawg.io`, CORS `*`. Landscape background art, cropped by editing the URL. | `images.igdb.com`, CORS `*`, cached for a year. Built from `image_id` + a size preset. Covers are **portrait**. Replaced images are removed after 30 days. |

Hosting note: Vercel Hobby is non-commercial only too, so "non-commercial" must stay true for both. Hobby includes 1,000,000 function invocations, 4 hours of active CPU and 1 WAF rate-limit rule. I could not read the Twitch agreement itself (the page came back without its body); read it when you create the app.

---

## 2. Features

**Full** = same result. **Partial** = works differently or with less data. **None** = lost.

### Discovery

| Feature | RAWG today | IGDB equivalent | Match | Work |
|:--|:--|:--|:--|:--|
| Paged grid, infinite scroll | `/games?page=` + `next` | `limit` + `offset`. There is no `next`, so ask for 21 and show 20. Keep the observer and abort logic. | Full | Proxy route. **Probe:** deep offsets. |
| Default order | RAWG's own | None by default; order by rating count, drop editions (`version_parent = null`) | Partial | Tune so the home page isn't full of obscure games. **Probe.** |
| Genre sidebar + cache | `/genres` | `genres` has `name` and `slug` but **no image** | Partial | Local icon per genre, new cache key. |
| Genre names | `action`, `rpg`… | Different list. From memory, "Action" is a theme there, not a genre. | Partial | **Probe.** Redirect old `/genre/*` URLs. |
| Platform filter | `/platforms/lists/parents` | `platforms` are individual consoles; `platform_families` is too narrow | Partial | Small local table: parent → platform ids. Docs confirm PC 6, PS4 48, Xbox One 49, Switch 130; **Probe** the rest. |
| Tag filter | `/tags?page_size=20` | No single equivalent: `keywords` (noisy), `themes`, `game_modes`, `player_perspectives` | Partial | Curated list of about 20 from modes, perspectives and themes. Same dropdown. |
| Store filter | `/stores`, `stores=` | `external_games.external_game_source` or `websites.type` | Partial | Local store list. **Nintendo isn't in the documented sources**. **Probe:** filter + coverage. |
| Debounced search | `search=` | `search "x";` with `where` allowed, sorted by similarity | Full | Escape quotes in the proxy (injection risk). `SearchInput` unchanged. |
| Developer / publisher pages | `developers=slug` | `companies` by `slug`, then its `developed` / `published` game ids | Full | Two IGDB calls. Don't filter through `involved_companies`: two conditions may match different rows. |
| Ordering | `sortOrder` param | `sort` works | Full | **No UI sets it today** (only the type and `useGames` mention it), so only the default order is needed. |

### Game cards

| Feature | RAWG today | IGDB equivalent | Match | Work |
|:--|:--|:--|:--|:--|
| Card image | `background_image` (landscape) | `artworks`, then `screenshots`, then `cover` | Partial | Prefer landscape so 16:9-ish cards don't crop a portrait cover. Some games only have a cover. |
| Crop helper | `services/image-url.ts` | Size presets (`t_screenshot_big`, `t_cover_big`…) | Full | **Must change:** on a non-RAWG URL, `indexOf('media/')` is -1 and it produces a broken URL. Keep the crop for legacy RAWG images only. |
| Platform icons | `parent_platforms[].platform.slug` | Mapped by the same table as the filter | Full | Adapter outputs today's slugs, so `PlatformIconList` is untouched. |
| Critic score | `metacritic` | `aggregated_rating` ("external critic scores"), a decimal | Partial | Round it. **It isn't Metacritic**, so numbers will differ. **Probe** coverage. Hidden when absent, as today. |

### Game details modal

| Feature | RAWG today | IGDB equivalent | Match | Work |
|:--|:--|:--|:--|:--|
| Description | `description_raw` | `summary`, plus `storyline` | Partial | Often shorter. |
| Release date | `released` | `first_release_date` (Unix) | Full | Format in UTC. |
| Developers, publishers | arrays | `involved_companies.company` + `developer` / `publisher` flags | Full | Adapter. |
| Screenshots | `/games/:id/screenshots` | `screenshots.image_id` | Full | Adapter. |
| Trailers | `/movies`, MP4 URLs | `videos.video_id`: **YouTube ids only** | Partial | `CustomVideoPlayer` can't play these. See [section 3](#3-recommendation). |
| Where to buy | `/stores` + store join | `websites` (Steam, itch, Epic, GOG, iPhone, iPad, Android), `external_games.url` | Partial | Merge both. PlayStation and Xbox rely on `external_games`; Nintendo is missing. **Probe.** |
| Achievements | `/achievements` | **No endpoint** (the word isn't in the docs) | **None** | See [section 3](#3-recommendation). |
| Website, Reddit | `website`, `reddit_url` | `websites` types official (1), reddit (14) | Full | **Probe** coverage. Type ids are from the older enum. |
| You Might Also Like | `/game-series` (same series) | `similar_games` | Full | Different results: similar games rather than sequels. Probably better for the title. |
| Glow colour | colorthief | Images allow CORS | Full | **Broken today**, see [section 6](#6-other-findings). |
| `?gameId=` + Share | RAWG id | IGDB ids are different | Partial | See [section 4](#4-risks-answered). |

### Library, sign-in, app

| Feature | Depends on the API? | Match | Work |
|:--|:--|:--|:--|
| Favorites + 4 lists | Stores RAWG `game_id`, `slug`, `background_image`, `metacritic`, `parent_platforms` | Partial | Id migration, [section 4](#4-risks-answered). |
| Guest lists + merge | Same, in localStorage | Partial | Persist migration; merge key includes the id's source. |
| Recently Viewed | Same, in localStorage | Partial | Same migration. |
| Magic link, typo check, expired link | No | Full | None. |
| Adult filter | Client regex on names, slugs and tags | Better | Server filter `themes != (42)`, which the docs recommend; keep the name regex as a second layer. |
| PWA rules | `media.rawg.io`, `api.rawg.io` | Partial | New rules, [section 4](#4-risks-answered). Keep the RAWG image rule while legacy items exist. |
| Update prompt, offline, error states | No, except error text | Full | Keep. |
| SEO tags | Name, description, image | Full | Adapter. Crawlers that don't run JS never saw per-game tags anyway. |

Found in the code beyond your list, no API impact: grid/list toggle, per-route search text, Collections search and count badge, scroll-to-top pill.

---

## 3. Recommendation

**Migrate.** One side benefit: a modal makes **6 requests today** and would make **1**, because IGDB can return everything in one expanded query.

### Other APIs checked

No other single API is a better replacement. IGDB is the only working option here with a free, documented, cross-platform catalogue and every filter type the app needs.

| API | Status today | Good at | Why it isn't the main API |
|:--|:--|:--|:--|
| **Steam store** (`appdetails`, `storesearch`) | Works, no key | Landscape art, Metacritic, 10 highlighted achievements, playable HLS video | Steam only, so no console exclusives. **Undocumented** endpoints; other developers report 429s around 200 calls per 5 minutes. |
| **GameBrain** | API answers; status page failed to load | 800,000+ games claimed, store prices, critic score, WebM video | Free is **50 tokens/day**, about 25 uncached grid pages. $19/month for 500. Data may be cached for only **24 hours**, which conflicts with saved lists and offline use. It can end access for products offering the same experience as its own, and a discovery app risks that. No publisher field or achievements. |
| **Giant Bomb** | **Game API unavailable** per its own page | | Being rebuilt, no date given. |
| **MobyGames** | Answers 401 without a key | History, credits | Third-party docs say keys stopped being free in September 2024, about 360 requests/hour. Too slow for a grid. Official pricing page blocked me. |
| **TheGamesDB** | Answers | Box art, retro | Monthly allowance per key; thin metadata per a comparison page. Docs unreadable. |
| **Wikidata** | Works | **Id links** between RAWG, IGDB and Steam | No images, scores or usable browsing. Useful for the migration. |
| SteamGridDB, CheapShark, OpenCritic, FreeToGame | Reachable | Art, deals, scores or free games only | Each covers one narrow area. |

Any keyed API still needs the proxy: a key in the browser is exposed, as RAWG's is today.

### Option: IGDB + Steam add-on

IGDB stays the catalogue. For a game with a Steam id, `/api/games/:id` also fetches Steam's `appdetails` and merges it. If Steam fails, the game simply shows IGDB data.

| Restores, Steam games only | Limit |
|:--|:--|
| Achievements: name and icon | 10 highlighted plus a total. **No description or unlock %**, so `AchievementsList` loses those. |
| Metacritic score | Only where Steam has one |
| Trailers in `CustomVideoPlayer` | HLS with CORS `*`; needs `hls.js` (new dependency) outside Safari, and YouTube is still needed for other games |

Tested on one game (Elden Ring) only. **My pick: add it**, because it keeps more of your current UI at little risk, but after IGDB works. Risk: Valve can change undocumented endpoints without notice, and Steam's own API terms don't clearly cover them.

### What gets worse, and your options

| Loss | Options | My pick |
|:--|:--|:--|
| **Achievements** | **A.** Remove the section. **B.** Steam add-on above: Steam games only, names and icons only. **C.** Keep waiting on RAWG. | **B**, after IGDB works. `AchievementsList` already hides itself when empty, so other games simply show nothing. |
| **Trailers become YouTube** | **A.** Thumbnail first, `youtube-nocookie.com` iframe on click (as STELA does); `CustomVideoPlayer` is removed. **B.** YouTube IFrame API driving your controls: more code, and YouTube's own UI still shows. **C.** Remove trailers. | **A.** It's a visible UI change, so I need your OK. Doesn't play offline; RAWG video wasn't cached either. |
| **Critic score isn't Metacritic** | Keep the badge with the new number, or switch to `total_rating`, which mixes in user scores. | Keep it with `aggregated_rating`. |
| **Genre icons** | Local icons, or one game image per genre. | Local icons: small, fixed list, works offline. Changes the sidebar's look slightly. |
| **Tags are a curated list** | Curated list, or raw `keywords`. | Curated. Raw keywords are noisy. |
| **Nintendo store filter + links** | Drop it, or use a publisher-only workaround. | Drop it unless the probe finds data. |
| **Shorter descriptions, sparser data** | Accept, or fill from elsewhere. | Accept; re-check after the probe. |
| **Old share links** | [Section 4](#4-risks-answered). | Most can't be recovered. They show a clear notice, never a wrong game. |

**Attribution:** add a small fixed "Data from IGDB.com" link in the sidebar. It isn't required for non-commercial use, but costs little and makes a later partnership easier. If you ever monetize the app, email `partner@igdb.com` first.

---

## 4. Risks answered

### Secrets and CORS: confirmed

Your memory was right: IGDB blocks browsers. Design:

```
Browser ──GET──> /api/* on Vercel ──POST──> api.igdb.com
                 CDN cache │ secrets stay here
```

- **Fixed routes, never a raw pass-through.** The browser sends named filters and the proxy writes the query. Forwarding query text would give anyone your quota.
  - `GET /api/games?genre=&platform=&store=&tag=&search=&developer=&publisher=&page=`
  - `GET /api/games/:id` (details, media, stores, similar in one call)
  - `GET /api/genres`
  - `GET /api/games/resolve?slug=&name=` (legacy matching)
- **Validation:** numeric ids, slug pattern, whitelisted filters, capped page and search length, escaped search text.
- **Secrets:** `TWITCH_CLIENT_ID` and `TWITCH_CLIENT_SECRET` in Vercel, **without** a `VITE_` prefix, so Vite can't bundle them. A test scans `dist/` to prove it.
- **Token refresh:** memory first, then Vercel Runtime Cache (`getCache`, on all plans, survives deploys), then ask Twitch. Only one request at a time per instance asks Twitch, and the TTL is a day short of the real expiry. On a 401, clear it, get a new token and retry once. The shared cache matters because of the 25-token cap: one token per cold start would keep disabling older ones. Hobby shares this cache across your projects, which I consider acceptable for a token that lasts 60 days and is replaced on failure.

**Rate limiting, in three layers:**

| Layer | What | Limit it can't solve |
|:--|:--|:--|
| CDN cache | `s-maxage` + `stale-while-revalidate` + `stale-if-error`: about 1 hour for lists, 1 day for details, 7 days for genres | Separate per region; first visit is a miss |
| Proxy → IGDB | Per-instance queue (3/s, 6 open), retry 429 with backoff, then `503` + `Retry-After` and `no-store` | **Per instance, not global.** Upgrade to shared Redis only if 429s show up in logs. |
| Visitor → proxy | Vercel WAF rule on `/api/*` by IP, e.g. 120 per minute. You add it in the dashboard. | Hobby allows 1 rule, 1,000,000 allowed requests included, counted per region |

`vercel.json` also changes: Vercel checks functions before rewrites, but a mistyped `/api/x` would return `index.html` with status 200, which the app could then cache. So the catch-all becomes `/((?!api/).*)`.

Local development needs `vercel dev`, since `vite` alone doesn't run `/api`.

### Offline: solved by using GET

Your concern was right. Workbox routes `GET` by default and the Vercel CDN only caches `GET`/`HEAD`, so a `POST` proxy would lose both. With the routes above:

| Data | Rule |
|:--|:--|
| `/api/*` | `NetworkFirst`, 5 s timeout, only 200s, about 200 entries, 7 days. Without a timeout, a hung network would wait about 20 s, as RAWG does today. |
| `images.igdb.com` | `CacheFirst`, only 200s, about 300 entries, 30 days, `<img crossorigin="anonymous">` |
| `media.rawg.io` | Keep while legacy items exist |
| Platforms, tags, stores | Constants in the bundle, so always available |
| Old `rawg-api-cache` | Delete on activation; Workbox won't remove a renamed cache |

Also add `navigateFallbackDenylist: [/^\/api\//]`. **Pitfall:** the glow needs `crossorigin`. If a plain `<img>` cached the same URL first, the opaque copy fails for the CORS request. Setting `crossorigin` on every game image avoids this, and also avoids Chrome's storage padding for opaque files.

Offline will still only show what was already seen. An unvisited game shows the error state. Tested on a production build in Phase 3.

### Saved user data: no overwrite, nothing deleted

**A RAWG id can't be used as an IGDB id:** the same number is a different game. That's the real danger, and the rule is that a RAWG id **never reaches an IGDB lookup**. RAWG isn't among IGDB's external sources and its API is down, but **Wikidata links them**: 60,622 games have a RAWG id, 59,262 of those also have an IGDB id and 58,070 a Steam id (queried 2026-11-07). The RAWG value there is the **slug**, which saved rows store. Games it misses fall back to `slug` and `name`, so some will still need your review.

1. **You back up:** a Supabase dump plus the read-only queries in [section 5](#5-report-only-items). I need the real schema and constraints before writing any SQL.
2. **Add columns** (you run this). `id_source text not null default 'rawg'` and `rawg_game_id integer`. The default is deliberate: an old PWA still running writes rows without the column, and they get correctly labelled `rawg`.
3. **Match offline.** A local script reads `distinct game_id, slug, name` from your export, looks up the slug in Wikidata, then checks the result against IGDB. Wikidata match with the same name, or exact slug + name = auto; several or differing results = your review; none = stays legacy. Output: a CSV.
4. **You review, then run** generated SQL. It sets `rawg_game_id = game_id`, then the new id, `id_source = 'igdb'` and fresh snapshot fields, and handles two RAWG editions landing on one IGDB game, or colliding with a row the user already has. Rows are never deleted.
5. **Guest data and Recently Viewed.** Add `version` + `createMigrate` to redux-persist (neither exists today). Copy the old blob to a backup key, label items `source: 'rawg'`, then match via `public/legacy-map.json` (RAWG id → IGDB id, no user data) and otherwise `/api/games/resolve`. Only exact matches are applied. Offline or unmatched items stay and retry later.
6. **Legacy items keep working.** A card shows its saved name and image. Clicking opens a small panel from the saved data with a "search by name" link and no API call. If the image is gone, a placeholder shows.
7. **Merge:** the key becomes `source:id` everywhere ids are compared (merge sets, Collections map, Sidebar count), so RAWG 3498 and IGDB 3498 can't collapse into one.

**Old `?gameId=` links:** new links use a new parameter, `?game=<igdb id>`, and `?gameId=` always means RAWG. It's resolved through `legacy-map.json`, which only covers games someone saved. Otherwise a notice says the link is from the old version and offers search. With RAWG down, **most old share links can't be recovered**; there's no data to do it with.

Snapshots go stale too, since IGDB removes replaced images after 30 days. So images need a fallback, and a snapshot refreshes when its details load.

### Features that may not map: your questions confirmed

| Question | Answer |
|:--|:--|
| Achievements? | None. |
| Score fields? | `aggregated_rating` (critics), `rating` (IGDB users), `total_rating` (both). No Metacritic field. |
| Trailers? | `video_id` is documented as "YouTube Links": ids only, so `CustomVideoPlayer` can't play them. |
| Store links? | Exist, split across `websites` and `external_games`; coverage needs the probe. |

### Filtering

- **Store:** possible on paper. Dotted relation filters are documented for other fields, not this one. **Probe it.**
- **Tag:** there's no direct equivalent; a curated list covers it.
- **Adult:** yes. The docs state all erotic games have theme 42 and give `where themes != (42)`. Better than today: it runs before paging, so pages aren't left short. **Age ratings** are a weak signal: only ESRB AO fits; PEGI 18 or CERO Z would hide normal mature games. Skip them.
- **Field names:** `category` is deprecated on games, websites and external games. Use `game_type`, `type`, `external_game_source`.

---

## 5. Report-only items

**Is Row Level Security on?** Run in the Supabase SQL editor (read-only):

```sql
select relname, relrowsecurity, relforcerowsecurity
from pg_class where oid in ('public.collections'::regclass, 'public.favorites'::regclass);

select tablename, policyname, cmd, roles, qual, with_check
from pg_policies where tablename in ('collections', 'favorites');

select conrelid::regclass, conname, pg_get_constraintdef(oid)
from pg_constraint where conrelid in ('public.collections'::regclass, 'public.favorites'::regclass);
```

Safe result: `relrowsecurity = true`, and policies use `auth.uid() = user_id` for all commands (for insert, in `with_check`). Then test it for real: sign in as user A in one window, and confirm user B's rows don't come back. **Result (owner ran it, 2026-11-07):** RLS is on for both tables, select, insert and delete policies use `auth.uid() = user_id`, both tables have unique constraints, and there are no duplicate rows. The two-user test is still to do.

**Deleted games coming back: confirmed in code.** `fetchFavorites` and `fetchCollections` upload any local item missing from the cloud. If device A deletes a game, device B still has it locally and re-uploads it at its next sign-in. A real fix needs deletion records (`deleted_at`) or merging only guest items. Not fixing it unasked.

---

## 6. Other findings

Your earlier findings all hold (key in bundle, React 19, no React Query, unfiltered reads). The file is at `portfolio/case-studies/nexus-codex/nexus-codex-findings.md`, and the repo was already at `D:\Frontend\Nexus-Codex`.

**The checks you want to run aren't all usable yet:**

- **`npx tsc --noEmit` checks nothing.** The root `tsconfig.json` has `files: []`, so it inspects **0 files** and always passes. Use `npx tsc -b --noEmit`, which passes today.
- **`npm run lint` already fails on untouched code:** 24 errors and 1 warning in 21 files (15 `no-explicit-any`, 9 `set-state-in-effect`, 1 `exhaustive-deps` warning). `npm run build` passes.

**Likely bugs, read from code but not yet run.** Phase 2 will pin each with a test:

| # | Bug | Where |
|:--|:--|:--|
| 1 | **Modal glow never works.** colorthief 3 has no class (I checked its exports), so `new ColorThief()` throws and an empty `catch` hides it. The `<img>` also lacks `crossorigin`. | `GameDetailsModal.tsx:73-82` |
| 2 | **Sidebar disappears on an API error**, including the My Collection link, because `if (error) return null` covers it all. | `Sidebar.tsx` |
| 3 | Previous game's trailers, store links and similar games stay until new ones arrive; they're not reset when the id changes. | `useGameTrailers`, `useGameStores`, `useSimilarGames` |
| 4 | Trailers are hidden when a game has no screenshots (nested condition). | `GameDetailsModal.tsx` |
| 5 | Similar-game clicks do nothing on Collections: the modal gets no `onSelectGame`. | `CollectionsPage.tsx` |
| 6 | Adult filter only covers the grid, not deep links or similar games. | `useGames.ts` |
| 7 | A failed merge upload is only logged, yet the item appears as if saved; the user isn't told. | both slices |
| 8 | Failed add/remove on a list shows nothing to the user. | `CollectionButton`, `FavoriteButton` |

---

## 7. Not verified

- **All IGDB data coverage**, the values of genres, platforms and sources, deep offsets, store filters.
- Whether RAWG will come back. There is no official statement I could find; it had a full-day outage in May 2024 too.
- The Twitch Developer Service Agreement's text.
- The Steam add-on beyond one game, and Steam's real rate limit. Steam's achievement-percentage endpoint returned 404, so unlock % isn't available that way.
- GameBrain's real data, MobyGames' official pricing and TheGamesDB's docs: I had no keys, and those pages were blocked or unreadable.
- Supabase schema, RLS, row counts.

**Probe, before Phase 3 starts:** you create the Twitch app (steps in Phase 3) and put the credentials in a gitignored `.env.local`. A throwaway script then reports, for 50 well-known games and 50 random ones: card image type, score, store links, website and Reddit coverage, and whether the store filter returns results. If store coverage is poor, the recommendation for that row changes before any code does.

---

## 8. Test plan

### Setup

As in STELA: `vitest`, `@testing-library/react`, `@testing-library/dom`, `@testing-library/jest-dom`, `jsdom`, plus `@vitest/coverage-v8`. All dev dependencies.

- **`tests/setup.ts`:** `matchMedia`, a controllable `IntersectionObserver`, `ResizeObserver`, media `play`/`pause`, fullscreen, clipboard and share; `localStorage` cleared per test.
- **Network:** a fake Axios adapter set on `api-client`, routing by URL, plus a guard that **fails any real request**. Testing at this boundary lets tests survive the migration: Phase 3 changes the fixtures, not what's checked. No MSW needed.
- **Supabase:** mock `utils/supabase` with a chainable fake and test env values. Your real project can't be reached.
- **Virtual modules:** mock `virtual:pwa-register/react` and `colorthief`.
- **Known bugs:** `it.fails('BUG-1: …')` states the **correct** behaviour and passes only while the bug exists, so a bug is never recorded as correct and a fix forces the marker off. They count as listed, not skipped.

### Order

Riskiest first, so a stop midway still covers user data:

1. Infrastructure + `CLAUDE.md` + `docs/PROJECT.md`
2. Store: `collectionsSlice`, `favoritesSlice`, then `authSlice`, `uiSlice`, `store/index`
3. Services: `api-client`, `image-url`
4. Hooks: `useData`, `useGames`, then the rest
5. Shared components
6. Auth and game components
7. Layout
8. Pages, then `App`
9. Playwright smoke
10. Coverage report + list of what tests can't judge

**Skips, with reasons:** `useAppDispatch`, `useAppSelector` (thin wrappers), `main.tsx` (bootstrap, covered by smoke), `types/`, `vite-env.d.ts` (no runtime code), `utils/supabase.ts` beyond its missing-env throw.

### Playwright: yes, a small suite

jsdom applies no CSS and does no layout or real service worker, so unit tests can't catch STELA's kind of bug.

| It would catch | Example |
|:--|:--|
| CSS and layout | A class that breaks a page; sideways scroll at 375 px; a modal under the page or off-screen |
| Real browser behaviour | Infinite scroll with a real observer, deep links, persistence over a reload |
| The production build | Bundle or chunk problems `vite dev` hides |
| Real PWA | Service worker registers; app shell + cached data work with the network off, the riskiest part of Phase 3 |

| It would cost | |
|:--|:--|
| Install | 1 dev dependency plus a Chromium download (estimate: 100–200 MB, outside the repo) |
| Time | Estimate: 1–2 minutes per run |
| Upkeep | Low at this size; animations and timing are the usual source of flakiness |
| What it still misses | How motion and design *look*, Safari and Firefox (Chromium only), real magic-link email |

**Suite (about 8 tests, 1440 px and 375 px, against `vite build` + `vite preview`):** grid is visible; no sideways scroll; card opens a modal that's actually on top; deep link opens the right game; guest add survives a reload; offline reload shows the app and cached data; expired-link message; broken API shows the error state and collection link. All outside traffic is stubbed or blocked, so it can't touch a real API or Supabase.

Run with `npm run test:e2e` before each merge request. It's a separate step because it's slower. The repo has no CI, and I'm not adding any unasked.

### Can't be judged by tests

Motion, overall look, real PWA install and update, real email and session flow, real IGDB data. I'll check these by hand in the browser at 1440 px and 375 px on a production build, and list exactly what I checked each time.

---

## Sources

Live tests were run on 2026-11-07 with `curl` and the browser.

- [IGDB API docs](https://api-docs.igdb.com/)
- [RAWG API page, Wayback 2026-10-21](https://web.archive.org/web/20261021210207/https://rawg.io/apidocs)
- [GameVault on the May 2024 RAWG outage](https://gamevau.lt/blog/2024/05/07/)
- [Twitch client credentials](https://dev.twitch.tv/docs/authentication/getting-tokens-oauth/)
- [Workbox routing](https://developer.chrome.com/docs/workbox/modules/workbox-routing)
- Vercel: [CDN cache](https://vercel.com/docs/caching/cdn-cache), [Runtime Cache](https://vercel.com/docs/runtime-cache), [WAF rate limiting](https://vercel.com/docs/vercel-firewall/vercel-waf/rate-limiting), [vercel.json](https://vercel.com/docs/project-configuration/vercel-json), [limits](https://vercel.com/docs/limits), [fair use](https://vercel.com/docs/limits/fair-use-guidelines)
- [`colorthief` 3.3.1 package](https://www.npmjs.com/package/colorthief) (exports read from the tarball)
- [GameBrain plans](https://gamebrain.co/api), [terms](https://gamebrain.co/api/terms), [search docs](https://gamebrain.co/api/docs/search-games), [comparison page](https://gamebrain.co/rawg-alternatives) (published by a vendor)
- [Giant Bomb API notice](https://giantbomb.com/api)
- [Steam Web API terms](https://steamcommunity.com/dev/apiterms), [reported storefront rate limits](https://github.com/GoFurry/steam-go/wiki/Rate-Limiting-Strategy)
- [MobyGames key and rate notes, third party](https://www.moritzjung.dev/obsidian-media-db-plugin-docs/reference/mobygames)
- [Wikidata query service](https://query.wikidata.org/): properties P9968 (RAWG), P5794 (IGDB), P1733 (Steam)
