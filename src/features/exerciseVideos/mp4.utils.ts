// Reads what the upload check needs from an MP4 (ISO BMFF) file without decoding it, so the result
// does not depend on the codecs of the browser: the duration from `moov/mvhd` and the sample entry
// types (codecs) of the tracks from `stsd`.

export interface Mp4Info {
  durationSec: number;
  /** Four-character codes of the sample entries, e.g. `avc1` for H.264 and `hvc1` for HEVC. */
  sampleEntries: string[];
}

interface Box {
  type: string;
  bodyStart: number;
  end: number;
}

class InvalidMp4Error extends Error {}

const CONTAINER_BOXES = new Set(['moov', 'trak', 'mdia', 'minf', 'stbl']);

const fourCc = (view: DataView, offset: number) =>
  String.fromCharCode(view.getUint8(offset), view.getUint8(offset + 1), view.getUint8(offset + 2), view.getUint8(offset + 3));

function* readBoxes(view: DataView, start: number, end: number): Generator<Box> {
  let offset = start;
  while (offset + 8 <= end) {
    const declaredSize = view.getUint32(offset);
    const type = fourCc(view, offset + 4);
    let size = declaredSize;
    let headerSize = 8;
    if (declaredSize === 1) {
      const largeSize = view.getBigUint64(offset + 8);
      if (largeSize > BigInt(end - offset)) throw new InvalidMp4Error(type);
      size = Number(largeSize);
      headerSize = 16;
    } else if (declaredSize === 0) {
      size = end - offset;
    }
    if (size < headerSize || offset + size > end) throw new InvalidMp4Error(type);
    yield { type, bodyStart: offset + headerSize, end: offset + size };
    offset += size;
  }
  // Boxes fill their parent exactly; leftover bytes mean a cut or corrupted file.
  if (offset !== end) throw new InvalidMp4Error('trailing data');
}

const readDuration = (view: DataView, mvhd: Box): number => {
  const version = view.getUint8(mvhd.bodyStart);
  const timescale = view.getUint32(mvhd.bodyStart + (version === 1 ? 20 : 12));
  const duration = version === 1
    ? Number(view.getBigUint64(mvhd.bodyStart + 24))
    : view.getUint32(mvhd.bodyStart + 16);
  return timescale > 0 ? duration / timescale : 0;
};

const readSampleEntries = (view: DataView, stsd: Box): string[] => {
  const entryCount = view.getUint32(stsd.bodyStart + 4);
  return [...readBoxes(view, stsd.bodyStart + 8, stsd.end)].slice(0, entryCount).map(entry => entry.type);
};

/** Null when the data is not an MP4 file with a known duration. */
export const readMp4Info = (buffer: ArrayBuffer): Mp4Info | null => {
  const view = new DataView(buffer);
  try {
    const topLevel = [...readBoxes(view, 0, view.byteLength)];
    const moov = topLevel.find(box => box.type === 'moov');
    if (topLevel[0]?.type !== 'ftyp' || !moov) return null;

    let durationSec = 0;
    const sampleEntries: string[] = [];
    const walk = (box: Box) => {
      for (const child of readBoxes(view, box.bodyStart, box.end)) {
        if (child.type === 'mvhd') durationSec = readDuration(view, child);
        else if (child.type === 'stsd') sampleEntries.push(...readSampleEntries(view, child));
        else if (CONTAINER_BOXES.has(child.type)) walk(child);
      }
    };
    walk(moov);
    return durationSec > 0 ? { durationSec, sampleEntries } : null;
  } catch (error) {
    // A box that runs past the end of the data: a truncated or non-MP4 file.
    if (error instanceof InvalidMp4Error || error instanceof RangeError) return null;
    throw error;
  }
};
