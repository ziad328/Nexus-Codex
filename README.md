# Nexus Codex

<div align="center">
  <img src="https://img.shields.io/badge/react-%2320232a.svg?style=for-the-badge&logo=react&logoColor=%2361DAFB" alt="React" />
  <img src="https://img.shields.io/badge/typescript-%23007ACC.svg?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript" />
  <img src="https://img.shields.io/badge/tailwindcss-%2338B2AC.svg?style=for-the-badge&logo=tailwind-css&logoColor=white" alt="TailwindCSS" />
  <img src="https://img.shields.io/badge/vite-%23646CFF.svg?style=for-the-badge&logo=vite&logoColor=white" alt="Vite" />
  <img src="https://img.shields.io/badge/redux-%23593d88.svg?style=for-the-badge&logo=redux&logoColor=white" alt="Redux" />
  <img src="https://img.shields.io/badge/supabase-%233FCF8E.svg?style=for-the-badge&logo=supabase&logoColor=white" alt="Supabase" />
  <img src="https://img.shields.io/badge/PWA-5A0FC8?style=for-the-badge&logo=pwa&logoColor=white" alt="PWA" />
</div>

<div align="center">
  <h3><strong><a href="https://nexus-codex-lib.vercel.app">🎮 Live Demo: nexus-codex-lib.vercel.app</a></strong></h3>
</div>

Nexus Codex is a game discovery and library app. Browse hundreds of thousands of games from [IGDB](https://www.igdb.com), open their details, and keep favorites and lists that sync to your account.

## 🚀 Features

- **Discovery:** an infinitely scrolling grid of portrait cover cards, a genre sidebar, and platform, store and tag filters. Developer and publisher pages, and debounced search.
- **Game details:** description, release date, developers and publishers, screenshots, YouTube trailers that load only when played, store and official links, and similar games. Every game has a shareable `?game=` link.
- **Library:** favorites and four lists (Playing Now, Backlog, Beaten, Wishlist). Lists work as a guest and merge into your account when you sign in. Recently Viewed keeps your last 10.
- **Sign-in:** passwordless magic links through Supabase, with email typo checks.
- **Offline:** installable as a PWA. Saved lists, and games and images already seen, still show without a connection.

## 🛠️ Tech stack

| Area | Choice |
|:--|:--|
| UI | React 19, TypeScript, Tailwind CSS v4, Framer Motion, OverlayScrollbars |
| Routing and state | React Router 7, Redux Toolkit with Redux Persist |
| Game data | IGDB, through our own GET-only proxy in `api/` (Vercel functions). The browser never holds a key. |
| Accounts and lists | Supabase (magic-link auth, Postgres with Row Level Security) |
| Offline | vite-plugin-pwa (Workbox) |
| Tests | Vitest and React Testing Library; a Playwright smoke suite |

## 📦 Getting started

You need [Node.js](https://nodejs.org/) and a free Twitch developer app for IGDB access ([IGDB's account guide](https://api-docs.igdb.com/#account-creation)).

1. Install:
   ```bash
   npm install
   ```

2. Create `.env.local` in the project root. It's ignored by git.
   ```env
   VITE_SUPABASE_URL=your_supabase_project_url
   VITE_SUPABASE_PUBLISHABLE_KEY=your_supabase_publishable_key
   TWITCH_CLIENT_ID=your_twitch_client_id
   TWITCH_CLIENT_SECRET=your_twitch_client_secret
   ```
   The Twitch values have no `VITE_` prefix on purpose: they stay on the server and never reach the browser.

3. Run it:
   ```bash
   npm run dev
   ```
   The app and its `/api` proxy run together at `http://localhost:5173`.

### Checks

```bash
npm test
npx tsc -b --noEmit
npm run build
npm run lint
npm run test:e2e
```

The smoke suite (`test:e2e`) needs `npx playwright install chromium` once. It runs a production build with every outside service stubbed.

### Deploying

Vercel deploys `main`. Set the same four values in the Vercel project's environment variables.

---

Game data from [IGDB.com](https://www.igdb.com).
