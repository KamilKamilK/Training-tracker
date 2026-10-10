# Git hooks

`pre-push` runs `npm run lint`, `npm run build` and `npm test`; when the pushed commits change `firestore.rules`, `tests/rules/`, `firebase.json` or `vitest.rules.config.ts`, it also runs `npm run test:rules` (requires Java 21).

Activate once per clone:

```bash
git config core.hooksPath .githooks
```

Check: `git config --get core.hooksPath` prints `.githooks`. Do not bypass a failing hook with `--no-verify` — fix the reported problem.
