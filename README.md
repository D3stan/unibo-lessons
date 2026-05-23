# UniBo Lessons

UniBo Lessons is a lightweight, responsive web application that aggregates course timetables from the official University of Bologna (UniBo) API and displays them in a modern, user-friendly interface. Designed primarily for mobile-first usage, it simplifies schedule checking for students by avoiding the slow navigation of the official portal or heavy mobile applications.

## Purpose

The primary objective of this project is to streamline how students access their daily lesson schedules. By pulling data directly from public JSON endpoints and storing user preferences locally, the application provides an instantaneous, offline-ready overview of timetables without manual search steps.

## Features

- Real-time schedule retrieval from official UniBo API endpoints.
- Auto-calculated academic year based on calendar dates with manual override settings.
- Persistent user configuration for degree program, year, and curriculum stored entirely on the client.
- Dynamic lesson details retrieval, including direct access to syllabus pages and teacher contacts.
- Direct linking to virtual classrooms (Microsoft Teams) when available.
- Responsive mobile-first interface featuring light and dark theme compatibility.
- Skeleton screen loaders for seamless layout transitions.

## Architecture

This project is built as a single-page application (SPA) with a serverless architecture, meaning it executes completely in the browser and requires no custom backend. 

For a detailed breakdown of the internal architecture, state flow, API scraper proxies, and component structure, please refer to the [Architecture Document](ARCHITECTURE.md).

## Technology Stack

- Preact (Vite preset for optimized bundling and reactivity)
- TypeScript (strict type safety)
- Vanilla CSS (custom design system, HSL color palettes, and glassmorphism)
- Browser LocalStorage (user preference persistence)
- GitHub Actions (automated builds and deployments)

## Project Structure

- `.github/workflows/deploy.yml` - CI/CD pipeline deploying builds to GitHub Pages.
- `index.html` - Base application HTML entrypoint.
- `vite.config.ts` & `tsconfig.json` - Build and compiler configurations.
- `src/` - Core application source:
  - `assets/icons.tsx` - Lightweight SVG path component wrappers.
  - `components/` - Focused, reusable user interface components:
    - `BottomDock.tsx` - Glassmorphic bottom navigation bar.
    - `DateHeader.tsx` - Date selection banner with quick-navigation controls.
    - `DrawerModal.tsx` - Bottom-sheet slider modals for configurations and manuals.
    - `LessonCard.tsx` - Display cards containing module name, time, room, and teacher links.
    - `SkeletonLoader.tsx` - Layout transition placeholders.
  - `config/coursesData.ts` - Master mapping dictionary for degrees and departments.
  - `i18n/` - Localization files for English (`en.ts`) and Italian (`it.ts`).
  - `services/` - Modules interacting with external endpoints:
    - `api.ts` - Fallback-resilient fetch service for schedules and curricula.
    - `scraper.ts` - CORS-proxied DOM scrapers for syllabus links and teacher info.
    - `academicYear.ts` - Helper to calculate rolling and automated academic years.
  - `state/store.ts` - Reactive pub/sub State Store synchronizing data to LocalStorage.
  - `styles/` - Custom stylesheet design:
    - `base.css` - HSL color variables, resets, and typography.
    - `components.css` - Theme styles, glassmorphism, buttons, animations, and modals.
    - `main.css` - Stylesheet bundler entrypoint.
  - `main.tsx` - Application bootstrapper.

## Development and Building

### Prerequisites

Ensure you have Node.js (v18 or higher) and npm installed.

### Setup

Install the required dependencies:

```bash
npm install
```

### Run Locally

Start the Vite development server:

```bash
npm run dev
```

### Build for Production

Compile the TypeScript files and bundle assets using Vite:

```bash
npm run build
```

The output will be placed in the `dist/` directory, ready to be hosted on any static file provider.

## Deployment

The application is automatically built and deployed via GitHub Actions whenever changes are pushed to the `main` branch. The workflow builds the static files and commits them to the `gh-pages` branch for hosting.

## Disclaimer

This is an unofficial student-made utility and is not affiliated with the University of Bologna. Data is fetched dynamically from their public endpoints.
