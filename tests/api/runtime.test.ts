import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { describe, expect, it } from 'vitest';

// Vercel starts functions with require(esm) turned off, so a CommonJS dependency that require()s an
// ES-only package fails there although it loads in local Node.js (firebase-admin-node#3181).
describe('api/exercise-videos.ts in the Vercel runtime', () => {
  // A cold Node.js start that loads all of firebase-admin: 0.5 s alone, several seconds while the
  // jsdom workers start beside it, and over 30 s on a heavily oversubscribed machine. The limit only
  // has to catch a hang.
  it('loads with all its dependencies when require() of ES modules is disabled', async () => {
    const { stdout } = await promisify(execFile)(process.execPath, [
      '--no-experimental-require-module',
      '--input-type=module',
      '--eval',
      "const api = await import('./api/exercise-videos.ts'); console.log(typeof api.POST);",
    ]);
    expect(stdout.trim()).toBe('function');
  }, 60_000);
});
