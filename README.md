# Nexus Codex

Nexus Codex is a modern, high-fidelity web application built with React and TypeScript, functioning as a premier hub for game discovery and collection management. It leverages the RAWG Video Games Database API to provide an extensive, interactive library of games, complete with detailed metadata, rich media, and personal library curation features.

## Tech Stack
- **Frontend Framework:** React 18
- **Language:** TypeScript
- **State Management:** Redux Toolkit (Favorites, Custom Collections, UI State)
- **Routing:** React Router (Dynamic routing for genres, publishers, developers)
- **Styling:** TailwindCSS
- **Build Tool:** Vite

## Key Features
- **Game Discovery:** Browse games by genre, platform, developer, and publisher. Filter by stores and tags.
- **Search:** Real-time search functionality.
- **Rich Media:** View game trailers using a custom video player and browse high-quality screenshots.
- **Library Management:** Add games to your favorites or create custom collections to track your backlog.
- **Immersive UI:** A dark-themed, responsive design with smooth scrolling and glassmorphism elements.

## Getting Started

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
   Create a `.env` file in the root directory and add your RAWG API key:
   ```env
   VITE_RAWG_API_KEY=your_api_key_here
   ```

### Running the App

Start the development server:
```bash
npm run dev
```
The application will be available at `http://localhost:5173`.

### Building for Production

To build the app for production, run:
```bash
npm run build
```
This will generate optimized static files in the `dist` directory.
