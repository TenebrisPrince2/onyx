// Генератор PNG-иконок ONYX из favicon.svg без внешних зависимостей:
// растеризация пути (кривые Безье -> полигон -> scanline fill с AA 4x) + PNG-энкодер (zlib).
import { deflateSync } from 'node:zlib';
import { writeFileSync } from 'node:fs';

const VIEW = 512, RX = 112, AA = 4;

// path из favicon.svg: m ... c ... s ... s ... s ... s ... z (координаты абсолютные после m, команды относительные)
function flattenPath() {
  const pts = [];
  let x = 93.3913, y = 237.21739;
  pts.push([x, y]);
  const cubics = [
    [[0, -58], [46, -92], [128, -80]],
    [[112, 30], [176, 14]],
    [[32, 96], [-12, 132]],
    [[-108, 60], [-176, 46]],
    [[-116, -54], [-116, -112]],
  ];
  let prevC2 = null;
  for (const seg of cubics) {
    let c1;
    if (seg.length === 3) c1 = seg[0];
    else {
      // s: c1 = отражение предыдущего c2 относительно текущей точки (переводим в относительный вид)
      c1 = prevC2 ? [x - prevC2[0], y - prevC2[1]] : [0, 0];
    }
    const c2 = seg[seg.length - 2], e = seg[seg.length - 1];
    const x1 = x + c1[0], y1 = y + c1[1];
    const x2 = x + c2[0], y2 = y + c2[1];
    const ex = x + e[0], ey = y + e[1];
    const N = 48;
    for (let i = 1; i <= N; i++) {
      const t = i / N, u = 1 - t;
      pts.push([
        u * u * u * x + 3 * u * u * t * x1 + 3 * u * t * t * x2 + t * t * t * ex,
        u * u * u * y + 3 * u * u * t * y1 + 3 * u * t * t * y2 + t * t * t * ey,
      ]);
    }
    prevC2 = [x2, y2];
    x = ex; y = ey;
  }
  return pts;
}

const POLY = flattenPath();

function pointInPoly(px, py) {
  let inside = false;
  for (let i = 0, j = POLY.length - 1; i < POLY.length; j = i++) {
    const [xi, yi] = POLY[i], [xj, yj] = POLY[j];
    if ((yi > py) !== (yj > py) && px < ((xj - xi) * (py - yi)) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
}

function insideRoundedRect(px, py, s) {
  const rx = (RX * s) / VIEW;
  if (px < 0 || py < 0 || px >= s || py >= s) return false;
  const cx = Math.min(Math.max(px, rx), s - rx), cy = Math.min(Math.max(py, rx), s - rx);
  if (cx === px || cy === py) return true;
  return (px - cx) * (px - cx) + (py - cy) * (py - cy) <= rx * rx;
}

// glyphs: {poly: смещение/масштаб глифа, rounded: скруглять ли фон}
function render(size, { scale = 1, rounded = true }) {
  const k = size / VIEW;
  const data = Buffer.alloc(size * size * 4);
  const white = Math.round(255 * 0.9 + 0 * 0.1); // path opacity .9 поверх чёрного => 230
  for (let py = 0; py < size; py++) {
    for (let px = 0; px < size; px++) {
      let cov = 0, bg = 0;
      for (let sy = 0; sy < AA; sy++) {
        for (let sx = 0; sx < AA; sx++) {
          const x = px + (sx + 0.5) / AA, y = py + (sy + 0.5) / AA;
          if (rounded && !insideRoundedRect(x, y, size)) continue;
          bg++;
          const gx = VIEW / 2 + (x / k - VIEW / 2) * scale; // масштаб глифа вокруг центра
          const gy = VIEW / 2 + (y / k - VIEW / 2) * scale;
          if (pointInPoly(gx, gy)) cov++;
        }
      }
      const o = (py * size + px) * 4;
      if (bg === 0) { data[o + 3] = 0; continue; }
      const a = cov / AA / AA;
      data[o] = Math.round(a * white);
      data[o + 1] = Math.round(a * white);
      data[o + 2] = Math.round(a * white);
      data[o + 3] = 255;
    }
  }
  return data;
}

// ---------- PNG encoder ----------
const CRC_TABLE = (() => {
  const t = new Int32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c;
  }
  return t;
})();
function crc32(buf) {
  let c = -1;
  for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 255] ^ (c >>> 8);
  return (c ^ -1) >>> 0;
}
function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const td = Buffer.concat([Buffer.from(type, 'ascii'), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(td));
  return Buffer.concat([len, td, crc]);
}
function encodePNG(size, rgba) {
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8; ihdr[9] = 6; // 8-bit RGBA
  const raw = Buffer.alloc((size * 4 + 1) * size);
  for (let y = 0; y < size; y++) {
    raw[y * (size * 4 + 1)] = 0; // filter: none
    rgba.copy(raw, y * (size * 4 + 1) + 1, y * size * 4, (y + 1) * size * 4);
  }
  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

const jobs = [
  ['icon-192.png', 192, { scale: 1, rounded: true }],
  ['icon-512.png', 512, { scale: 1, rounded: true }],
  ['icon-maskable-512.png', 512, { scale: 0.8, rounded: false }], // safe-zone 80%
];
for (const [name, size, opt] of jobs) {
  const png = encodePNG(size, render(size, opt));
  writeFileSync(new URL('../' + name, import.meta.url), png);
  console.log(name, png.length, 'bytes');
}
