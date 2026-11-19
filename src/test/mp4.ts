// Builds minimal MP4 files (only the boxes the upload check reads) for unit and end-to-end tests.

const concat = (parts: Uint8Array[]) => {
  const result = new Uint8Array(parts.reduce((sum, part) => sum + part.length, 0));
  let offset = 0;
  for (const part of parts) {
    result.set(part, offset);
    offset += part.length;
  }
  return result;
};

const uint32 = (value: number) => {
  const bytes = new Uint8Array(4);
  new DataView(bytes.buffer).setUint32(0, value);
  return bytes;
};

const uint64 = (value: number) => {
  const bytes = new Uint8Array(8);
  new DataView(bytes.buffer).setBigUint64(0, BigInt(value));
  return bytes;
};

const ascii = (text: string) => new TextEncoder().encode(text);

const box = (type: string, ...body: Uint8Array[]) => {
  const content = concat(body);
  return concat([uint32(8 + content.length), ascii(type), content]);
};

interface Mp4Options {
  durationSec?: number;
  codec?: string;
  /** mvhd version 1 stores times as 64-bit values. */
  mvhdVersion?: 0 | 1;
  /** Puts `moov` after the media data, as cameras usually do. */
  moovLast?: boolean;
}

export const buildMp4 = ({ durationSec = 10, codec = 'avc1', mvhdVersion = 0, moovLast = false }: Mp4Options = {}) => {
  const timescale = 1000;
  const duration = Math.round(durationSec * timescale);
  const times = mvhdVersion === 1
    ? [uint64(0), uint64(0), uint32(timescale), uint64(duration)]
    : [uint32(0), uint32(0), uint32(timescale), uint32(duration)];
  const mvhd = box('mvhd', new Uint8Array([mvhdVersion, 0, 0, 0]), ...times, new Uint8Array(80));
  const stsd = box('stsd', uint32(0), uint32(1), box(codec, new Uint8Array(16)));
  const moov = box('moov', mvhd, box('trak', box('mdia', box('minf', box('stbl', stsd)))));
  const ftyp = box('ftyp', ascii('isom'), uint32(512), ascii('isomavc1'));
  const mdat = box('mdat', new Uint8Array(64));
  return moovLast ? concat([ftyp, mdat, moov]) : concat([ftyp, moov, mdat]);
};
