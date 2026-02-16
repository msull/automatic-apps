# automatic-apps

A collection of standalone, self-contained static HTML experiments.

## Conventions

- Each app lives in its own folder under `apps/`
- Apps must be fully self-contained: inline CSS, inline JS, no build step
- CDN libraries are fine if the app degrades gracefully offline
- Every app folder has an `index.html` as its entry point with a `<title>` and `<meta name="description">` tag (used by the auto-generated app directory)
- Every app folder has a `tests.spec.ts` — Playwright tests that cover all core features and serve as living documentation
- Keep apps simple — single HTML file preferred unless assets are truly needed

## Testing

- Run all tests: `npm test`
- Run one app's tests: `npx playwright test apps/<app-name>/tests.spec.ts`
- The Playwright config auto-starts a local server on port 3000
- Each app's test file should start with a comment block explaining what the app does

## App Directory

- Run `npm run directory` to regenerate `DIRECTORY.md` and `DIRECTORY.html` with screenshots of every app
- Screenshots are saved as `apps/<name>/screenshot.png`
- The script reads `<title>` and `<meta name="description">` from each app's HTML
- Regenerate after adding or updating any app
