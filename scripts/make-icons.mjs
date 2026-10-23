// Builds the app icons (favicon, Apple, PWA) from the brand mark "Bindu". Run: npm run icons
// The stroke is the same shape as BrandMark in src/components/Art.tsx.
import sharp from 'sharp'
import { mkdirSync } from 'node:fs'

const STROKE = 'M13.01,-2.77L13.72,-1.04L13.97,0.82L13.92,2.71L13.58,4.6L12.96,6.43L12.08,8.16L10.96,9.77L9.61,11.21L8.07,12.46L6.36,13.48L4.52,14.26L2.58,14.78L0.58,15.03L-1.43,15L-3.43,14.69L-5.36,14.11L-7.2,13.27L-8.9,12.19L-10.44,10.88L-11.79,9.38L-12.91,7.71L-13.8,5.9L-14.42,3.99L-14.78,2.02L-14.87,0.03L-14.68,-1.95L-14.23,-3.87L-13.53,-5.71L-12.58,-7.43L-11.41,-9L-10.05,-10.38L-8.52,-11.56L-6.85,-12.51L-5.09,-13.22L-3.25,-13.67L-1.38,-13.87L0.48,-13.81L2.29,-13.49L4.03,-12.91L5.62,-12.05L5.54,-11.87L3.83,-12.29L2.13,-12.54L0.43,-12.58L-1.24,-12.4L-2.86,-12.01L-4.4,-11.42L-5.83,-10.64L-7.15,-9.69L-8.32,-8.59L-9.32,-7.35L-10.15,-6L-10.79,-4.56L-11.24,-3.06L-11.49,-1.52L-11.53,0.03L-11.37,1.56L-11.02,3.05L-10.48,4.48L-9.76,5.82L-8.87,7.06L-7.84,8.17L-6.67,9.13L-5.39,9.93L-4.01,10.57L-2.57,11.02L-1.08,11.28L0.44,11.35L1.96,11.22L3.45,10.9L4.9,10.39L6.28,9.7L7.57,8.83L8.75,7.8L9.79,6.62L10.69,5.3L11.43,3.87L11.99,2.34L12.38,0.72L12.6,-0.95L12.81,-2.72Z'

/** pad = share of the canvas kept empty around the mark (maskable icons need ~20%). */
const svg = (pad) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="-17 -17 34 34">
  <rect x="-17" y="-17" width="34" height="34" fill="#FAF6EF"/>
  <g transform="scale(${1 - pad})">
    <path d="${STROKE}" fill="#1E1B18"/>
    <circle cx="10.4" cy="-8.13" r="2.8" fill="#A6261D"/>
  </g>
</svg>`

const out = [
  ['public/icons/icon-192.png', 192, 0.08],
  ['public/icons/icon-512.png', 512, 0.08],
  ['public/icons/maskable-512.png', 512, 0.3],
  ['src/app/apple-icon.png', 180, 0.12],
  ['src/app/icon.png', 64, 0.02],
]

mkdirSync('public/icons', { recursive: true })
for (const [file, size, pad] of out) {
  await sharp(Buffer.from(svg(pad))).resize(size, size).png().toFile(file)
  console.log('wrote', file)
}
