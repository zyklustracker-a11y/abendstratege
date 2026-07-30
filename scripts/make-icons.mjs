/**
 * Erzeugt alle Icon-Dateien aus einer einzigen SVG-Quelle (../assets/icon.svg).
 *
 *   node scripts/make-icons.mjs
 *
 * Ergebnis in public/: favicon.svg, favicon.ico, apple-touch-icon.png,
 * icon-192.png, icon-512.png, icon-maskable-512.png, badge-72.png.
 * Die Dateien sind eingecheckt – das Skript muss nur laufen, wenn sich das
 * Icon-Design ändert.
 *
 * Eine Kopie des Monogramms steht zusätzlich im Ladebildschirm in index.html:
 * Sie ist dort inline, damit sie ohne eigenen Abruf mit dem ersten Frame steht.
 * Wer das Icon ändert, zieht sie mit.
 */
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import sharp from 'sharp'

const here = dirname(fileURLToPath(import.meta.url))
const root = join(here, '..')
const out = join(root, 'public')

const source = await readFile(join(root, 'assets', 'icon.svg'), 'utf8')

/** Vollflächige Variante mit abgerundeten Ecken – für das Browser-Tab. */
function rounded(svg) {
  return svg.replace(
    '<rect width="512" height="512" fill="url(#ground)"/>',
    '<rect width="512" height="512" rx="112" ry="112" fill="url(#ground)"/>',
  )
}

/**
 * Maskable-Variante: Android beschneidet Icons zu Kreisen und Sonderformen.
 * Das Zeichen wird stärker verkleinert, damit es in der Schutzzone bleibt;
 * der Grund bleibt vollflächig.
 */
function maskable(svg) {
  return svg.replace('scale(0.86)', 'scale(0.58)')
}

/** Einfarbige Silhouette auf transparentem Grund – Android-Badge. */
function badge(svg) {
  return svg
    .replace('<rect width="512" height="512" fill="url(#ground)"/>', '')
    .replace('fill="url(#brass)"', 'fill="#ffffff"')
}

const png = (svg, size) =>
  sharp(Buffer.from(svg), { density: 512 }).resize(size, size).png({ compressionLevel: 9 }).toBuffer()

/**
 * ICO-Container von Hand: Windows/Browser akzeptieren seit Vista eingebettete
 * PNG-Daten, damit entfällt eine weitere Abhängigkeit.
 */
function ico(images) {
  const header = Buffer.alloc(6)
  header.writeUInt16LE(0, 0)
  header.writeUInt16LE(1, 2)
  header.writeUInt16LE(images.length, 4)

  const entries = []
  let offset = 6 + images.length * 16
  for (const { size, data } of images) {
    const entry = Buffer.alloc(16)
    entry.writeUInt8(size >= 256 ? 0 : size, 0)
    entry.writeUInt8(size >= 256 ? 0 : size, 1)
    entry.writeUInt8(0, 2)
    entry.writeUInt8(0, 3)
    entry.writeUInt16LE(1, 4)
    entry.writeUInt16LE(32, 6)
    entry.writeUInt32LE(data.length, 8)
    entry.writeUInt32LE(offset, 12)
    entries.push(entry)
    offset += data.length
  }

  return Buffer.concat([header, ...entries, ...images.map((i) => i.data)])
}

/**
 * Startbilder für iOS. Eine zum Home-Bildschirm gelegte Web-App zeigt beim
 * Start sonst eine leere Fläche, bis das Dokument steht – erst danach kann der
 * Ladebildschirm aus index.html übernehmen. Apple verlangt dafür ein Bild je
 * Gerätegröße, punktgenau, sonst greift keines.
 *
 * Die Bilder bilden denselben Aufbau ab wie der Ladebildschirm: derselbe
 * Verlauf, dasselbe Monogramm an derselben Stelle, der Balken noch leer. Der
 * Übergang fällt dadurch nicht auf.
 */
const STARTBILDER = [
  // Breite und Höhe in CSS-Punkten, dazu die Pixeldichte.
  { breite: 375, hoehe: 667, dichte: 2 }, // iPhone SE, 8
  { breite: 414, hoehe: 736, dichte: 3 }, // iPhone 8 Plus
  { breite: 375, hoehe: 812, dichte: 3 }, // iPhone X, XS, 11 Pro
  { breite: 414, hoehe: 896, dichte: 2 }, // iPhone XR, 11
  { breite: 414, hoehe: 896, dichte: 3 }, // iPhone XS Max, 11 Pro Max
  { breite: 360, hoehe: 780, dichte: 3 }, // iPhone 12/13 mini
  { breite: 390, hoehe: 844, dichte: 3 }, // iPhone 12, 13, 14, 16e
  { breite: 428, hoehe: 926, dichte: 3 }, // iPhone 12/13 Pro Max, 14 Plus
  { breite: 393, hoehe: 852, dichte: 3 }, // iPhone 14 Pro, 15, 16
  { breite: 430, hoehe: 932, dichte: 3 }, // iPhone 14 Pro Max, 15/16 Plus
  { breite: 402, hoehe: 874, dichte: 3 }, // iPhone 16 Pro
  { breite: 440, hoehe: 956, dichte: 3 }, // iPhone 16 Pro Max
]

