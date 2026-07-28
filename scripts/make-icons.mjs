/**
 * Erzeugt alle Icon-Dateien aus einer einzigen SVG-Quelle (../assets/icon.svg).
 *
 *   node scripts/make-icons.mjs
 *
 * Ergebnis in public/: favicon.svg, favicon.ico, apple-touch-icon.png,
 * icon-192.png, icon-512.png, icon-maskable-512.png, badge-72.png.
 * Die Dateien sind eingecheckt – das Skript muss nur laufen, wenn sich das
 * Icon-Design ändert.
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

await mkdir(out, { recursive: true })

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

console.log('Icons geschrieben nach public/')
