# automatic-apps

A collection of standalone, self-contained static HTML experiments.

## Conventions

- Each app lives in its own folder under `apps/`
- Apps must be fully self-contained: inline CSS, inline JS, no build step
- CDN libraries are fine if the app degrades gracefully offline
- Every app folder has an `index.html` as its entry point with a `<title>` and `<meta name="description">` tag (used by the auto-generated app directory)
- Every app folder has a `tests.spec.ts` — Playwright tests that cover all core features and serve as living documentation
- Keep apps simple — single HTML file preferred unless assets are truly needed
- Always update the app table in `README.md` when adding or removing an app

## Testing

- Run all tests: `npm test`
- Run one app's tests: `npx playwright test apps/<app-name>/tests.spec.ts`
- The Playwright config auto-starts a local server on port 3000
- Each app's test file should start with a comment block explaining what the app does

## App Directory

- Run `npm run directory` to regenerate `DIRECTORY.md`, `DIRECTORY.html`, and screenshots for every app
- The script (`scripts/generate-directory.ts`) visits each app in a headless browser, takes a viewport screenshot, and reads `<title>` and `<meta name="description">` from the HTML
- Screenshots are saved as `apps/<name>/screenshot.png`
- After adding, removing, or visually updating any app, always run both commands in order:
  1. `npm run directory` — regenerate directory files and screenshots
  2. `npm run build:pages` — rebuild the `docs/` folder for GitHub Pages

## GitHub Pages

- `npm run build:pages` assembles the `docs/` folder
- Copies `DIRECTORY.html` as `docs/index.html` (landing page) and each app's files (excluding tests)
- GitHub Pages serves from the `docs/` folder on the main branch
