import { describe, expect, it } from 'vitest';
import { buildMp4 } from '../../test/mp4.js';
import { readMp4Info } from './mp4.utils.js';

const buffer = (bytes: Uint8Array) => bytes.slice().buffer;

describe('readMp4Info', () => {
  it('reads the duration and the codec', () => {
    expect(readMp4Info(buffer(buildMp4({ durationSec: 12.5 })))).toEqual({ durationSec: 12.5, sampleEntries: ['avc1'] });
  });

  it('reads 64-bit times and a movie box after the media data', () => {
    expect(readMp4Info(buffer(buildMp4({ durationSec: 20, mvhdVersion: 1, moovLast: true, codec: 'hvc1' })))).toEqual({
      durationSec: 20,
      sampleEntries: ['hvc1'],
    });
  });

  it('rejects data that is not MP4', () => {
    expect(readMp4Info(new TextEncoder().encode('not a video at all').buffer)).toBeNull();
    expect(readMp4Info(new ArrayBuffer(0))).toBeNull();
  });

  it.each([
    ['in the media data', buildMp4(), 70],
    ['in the movie box', buildMp4({ moovLast: true }), 10],
  ])('rejects a file cut %s', (_, file, missingBytes) => {
    expect(readMp4Info(buffer(file.subarray(0, file.length - missingBytes)))).toBeNull();
  });

  it('rejects a file without a known duration', () => {
    expect(readMp4Info(buffer(buildMp4({ durationSec: 0 })))).toBeNull();
  });
});
