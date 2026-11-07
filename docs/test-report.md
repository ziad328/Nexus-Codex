# Test Report: End of Phase 2

Where testing stands before the move to IGDB, what the numbers don't prove, and what still needs a person. Checked 2026-11-07 at `85b0d82`, the last commit before this report. Status and the bug table live in [PROJECT.md](PROJECT.md).

## Results

| Check | Result |
|:--|:--|
| `npm test` | 580 pass, 58 expected failures that mark known problems |
| `npm run test:e2e` | 12 pass, 3 expected failures (Chromium, production build, 1440 px and 375 px, offline) |
| `npx tsc -b --noEmit`, `npm run build`, `npm run lint` | All pass, with no lint warnings |
| Deliberate breakages, unit tests | 396 of 403 caught |
| Deliberate breakages, smoke suite | 18 of 18 caught |
| Repeat runs | 15 of 15 clean for `npm test`, 3 of 3 for the smoke suite |

**Coverage (unit tests only):** 98.9% of lines, 98.1% of statements, 98.3% of functions and 94.3% of branches.

| Area | Lines | Branches |
|:--|:--|:--|
| `src/App.tsx`, `src/hooks`, `src/services`, `src/components/layout` | 100% | 100% |
| `src/pages` | 100% | 95% |
| `src/components/auth` | 100% | 96% |
| `src/components/game` | 100% | 92% |
| `src/store` | 99% | 92% |
| `src/components/shared` | 98% | 94% |
| `src/utils/supabase.ts` | 0% | 0% |

## Lines the unit tests don't run

| Where | What | Why it's left |
|:--|:--|:--|
| `src/utils/supabase.ts` | The real client, and its error for missing settings | Tests always use the fake, so they can't reach your project. The smoke suite runs the client against stubs; the missing-settings error is untested. |
| `PWAReloadPrompt.tsx`, lines 11-14 | Logging when the service worker registers | Logging only. The fake never calls it. |
| `store/index.ts`, line 14 | Removing saved data from storage | Only Redux Persist calls it, when purging, and the app never purges. |
| `CustomVideoPlayer.tsx`, lines 106-107, 159 | Hover state, and stopping a volume click from pausing | Small gaps worth closing if the player changes. |

Most of the remaining branches are `??` fallbacks and guards with no visible effect.

## What the numbers don't prove

- **Coverage counts lines that ran, not behaviour that's right.** The breakage counts are the better evidence.
- **The API data is invented.** RAWG is down, so no test has seen a real response. Phase 3 must re-check every feature against real IGDB data.
- **Supabase is a fake.** It has no unique constraints or Row Level Security, so it shows duplicates the real database refuses (BUG-9).
- **Expected failures are passing tests of broken behaviour.** A green run still means 32 known bugs are open (all of BUG-1 to BUG-33 except BUG-13), plus ISSUE-5.

The seven missed breakages: two glow lines that can't run because of BUG-1, one line that only repeats a default, an `AuthModal` guard with no visible effect, `Sidebar`'s `if (error)`, which is BUG-2 itself, and the reduced-motion setting and `CollectionsPage` scrollbars, both in the hand checks below.

## Hand checks

None of these has been done. Tests can't judge them, so each needs a person. Use a production build (`npm run build`, then `npm run preview`) unless it says otherwise.

**Needs working game data, so best done during Phase 3:**

| Check | How | Pass looks like |
|:--|:--|:--|
| Motion | Scroll the grid, open and close the modal, open the sign-in modal | Smooth, with no jumps or cards stuck invisible |
| Reduced motion (`App`) | Turn on the system's reduce-motion setting and repeat | Movement is reduced, and nothing breaks |
| Grid layout | Compare grid and list at 1440 px and 375 px with real titles and images | Long names wrap or cut off cleanly, and nothing overlaps |
| Modal content | Open a game with trailers, screenshots and stores | Sections are in order and scroll on a phone |
| Video player | Play, seek, mute and go fullscreen on a real trailer | Each works, with sound (BUG-16 and BUG-17 still apply) |
| Modal glow | Open a game | No glow today (BUG-1). Check again once fixed. |
| Share previews | Paste a `?gameId=` link into a chat app | Shows the title and image the app intends |

**Can be done now:**

| Check | How | Pass looks like |
|:--|:--|:--|
| Scrollbars (`CollectionsPage`) | Open `/collection` with enough saved games to scroll | One scrollbar, styled, and it hides after scrolling |
| **Two-user privacy** | Save a game as user A. Sign in as user B in a private window. | B doesn't see A's game. **The most important check here.** |
| Real magic link | Sign in with your own email on the live site | Email arrives, the link signs you in, and guest games merge once |
| Expired link | Use an old magic link | The message appears, then goes away after 6 seconds |
| Sign-out | Sign out on the live site | Lists clear, and signing back in restores them |
| Other browsers | Repeat the main flows in Safari and Firefox, and on a real phone | Same behaviour. The smoke suite is Chromium only. |
| Touch | On a phone, swipe Recently Viewed and the filter pills, and open the menu | Swipes scroll, and buttons are easy to hit. Sign-in is unreachable (BUG-25). |
| Install and update | Install the PWA, deploy a change, then reopen it | It installs, and the reload prompt appears and works |
| Offline with real data | Load pages online, then go offline in dev tools | Saved lists and seen data show (the smoke suite covers saved lists only) |
| Screen reader | Go through search, a card, the modal and sign-in with NVDA or VoiceOver | Everything is announced and reachable (BUG-16 and BUG-32 still apply) |
| Colour contrast | Run a browser accessibility check on the main pages | No serious contrast failures |
