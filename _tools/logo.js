/**
 * Limpia el recorte del logo real de FUNDASPED.
 * El PNG de origen arrastra un halo blanco y fragmentos de texto del documento.
 * Se descartan los pixeles sin saturacion y se conserva unicamente la region
 * conectada mas grande (el cerebro). No se altera forma, color ni proporcion.
 */
const sharp = require('sharp');
const fs = require('fs');

(async () => {
  const W = 360, H = 326;
  const { data } = await sharp('_raw/web/img-001-001.png').raw().toBuffer({ resolveWithObject: true });
  const mask = await sharp('_raw/web/img-001-002.png').toColourspace('b-w').raw().toBuffer();

  const alpha = new Uint8Array(W * H);
  for (let p = 0; p < W * H; p++) {
    const r = data[p * 3], g = data[p * 3 + 1], b = data[p * 3 + 2];
    const max = Math.max(r, g, b), min = Math.min(r, g, b);
    let keep = Math.max(0, Math.min(1, (max - min - 18) / 30));
    if (max < 45) keep = 0;
    alpha[p] = Math.round(mask[p] * keep);
  }

  // Componentes conectados sobre alpha > 40
  const label = new Int32Array(W * H).fill(-1);
  const sizes = [];
  const stack = [];
  for (let s = 0; s < W * H; s++) {
    if (alpha[s] <= 40 || label[s] !== -1) continue;
    const id = sizes.length; sizes.push(0); stack.push(s); label[s] = id;
    while (stack.length) {
      const p = stack.pop(); sizes[id]++;
      const x = p % W, y = (p / W) | 0;
      for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
        const nx = x + dx, ny = y + dy;
        if (nx < 0 || ny < 0 || nx >= W || ny >= H) continue;
        const q = ny * W + nx;
        if (alpha[q] > 40 && label[q] === -1) { label[q] = id; stack.push(q); }
      }
    }
  }
  const main = sizes.indexOf(Math.max(...sizes));
  console.log('componentes:', sizes.length, 'principal:', sizes[main], 'px');

  // Los pixeles suaves (alpha 1..40) solo sobreviven si tocan la region principal
  const out = Buffer.alloc(W * H * 4);
  let minX = W, minY = H, maxX = 0, maxY = 0;
  for (let p = 0; p < W * H; p++) {
    let a = alpha[p];
    if (a > 0 && label[p] !== main) {
      let touch = false;
      const x = p % W, y = (p / W) | 0;
      for (let dy = -2; dy <= 2 && !touch; dy++) for (let dx = -2; dx <= 2; dx++) {
        const nx = x + dx, ny = y + dy;
        if (nx < 0 || ny < 0 || nx >= W || ny >= H) continue;
        if (label[ny * W + nx] === main) { touch = true; break; }
      }
      if (!touch) a = 0;
    }
    out[p * 4] = data[p * 3]; out[p * 4 + 1] = data[p * 3 + 1]; out[p * 4 + 2] = data[p * 3 + 2]; out[p * 4 + 3] = a;
    if (a > 16) {
      const x = p % W, y = (p / W) | 0;
      if (x < minX) minX = x; if (x > maxX) maxX = x;
      if (y < minY) minY = y; if (y > maxY) maxY = y;
    }
  }
  const png = await sharp(out, { raw: { width: W, height: H, channels: 4 } })
    .extract({ left: minX, top: minY, width: maxX - minX + 1, height: maxY - minY + 1 })
    .png().toBuffer();
  fs.writeFileSync('_tools/logo-mark.png', png);
  const m = await sharp(png).metadata();
  console.log('recorte final ->', m.width + 'x' + m.height);
  await sharp(png).flatten({ background: { r: 14, g: 27, b: 51 } }).resize({ width: 640, kernel: 'nearest' })
    .png().toFile('_raw/logo-check.png');
})();
