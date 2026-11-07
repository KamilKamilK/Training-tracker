import { readdir, stat } from 'node:fs/promises';
import { expect, test } from '@playwright/test';

test('built JavaScript chunks stay within the 500 kB budget', async () => {
  const assets = new URL('../dist-e2e/assets/', import.meta.url);
  const chunks = (await readdir(assets)).filter(file => file.endsWith('.js'));
  expect(chunks.length).toBeGreaterThan(0);

  for (const chunk of chunks) {
    const { size } = await stat(new URL(chunk, assets));
    expect(size, chunk).toBeLessThanOrEqual(500_000);
  }
});
