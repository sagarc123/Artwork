// Builds the app icons (favicon, Apple, PWA) from one SVG. Run: npm run icons
// Replace the SVG with the real logo once the brand is final, then re-run.
import sharp from 'sharp'
import { mkdirSync } from 'node:fs'

const petals = [0, 45, 90, 135, 180, 225, 270, 315]
  .map((a) => `<path d="M0,-9 C7,-18 7,-32 0,-42 C-7,-32 -7,-18 0,-9Z" transform="rotate(${a})"/>`)
  .join('')

/** pad = share of the canvas kept empty around the mandala (maskable icons need ~20%). */
const svg = (pad) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="-50 -50 100 100">
  <rect x="-50" y="-50" width="100" height="100" fill="#A6261D"/>
  <g transform="scale(${1 - pad})" fill="none" stroke-linecap="round">
    <circle r="46" stroke="#F2B705" stroke-width="2.5" stroke-dasharray="1 3"/>
    <circle r="27" stroke="#FAF6EF" stroke-width="2"/>
    <g stroke="#FAF6EF" stroke-width="3">${petals}</g>
    <circle r="7" fill="#F2B705"/>
  </g>
</svg>`

const out = [
  ['public/icons/icon-192.png', 192, 0.08],
  ['public/icons/icon-512.png', 512, 0.08],
  ['public/icons/maskable-512.png', 512, 0.3],
  ['src/app/apple-icon.png', 180, 0.12],
  ['src/app/icon.png', 64, 0.04],
]

mkdirSync('public/icons', { recursive: true })
for (const [file, size, pad] of out) {
  await sharp(Buffer.from(svg(pad))).resize(size, size).png().toFile(file)
  console.log('wrote', file)
}
