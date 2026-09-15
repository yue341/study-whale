const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const SRC_DIR = 'C:/Users/liuyu/WorkBuddy/2026-09-15-20-37-25/study-whale';
const SOURCE = path.join(SRC_DIR, 'icon.png');
const TEMP_JPG = 'C:/Users/liuyu/Documents/Tencent Files/1522962281/nt_qq/nt_data/Pic/2026-09/Ori/3d0c6a17cfb7d28d4e558fe9b732fc36.jpg';

async function sampleBgColor(imgPath) {
  const { data, info } = await sharp(imgPath)
    .raw()
    .ensureAlpha()
    .toBuffer({ resolveWithObject: true });
  const channels = info.channels;
  const inset = 80;
  // sample four corners (well inside background, away from rounded edge / icon)
  const points = [
    { x: inset, y: inset },
    { x: info.width - inset - 1, y: inset },
    { x: inset, y: info.height - inset - 1 },
    { x: info.width - inset - 1, y: info.height - inset - 1 },
  ];
  let r = 0, g = 0, b = 0, n = 0;
  for (const p of points) {
    for (let dy = -10; dy <= 10; dy += 5) {
      for (let dx = -10; dx <= 10; dx += 5) {
        const x = Math.min(info.width - 1, Math.max(0, p.x + dx));
        const y = Math.min(info.height - 1, Math.max(0, p.y + dy));
        const idx = (y * info.width + x) * channels;
        r += data[idx];
        g += data[idx + 1];
        b += data[idx + 2];
        n++;
      }
    }
  }
  const toHex = v => Math.round(v / n).toString(16).padStart(2, '0');
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

async function main() {
  // 1) convert source jpg -> repo/icon.png (PNG, keep original size)
  await sharp(TEMP_JPG).png().toFile(SOURCE);

  const bg = await sampleBgColor(SOURCE);
  const { width, height } = await sharp(SOURCE).metadata();
  const size = Math.max(width, height);

  // helper: produce a square PNG of targetSize from source (cover + pad with bg)
  async function makeSquare(targetSize) {
    return sharp(SOURCE)
      .resize(targetSize, targetSize, { fit: 'contain', background: bg })
      .png()
      .toBuffer();
  }

  fs.writeFileSync(path.join(SRC_DIR, 'icon-192.png'), await makeSquare(192));
  fs.writeFileSync(path.join(SRC_DIR, 'icon-512.png'), await makeSquare(512));

  // maskable: scale content to 80% safe zone on bg
  const maskableSize = Math.round(512 * 0.8);
  const content = await sharp(SOURCE)
    .resize(maskableSize, maskableSize, { fit: 'contain', background: bg })
    .png()
    .toBuffer();
  const offset = Math.round((512 - maskableSize) / 2);
  await sharp({ create: { width: 512, height: 512, channels: 4, background: bg } })
    .composite([{ input: content, left: offset, top: offset }])
    .png()
    .toFile(path.join(SRC_DIR, 'icon-maskable-512.png'));

  console.log('generated icon.png, icon-192.png, icon-512.png, icon-maskable-512.png');
  console.log('background color:', bg);
}

main().catch(err => { console.error(err); process.exit(1); });
