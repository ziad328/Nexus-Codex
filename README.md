# Nexus Codex

Nexus Codex is a modern, high-fidelity web application built with React and TypeScript, functioning as a premier hub for game discovery and collection management. It leverages the RAWG Video Games Database API to provide an extensive, interactive library of games, complete with detailed metadata, rich media, and personal library curation features.

## 🚀 Key Features

- **Progressive Web App (PWA):** Fully installable with robust offline support powered by Workbox. Browse your custom collections and recently viewed games without an internet connection.
- **Secure Authentication:** Passwordless Magic Link login via Supabase, fortified with Formik and Yup for strict, typo-resistant email validation.
- **Infinite Game Discovery:** Browse games by genre, platform, developer, and publisher using an infinite-scrolling architecture.
- **Real-Time Search:** Instantly locate titles using a highly optimized, debounced search engine.
- **Rich Media & Immersive Details:** Watch gameplay trailers in a custom video player, browse HD screenshots, and view deep metadata (Metacritic scores, lore, achievements).
- **Cloud-Synced Library:** Add games to your favorites or create custom collections (Playing Now, Backlog, Beaten, Wishlist) synced securely to the cloud.
- **Premium UI/UX:** A dark-themed, responsive design with glassmorphism elements, Framer Motion animations, and custom smooth scrolling via OverlayScrollbars.

## 🛠️ Tech Stack

### Frontend Core
- **Framework:** React 18
- **Language:** TypeScript
- **Styling:** TailwindCSS v4
- **Routing:** React Router DOM
- **Build Tool:** Vite

### State Management & Data Fetching
- **Data Fetching:** React Query (TanStack Query)
- **Global State:** Redux Toolkit
- **Persistence:** Redux Persist (for local caching)
- **Form Handling:** Formik + Yup

### Backend & Infrastructure
- **Authentication & Database:** Supabase
- **Game Data:** RAWG API
- **PWA / Service Workers:** vite-plugin-pwa (Workbox)

## 📦 Getting Started

### Prerequisites
Make sure you have [Node.js](https://nodejs.org/) installed on your machine.

### Installation

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd Nexus
   ```

2. Install the dependencies:
   ```bash
   npm install
   ```

3. Environment Setup:
   Create a `.env` file in the root directory and add your required keys:
   ```env
   VITE_RAWG_API_KEY=your_rawg_api_key
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

### 🏃‍♂️ Running the App

Start the development server:
```bash
npm run dev
```
The application will be available at `http://localhost:5173`.

### 🏗️ Building for Production

To build the app and test the Progressive Web App (PWA) offline capabilities locally:
```bash
npm run build
npm run preview
```
This will generate optimized static files in the `dist` directory and serve them locally for testing the Service Worker.
