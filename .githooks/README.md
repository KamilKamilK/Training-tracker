# Git hooks

`pre-push` runs `npm run lint`, `npm run build` and `npm test` on every push. Depending on what the pushed commits change, it also runs:

- `npm run test:rules` — when `firestore.rules`, `tests/rules/`, `firebase.json` or `vitest.rules.config.ts` change;
- `npm run test:e2e` — when the app, its build configuration, dependencies, the rules or the end-to-end tests change.

Both need Java 21 (Firebase emulators); the end-to-end tests also need Chromium for Playwright (`npx playwright install chromium`, once per machine).

Activate once per clone:

```bash
git config core.hooksPath .githooks
```

Check: `git config --get core.hooksPath` prints `.githooks`. Do not bypass a failing hook with `--no-verify` — fix the reported problem.
