/**
 * Procesa los assets reales de FUNDASPED (logo + fotografías institucionales)
 * hacia WebP optimizado. Nunca amplía: el ancho de salida se limita al original.
 */
const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const NAVY = { r: 0x0e, g: 0x1b, b: 0x33 };
const OUT = 'assets/img';

const PHOTOS = [
  { src: '_raw/jimdo/foto-06.jpg',        out: 'hero',        widths: [640, 480, 360] },
  // Recorte vertical para la foto que se superpone en el hero.
  { src: '_raw/jimdo/foto-05.jpg',        out: 'hero-sec',    widths: [360, 260], crop: { width: 360, height: 480, position: 'north' } },
  { src: '_raw/brochure/img-002-002.png', out: 'girardota',   widths: [546, 400] },
  { src: '_raw/brochure/img-002-003.png', out: 'encenillos',  widths: [458, 400] },
  { src: '_raw/jimdo/banner-01.jpg',      out: 'taller-01',   widths: [960, 640, 420] },
  { src: '_raw/jimdo/banner-02.jpg',      out: 'taller-02',   widths: [960, 640, 420] },
  { src: '_raw/jimdo/foto-01.jpg',        out: 'grupo-01',    widths: [640, 420] },
  { src: '_raw/jimdo/foto-09.jpg',        out: 'aula-01',     widths: [640, 420] },
  { src: '_raw/jimdo/foto-10.jpg',        out: 'grupo-02',    widths: [640, 420] },
  { src: '_raw/jimdo/foto-03.jpg',        out: 'entrega-01',  widths: [640, 420] },
  { src: '_raw/jimdo/foto-12.jpg',        out: 'entrega-02',  widths: [640, 420] },
  { src: '_raw/brochure/img-003-004.png', out: 'certificado', widths: [640, 480] }
];


(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const report = {};

  // ---- Logo aplanado sobre navy (evita el bug de Chromium con PNG alfa) ----
  const base = fs.readFileSync('_tools/logo-mark.png'); // recorte limpio generado por _tools/logo.js
  for (const w of [72, 144, 216]) {
    await sharp(base).resize({ width: w })
      .flatten({ background: NAVY })
      .webp({ quality: 90 }).toFile(`${OUT}/logo-navy-${w}.webp`);
  }
  // Favicons (cuadrado navy con el cerebro centrado)
  for (const s of [32, 180, 512]) {
    const mark = await sharp(base).resize({ width: Math.round(s * 0.74) }).flatten({ background: NAVY }).png().toBuffer();
    await sharp({ create: { width: s, height: s, channels: 3, background: NAVY } })
      .composite([{ input: mark, gravity: 'center' }])
      .png({ compressionLevel: 9 }).toFile(`${OUT}/favicon-${s}.png`);
  }

  // ---- Open Graph 1200x630, compuesto con la identidad propia ----
  const markOg = await sharp(base).resize({ width: 150 }).flatten({ background: NAVY }).png().toBuffer();
  const svgOg = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630">
    <rect width="1200" height="630" fill="#0e1b33"/>
    <rect x="0" y="0" width="1200" height="6" fill="#c9971a"/>
    <text x="96" y="300" font-family="Georgia,serif" font-size="72" fill="#ffffff">Formamos lectores expertos.</text>
    <text x="96" y="360" font-family="Georgia,serif" font-size="34" fill="#e3b54a" font-style="italic">Técnicas de Lectura Rápida, Comprensión y Retención</text>
    <line x1="96" y1="420" x2="1104" y2="420" stroke="#c9971a" stroke-opacity="0.45"/>
    <text x="96" y="468" font-family="Helvetica,Arial,sans-serif" font-size="22" fill="#b9c3d6" letter-spacing="3">FUNDASPED · FUNDACIÓN EDUCATIVA ASESORÍAS PEDAGÓGICAS · DESDE 1994</text>
    <text x="96" y="504" font-family="Helvetica,Arial,sans-serif" font-size="22" fill="#8f9cb5" letter-spacing="3">ENTIDAD SIN ÁNIMO DE LUCRO · MEDELLÍN · ANTIOQUIA</text>
  </svg>`);
  await sharp(svgOg).composite([{ input: markOg, top: 90, left: 96 }]).jpeg({ quality: 86 }).toFile(`${OUT}/og-fundasped.jpg`);

  // ---- Fotografías institucionales ----
  for (const p of PHOTOS) {
    const meta = await sharp(p.src).metadata();
    const widths = [...new Set(p.widths.map(w => Math.min(w, meta.width)))].sort((a, b) => b - a);
    for (const w of widths) {
      const pipe = sharp(p.src);
      if (p.crop) {
        const h = Math.round(w * p.crop.height / p.crop.width);
        pipe.resize({ width: w, height: h, fit: 'cover', position: p.crop.position, withoutEnlargement: true });
      } else {
        pipe.resize({ width: w, withoutEnlargement: true });
      }
      await pipe.webp({ quality: 82 }).toFile(`${OUT}/${p.out}-${w}.webp`);
    }
    report[p.out] = { origen: path.basename(p.src), original: `${meta.width}x${meta.height}`, anchos: widths, alto: p.crop ? Math.round(widths[0] * p.crop.height / p.crop.width) : Math.round(widths[0] * meta.height / meta.width) };
  }

  fs.writeFileSync('_tools/imagenes.json', JSON.stringify(report, null, 2));
  console.table(report);
})();
