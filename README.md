# automatic-apps

Standalone, self-contained static HTML experiments. Each app is a single HTML file (or small folder) that works by opening it in a browser — no build step, no shared dependencies.

## Apps

| App | Description |
|-----|-------------|
| [music-note-flashcards](apps/music-note-flashcards/) | Practice identifying notes on the treble clef staff |

## Running an app

Open any app's `index.html` directly in your browser, or start a local server:

```bash
npm run serve
# then visit http://localhost:3000/<app-name>/
```

## Testing

Each app has a colocated `tests.spec.ts` that covers core features and serves as living documentation.

```bash
npm install
npx playwright install chromium
npm test
```
