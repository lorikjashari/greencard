import { deflateSync } from "node:zlib";

const CRC_TABLE = (() => {
  const table = new Uint32Array(256);
  for (let n = 0; n < 256; n += 1) {
    let c = n;
    for (let k = 0; k < 8; k += 1) {
      c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    }
    table[n] = c >>> 0;
  }
  return table;
})();

function crc32(buffer: Buffer): number {
  let c = 0xffffffff;
  for (const byte of buffer) {
    c = CRC_TABLE[(c ^ byte) & 0xff]! ^ (c >>> 8);
  }
  return (c ^ 0xffffffff) >>> 0;
}

function chunk(type: string, data: Buffer): Buffer {
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length, 0);
  const typeBuffer = Buffer.from(type, "ascii");
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(Buffer.concat([typeBuffer, data])), 0);
  return Buffer.concat([length, typeBuffer, data, crc]);
}

/**
 * Generates a square PNG with a neutral silhouette. Used only to seed demo
 * photo records so the review screens have something real to display.
 * This is not a person and is labelled DEMO in the UI.
 */
export function demoAvatarPng(size = 600): Buffer {
  const raw = Buffer.alloc((size * 3 + 1) * size);

  const bg = [238, 235, 226];
  const ink = [21, 61, 50];
  const gold = [197, 165, 106];

  for (let y = 0; y < size; y += 1) {
    const rowStart = y * (size * 3 + 1);
    raw[rowStart] = 0;
    for (let x = 0; x < size; x += 1) {
      let color = bg;

      const headDx = x - size / 2;
      const headDy = y - size * 0.38;
      const head = headDx * headDx + headDy * headDy < (size * 0.13) ** 2;

      const bodyDx = (x - size / 2) / (size * 0.27);
      const bodyDy = (y - size * 0.88) / (size * 0.3);
      const body = bodyDx * bodyDx + bodyDy * bodyDy < 1;

      const dotDx = x - size * 0.72;
      const dotDy = y - size * 0.18;

      if (head || (body && y > size * 0.56)) color = ink;
      if (dotDx * dotDx + dotDy * dotDy < (size * 0.025) ** 2) color = gold;

      const offset = rowStart + 1 + x * 3;
      raw[offset] = color[0];
      raw[offset + 1] = color[1];
      raw[offset + 2] = color[2];
    }
  }

  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8;
  ihdr[9] = 2;
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;

  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk("IHDR", ihdr),
    chunk("IDAT", deflateSync(raw, { level: 9 })),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}
