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
- Always regenerate the directory after adding, removing, or visually updating any app

## GitHub Pages

- Run `npm run build:pages` to assemble the `docs/` folder
- Copies `DIRECTORY.html` as `docs/index.html` (landing page) and each app's files (excluding tests)
- Configure GitHub Pages to serve from the `docs/` folder on the main branch