/** Muss mit den Werten im Ladebildschirm (index.html) übereinstimmen. */
function aufbau(breite, hoehe) {
  const logo = Math.min(128, Math.max(96, breite * 0.3))
  const balken = Math.min(220, breite * 0.56)
  const abstand = 38
  const block = logo + abstand + 4
  const oben = (hoehe - block) / 2
  return { logo, balken, logoOben: oben, balkenOben: oben + logo + abstand }
}

function startbild(breite, hoehe) {
  const { logo, balken, logoOben, balkenOben } = aufbau(breite, hoehe)
  const monogramm = source
    .replace(/<svg[^>]*>/, '')
    .replace('</svg>', '')
    .replace('<rect width="512" height="512" fill="url(#ground)"/>', '')
    // Ohne die Platte des Icons steht das Zeichen frei – und damit ungeschrumpft,
    // genau wie im Ladebildschirm.
    .replace('transform="translate(256 256) scale(0.86) translate(-256 -256)" ', '')

  /*
   * Derselbe Verlauf wie im Ladebildschirm, dort als
   * `radial-gradient(120% 90% at 50% 18%, …)`. CSS beschreibt damit eine
   * Ellipse, SVG kennt nur Kreise – die Höhe kommt deshalb über
   * gradientTransform dazu. Ohne das zuckt der Übergang vom Startbild zum
   * Dokument merklich.
   */
  const mx = breite / 2
  const my = hoehe * 0.18
  const rx = breite * 0.6
  const streckung = (hoehe * 0.45) / rx

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${breite}" height="${hoehe}" viewBox="0 0 ${breite} ${hoehe}">
  <defs>
    <radialGradient id="grund" gradientUnits="userSpaceOnUse" cx="${mx}" cy="${my}" r="${rx}"
      gradientTransform="translate(${mx} ${my}) scale(1 ${streckung.toFixed(4)}) translate(${-mx} ${-my})">
      <stop offset="0%" stop-color="#151d29"/>
      <stop offset="62%" stop-color="#0e131c"/>
      <stop offset="100%" stop-color="#0b0f16"/>
    </radialGradient>
  </defs>
  <rect width="${breite}" height="${hoehe}" fill="url(#grund)"/>
  <svg x="${(breite - logo) / 2}" y="${logoOben}" width="${logo}" height="${logo}" viewBox="0 0 512 512">${monogramm}</svg>
  <rect x="${(breite - balken) / 2}" y="${balkenOben}" width="${balken}" height="4" rx="2" fill="#c9a35f" fill-opacity="0.16"/>
</svg>`
}

await mkdir(out, { recursive: true })
await mkdir(join(out, 'start'), { recursive: true })

await writeFile(join(out, 'favicon.svg'), rounded(source))

await writeFile(join(out, 'apple-touch-icon.png'), await png(source, 180))
await writeFile(join(out, 'icon-192.png'), await png(source, 192))
await writeFile(join(out, 'icon-512.png'), await png(source, 512))
await writeFile(join(out, 'icon-maskable-512.png'), await png(maskable(source), 512))
await writeFile(join(out, 'badge-72.png'), await png(badge(source), 72))

const roundedSvg = rounded(source)
await writeFile(
  join(out, 'favicon.ico'),
  ico(
    await Promise.all(
      [16, 32, 48, 64].map(async (size) => ({ size, data: await png(roundedSvg, size) })),
    ),
  ),
)

const linkZeilen = []
for (const { breite, hoehe, dichte } of STARTBILDER) {
  const datei = `start-${breite}x${hoehe}@${dichte}x.png`
  await writeFile(
    join(out, 'start', datei),
    await sharp(Buffer.from(startbild(breite, hoehe)), { density: 72 * dichte })
      .resize(breite * dichte, hoehe * dichte)
      .png({ compressionLevel: 9 })
      .toBuffer(),
  )
  linkZeilen.push(
    `    <link rel="apple-touch-startup-image" href="/start/${datei}" media="(device-width: ${breite}px) and (device-height: ${hoehe}px) and (-webkit-device-pixel-ratio: ${dichte}) and (orientation: portrait)" />`,
  )
}

console.log('Icons geschrieben nach public/')
console.log(`${STARTBILDER.length} Startbilder geschrieben nach public/start/`)
console.log('Nicht vergessen: das Monogramm im Ladebildschirm in index.html abgleichen.')
console.log('\nDie passenden Zeilen für den <head> in index.html:\n')
console.log(linkZeilen.join('\n'))
