import { describe, expect, it } from 'vitest';
import { buildMp4 } from '../../test/mp4.js';
import { VIDEO_FILE_MESSAGES, checkVideoFile, exerciseVideoId } from './exerciseVideo.utils.js';

const file = (bytes: Uint8Array, name = 'film.mp4') => new File([bytes.slice()], name, { type: 'video/mp4' });

describe('checkVideoFile', () => {
  it('accepts an H.264 MP4 within the limits', async () => {
    expect(await checkVideoFile(file(buildMp4({ durationSec: 30 })))).toEqual({ ok: true, durationSec: 30 });
  });

  it('rejects a film longer than 30 s', async () => {
    expect(await checkVideoFile(file(buildMp4({ durationSec: 30.5 })))).toEqual({ ok: false, message: VIDEO_FILE_MESSAGES.tooLong });
  });

  it('rejects HEVC and files that are not MP4', async () => {
    const notH264 = { ok: false, message: VIDEO_FILE_MESSAGES.notH264Mp4 };
    expect(await checkVideoFile(file(buildMp4({ codec: 'hvc1' })))).toEqual(notH264);
    expect(await checkVideoFile(new File(['plain text'], 'film.mp4', { type: 'video/mp4' }))).toEqual(notH264);
  });

  it('rejects a file larger than 10 MB without reading it', async () => {
    const large = new File([new Uint8Array(10 * 1024 * 1024 + 1)], 'film.mp4', { type: 'video/mp4' });
    expect(await checkVideoFile(large)).toEqual({ ok: false, message: VIDEO_FILE_MESSAGES.tooLarge });
  });
});

describe('exerciseVideoId', () => {
  it('is the SHA-256 of the exercise text in hex', async () => {
    expect(await exerciseVideoId('abc')).toBe('ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad');
  });

  it('hashes the UTF-8 text, so Polish letters and symbols give a stable id', async () => {
    const id = await exerciseVideoId('Wyciskanie Smith dodatnia 15° – 5x (12/10/10/8/8)');
    expect(id).toMatch(/^[0-9a-f]{64}$/);
    expect(await exerciseVideoId('Wyciskanie Smith dodatnia 15° – 5x (12/10/10/8/8)')).toBe(id);
  });
});
