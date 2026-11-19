import { VALIDATION_RULES } from '../../constants/validation.js';
import { readMp4Info } from './mp4.utils.js';

const { maxBytes, maxDurationSec } = VALIDATION_RULES.exerciseVideo;

// H.264 plays in every supported browser; HEVC (the iPhone default) does not play in Chrome or
// Firefox on many computers.
const H264_SAMPLE_ENTRIES = ['avc1', 'avc3'];

export const VIDEO_FILE_MESSAGES = {
  tooLarge: `Plik może mieć najwyżej ${maxBytes / (1024 * 1024)} MB.`,
  notH264Mp4: 'Wybierz plik MP4 z obrazem H.264 (w iPhonie: Ustawienia → Aparat → Formaty → „Najbardziej zgodne”).',
  tooLong: `Film może trwać najwyżej ${maxDurationSec} s.`,
};

export type VideoFileCheck = { ok: true; durationSec: number } | { ok: false; message: string };

/** Checks the limits from ADR-0019 before the upload; the rules and the bucket enforce them again. */
export const checkVideoFile = async (file: Blob): Promise<VideoFileCheck> => {
  if (file.size > maxBytes) return { ok: false, message: VIDEO_FILE_MESSAGES.tooLarge };
  const info = readMp4Info(await file.arrayBuffer());
  if (!info || !info.sampleEntries.some(entry => H264_SAMPLE_ENTRIES.includes(entry))) {
    return { ok: false, message: VIDEO_FILE_MESSAGES.notH264Mp4 };
  }
  if (info.durationSec > maxDurationSec) return { ok: false, message: VIDEO_FILE_MESSAGES.tooLong };
  return { ok: true, durationSec: info.durationSec };
};

/** Document id of an exercise's video: SHA-256 (hex) of the exercise text, checked by the rules. */
export const exerciseVideoId = async (exerciseName: string): Promise<string> => {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(exerciseName));
  return [...new Uint8Array(digest)].map(byte => byte.toString(16).padStart(2, '0')).join('');
};
