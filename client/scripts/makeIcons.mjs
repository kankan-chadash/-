/**
 * B.H. Copyright (c) 2026 Yemot HaMashiach Ltd.
 * All Rights Reserved.
 *
 * This software is the confidential and proprietary information of
 * Yemot HaMashiach Ltd. ("Confidential Information"). You shall not
 * disclose such Confidential Information and shall use it only in
 * accordance with the terms of the license agreement you entered into
 * with Yemot HaMashiach Ltd.
 *
 * Unauthorized copying of this file, via any medium, is strictly prohibited.
 */

/*
 * Draws the tab icons in public/ from public/logo.png.
 *
 * The logo can't be a favicon as it stands: the mark sits on an opaque white
 * square and fills only about a fifth of it, so at tab size it renders as a
 * bright white tile with a speck in the middle — and that tile clashes with
 * every dark tab bar it lands on. This crops the mark to its own ink and sets it
 * on a round disc with a gold rim, so the icon brings its own background: the
 * disc reads against a dark bar, the rim draws the edge against a light one.
 *
 * A one-off tool, not part of the build — run it when the logo changes:
 *
 *   node scripts/makeIcons.mjs          # rewrite the icons
 *   node scripts/makeIcons.mjs --sheet  # also write a contact sheet to check them
 *
 * It needs Playwright's Chromium on the machine (Chromium does the compositing
 * and the PNG encoding), which is why it isn't an npm script — the build itself
 * shouldn't depend on a browser.
 */
import { chromium } from 'playwright';
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const PUBLIC = join(dirname(fileURLToPath(import.meta.url)), '..', 'public');
const LOGO = join(PUBLIC, 'logo.png');

/**
 * How much of the diameter the mark spans, and how thick the rim is, per size.
 *
 * Drawn per size rather than scaled from one master: at 16px a rim that looks
 * right at 64px swallows the mark, and the mark has to be proportionally larger
 * to survive at all. Optical sizing, the way any icon set is made.
 */
const METRICS = {
  16: { fill: 0.82, rim: 1 },
  32: { fill: 0.74, rim: 2 },
  48: { fill: 0.7, rim: 3 },
  64: { fill: 0.68, rim: 3 },
  180: { fill: 0.62, rim: 8 },
  512: { fill: 0.68, rim: 24 },
};

const OUTPUTS = [
  { size: 16, round: true, name: 'icon-16.png' },
  { size: 32, round: true, name: 'icon-32.png' },
  { size: 48, round: true, name: 'icon-48.png' },
  { size: 64, round: true, name: 'icon-64.png' },
  // iOS masks this itself and puts black behind anything transparent, so it has
  // to be a full-bleed square rather than a circle.
  { size: 180, round: false, name: 'apple-touch-icon.png' },
];

const RIM_COLOUR = '#b8901f';
const DISC_COLOUR = '#fffdfc';

const logoUri = 'data:image/png;base64,' + readFileSync(LOGO).toString('base64');
const browser = await chromium.launch();

/**
 * The box the logo's ink actually occupies, measured rather than assumed so a
 * redrawn logo with different margins still lands centred and correctly sized.
 */
async function measureInk() {
  const page = await browser.newPage();
  await page.setContent('<body></body>');
  const box = await page.evaluate(async (src) => {
    const img = new Image();
    img.src = src;
    await img.decode();
    const canvas = document.createElement('canvas');
    canvas.width = img.width;
    canvas.height = img.height;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(img, 0, 0);
    const { data } = ctx.getImageData(0, 0, canvas.width, canvas.height);
    let x0 = Infinity,
      y0 = Infinity,
      x1 = -1,
      y1 = -1;
    for (let y = 0; y < canvas.height; y++) {
      for (let x = 0; x < canvas.width; x++) {
        const i = (y * canvas.width + x) * 4;
        // Ink is anything neither transparent nor near-white.
        const blank = data[i + 3] < 16 || (data[i] > 244 && data[i + 1] > 244 && data[i + 2] > 244);
        if (blank) continue;
        if (x < x0) x0 = x;
        if (x > x1) x1 = x;
        if (y < y0) y0 = y;
        if (y > y1) y1 = y;
      }
    }
    return { src: img.width, x0, y0, x1, y1 };
  }, logoUri);
  await page.close();
  if (box.x1 < 0) throw new Error('logo.png looks blank — found no ink to crop to');
  return box;
}

const ink = await measureInk();
const inkWidth = ink.x1 - ink.x0 + 1;
const inkCx = (ink.x0 + ink.x1) / 2;
const inkCy = (ink.y0 + ink.y1) / 2;
console.log(`ink box ${inkWidth}×${ink.y1 - ink.y0 + 1} at (${ink.x0}, ${ink.y0}) of ${ink.src}²`);

function markup(size, round) {
  const { fill, rim } = METRICS[size];
  const scale = (fill * size) / inkWidth; // applied to the whole source canvas
  const total = ink.src * scale;

  return `<!doctype html><html><body style="margin:0;background:transparent">
<div style="position:relative;width:${size}px;height:${size}px;overflow:hidden;
  border-radius:${round ? '50%' : '0'};background:${DISC_COLOUR}">
  <img src="${logoUri}" style="position:absolute;width:${total}px;height:${total}px;
    left:${size / 2 - inkCx * scale}px;top:${size / 2 - inkCy * scale}px">
  ${
    round
      ? // Over the art, not under it: the art's own white square is wider than
        // the disc and would otherwise hide the rim completely.
        `<div style="position:absolute;inset:0;border-radius:50%;
      box-shadow:inset 0 0 0 ${rim}px ${RIM_COLOUR}"></div>`
      : ''
  }
</div></body></html>`;
}

async function render(size, round) {
  const page = await browser.newPage({ viewport: { width: size, height: size } });
  await page.setContent(markup(size, round));
  const png = await page.screenshot({ omitBackground: true });
  await page.close();
  return png;
}

for (const { size, round, name } of OUTPUTS) {
  const png = await render(size, round);
  writeFileSync(join(PUBLIC, name), png);
  console.log(`${name.padEnd(22)} ${png.length} bytes`);
}

if (process.argv.includes('--sheet')) {
  // The real icons at their real sizes, and magnified beside themselves, over
  // light, dark and coloured bars — the only honest way to judge a favicon.
  const sizes = [16, 32, 48, 64];
  const shots = {};
  for (const size of sizes) shots[size] = (await render(size, true)).toString('base64');

  const page = await browser.newPage({ viewport: { width: 620, height: 340 } });
  await page.setContent(`<!doctype html><body style="margin:0;font:12px sans-serif">
${[
  ['#ffffff', '#111'],
  ['#1f1f1f', '#eee'],
  ['#3b6ea5', '#fff'],
]
  .map(
    ([bg, fg]) => `<div style="background:${bg};color:${fg};padding:12px 16px;
      display:flex;align-items:center;gap:22px">
  <span style="width:64px">${bg}</span>
  ${sizes
    .map(
      (size) => `<span style="display:flex;flex-direction:column;align-items:center;gap:5px">
    <img src="data:image/png;base64,${shots[size]}" width="${size}" height="${size}">
    <img src="data:image/png;base64,${shots[size]}" width="56" height="56" style="image-rendering:pixelated">
    <span>${size}px</span></span>`
    )
    .join('')}
</div>`
  )
  .join('')}
</body>`);
  writeFileSync(join(PUBLIC, '..', 'icon-sheet.png'), await page.screenshot());
  console.log('icon-sheet.png written next to package.json (not shipped)');
  await page.close();
}

await browser.close();
