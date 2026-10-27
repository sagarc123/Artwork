// Medium-correct stand-ins until real photos exist: a charcoal sketch for drawings and portraits, a loose wash for paintings.
// All decorative (aria-hidden); the surrounding PhotoPlaceholder carries the alt text.
import { useId } from 'react'
import { r1 } from '@/lib/art'
import { seededRandom } from '@/lib/seed'

/** Shared SVG filters, defined once per page (in the [lang] layout). */
export function ArtDefs() {
  return (
    <svg aria-hidden="true" width="0" height="0" className="absolute">
      <defs>
        {/* Powder: grainy, displaced edges and a speckle of gaps inside the colour. */}
        <filter id="powder" x="-5%" y="-5%" width="110%" height="110%">
          <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed="4" result="n" />
          <feDisplacementMap in="SourceGraphic" in2="n" scale="0.9" xChannelSelector="R" yChannelSelector="G" result="d" />
          <feTurbulence type="fractalNoise" baseFrequency="2.2" numOctaves="1" seed="9" result="s" />
          <feColorMatrix in="s" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  -5 0 0 0 3.6" result="m" />
          <feComposite in="d" in2="m" operator="in" />
        </filter>
        {/* Charcoal rubbed with a finger. */}
        <filter id="smudge" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="1.6" />
        </filter>
        {/* Watercolour: wobbly, bleeding edges. */}
        <filter id="wash" x="-10%" y="-10%" width="120%" height="120%">
          <feTurbulence type="fractalNoise" baseFrequency="0.045" numOctaves="3" seed="2" result="n" />
          <feDisplacementMap in="SourceGraphic" in2="n" scale="7" xChannelSelector="R" yChannelSelector="G" result="d" />
          <feGaussianBlur in="d" stdDeviation="0.35" />
        </filter>
      </defs>
    </svg>
  )
}

/** Same drawing, a slightly different hand each pass: nudge every number by up to ±amt/2. */
const jitter = (d: string, rand: () => number, amt: number) => d.replace(/-?\d+(\.\d+)?/g, (n) => String(r1(+n + (rand() - 0.5) * amt)))

type Box = [number, number, number, number]
/** lines: contours gone over three times · accents: the few dark, sure marks · dark/soft: smudged tone · shade: hatched side · bg: loose background scribble. */
type Subject = { lines: string; accents: string; dark: string; soft: string; shade: string; box: Box; bg: Box; iris?: string }

const FACE: Subject = {
  lines:
    'M34 42C34 58 40 70 50 74C60 70 66 58 66 42' + // jaw
    'M38 39.5C41 37.5 45 37.5 47.5 39M52.5 39C55 37.5 59 37.5 62 39.5' + // brows
    'M40 44.5C42 42.5 46 42.5 47 44.5C45 45.8 42 45.8 40 44.5M53 44.5C54 42.5 58 42.5 60 44.5C58 45.8 55 45.8 53 44.5' + // eyes
    'M50 46C49.5 51 47.5 54.5 48 56.5C49.5 57.8 51.5 57.8 53 56.6' + // nose
    'M44 63C47 61.6 53 61.6 56 63M44.6 63.3C47.5 66.2 52.5 66.2 55.4 63.3' + // lips
    'M34 45C31 44 30.5 51 34.5 53M66 45C69 44 69.5 51 65.5 53' + // ears
    'M44 71C44.5 77 43.5 81 41 83M56 71C55.5 77 56.5 81 59 83' + // neck
    'M41 83C30 85 20 89 14 100M59 83C70 85 80 89 86 100M42 86C46 93 54 93 58 86' + // shoulders
    'M33 46C29 27 40 15 52 15C65 15 73 27 67 46M35 40C37 30 44 25 50 26C56 25 63 30 65 40' + // hair
    'M38 36C40 28 46 23 52 22M42 33C45 27 50 24 56 24M60 26C64 29 66 34 66 40M36 42C35 36 36 31 39 27', // strands
  accents: 'M40 44.4C42 42.3 46 42.3 47 44.4M53 44.4C54 42.3 58 42.3 60 44.4M47.6 56.4C48.4 57.2 49.4 57.2 50 56.9M51.2 56.9C51.8 57.2 52.5 57.1 53 56.6M44.6 63.2C47.5 64 52.5 64 55.4 63.2',
  dark: 'M33 46C29 27 40 15 52 15C65 15 73 27 67 46C66 37 62 29 51 26C42 27 36 33 35 46Z',
  soft:
    'M39 41C42 40 46 40.5 48 42.5C45 43 42 43 39 42.5ZM52 42.5C54 40.5 58 40 61 41C61 42.5 58 43 52 42.5Z' + // eye sockets
    'M51 47C52.5 51 53.5 54 53 56.5C51.5 55 51 50 51 47Z' + // side of the nose
    'M46 66.5C48.5 68.5 51.5 68.5 54 66.5C52 67.5 48 67.5 46 66.5Z' + // under the lip
    'M44 72C47 75 53 75 56 72L56 80C52 78 48 78 44 80Z', // under the chin
  shade: 'M59 32C66 36 67 48 65 57C62 66 57 71 51 74C57 66 61 57 61 46C61 40 60 36 59 32ZM59 83C70 85 80 89 86 100H66C64 92 61 87 59 83Z',
  box: [50, 30, 36, 70],
  bg: [70, 6, 26, 62],
  iris: 'M43.6 44.1h.1M56.5 44.1h.1',
}
const BUN_LINE = 'M57 15C59 7 70 6 72 13C73 19 66 22 61 19M50 16C49 20 49 23 50 26'
const BUN = 'M57 15C59 7 70 6 72 13C73 19 66 22 61 19Z'

const STILL: Subject = {
  lines:
    'M6 82C30 80 70 81 96 79' + // table edge
    'M38 80C26 74 25 58 36 50C34 46 36 43 41 42C46 41 54 41 59 42C64 43 66 46 64 50C75 58 74 74 62 80C54 82 46 82 38 80' + // lota
    'M40 42C42 39 58 39 60 42M31 62C43 66 57 66 69 62M43 52C40 56 39 62 40 66' +
    'M68 80C64 76 66 68 72 67C79 66 84 72 81 78C79 81 72 82 68 80M72 67C72 64 73 62 75 61M75 61C80 56 87 57 89 60C84 63 79 63 75 61' + // mango
    'M17 80C13 74 17 67 24 67C30 67 33 74 30 79C27 82 20 82 17 80', // fruit
  accents: 'M40 42C42 39 58 39 60 42M38 80C46 82 54 82 62 80M68 80C72 82 79 81 81 78',
  dark: 'M62 81C70 83 84 83 94 80C84 78 72 78 62 81Z',
  soft: 'M26 68C31 70 33 76 29 80C25 81 22 81 19 80C26 78 28 73 26 68ZM58 44C66 47 74 60 70 72C68 77 64 80 58 81C64 72 64 56 58 44ZM77 68C81 70 82 75 80 78C78 80 75 80 73 79C77 77 78 72 77 68Z',
  shade: 'M58 44C66 47 74 60 70 72C68 77 64 80 58 81C64 72 64 56 58 44Z',
  box: [56, 42, 20, 40],
  bg: [8, 20, 26, 55],
}

/** Seeded pose shared by the sketch and the "photo" of the same sitter: hair up or not, mirrored, head tilt. */
function pose(seed: string) {
  const rand = seededRandom(seed)
  const bun = rand() < 0.5
  const flip = rand() < 0.5
  const tilt = r1((rand() - 0.5) * 6)
  return { rand, bun, transform: `rotate(${tilt} 50 55)${flip ? ' translate(100 0) scale(-1 1)' : ''}` }
}

/** Diagonal hatching across a box, each stroke a different length so the edge stays ragged like a real hand's. */
function hatch([bx, by, bw, bh]: Box, rand: () => number, gap: number) {
  let d = ''
  for (let x = bx - bh; x < bx + bw; x += gap) {
    const skip = rand() * bh * 0.3
    const len = bh * (0.5 + rand() * 0.5) - skip
    d += `M${r1(x + skip + rand() * 0.6)},${r1(by + bh - skip)}l${r1(len)},${r1(-len)}`
  }
  return d
}

/** Charcoal sketch on cream paper: a face (portraits) or a still life, each line gone over a few times, shadows hatched and smudged. */
// `scribble={false}`: no loose background scribble (the home hero, where every KB of HTML counts twice).
export function SketchStandIn({ seed, subject, scribble = true }: { seed: string; subject: 'face' | 'still'; scribble?: boolean }) {
  const id = `k${useId().replace(/[^\w-]/g, '')}`
  const { rand, bun, transform } = pose(seed)
  const s: Subject = subject === 'face' && bun ? { ...FACE, lines: FACE.lines + BUN_LINE, dark: FACE.dark + BUN } : subject === 'face' ? FACE : STILL
  const ink = '#2a2522'
  const bg = hatch(s.bg, rand, 3) // worked out even when not drawn, so the rest keeps the same hand
  return (
    <svg viewBox="0 0 100 100" aria-hidden="true" focusable="false" className="size-[86%]">
      <defs>
        <clipPath id={id}>
          <path d={s.shade} />
        </clipPath>
      </defs>
      <g transform={transform} fill="none" stroke={ink} strokeLinecap="round" strokeLinejoin="round">
        {/* Loose scribble behind the subject, the way a sketch is blocked in. */}
        {/* Always there, maybe empty: the draw-in CSS counts children. */}
        <path d={scribble ? bg : undefined} strokeWidth={0.35} opacity={0.18} pathLength={1} />
        <g className="fx" filter="url(#smudge)" stroke="none" fill={ink}>
          <path d={s.dark} opacity={0.62} />
          <path d={s.soft} opacity={0.3} />
          <path d={s.shade} opacity={0.24} />
        </g>
        <path d={hatch(s.box, rand, 2)} clipPath={`url(#${id})`} strokeWidth={0.3} opacity={0.5} pathLength={1} />
        {/* ponytail: two passes per line; a third looked nicer but cost ~1.5 KB per sketch in page HTML. */}
        {[
          [0.8, 0.6, 0.75],
          [2.2, 0.32, 0.35],
        ].map(([amt, w, o], i) => (
          <path key={i} d={jitter(s.lines, rand, amt)} strokeWidth={w} opacity={o} pathLength={1} />
        ))}
        <path d={jitter(s.accents, rand, 0.3)} strokeWidth={0.95} opacity={0.85} pathLength={1} />
        {s.iris && <path d={s.iris} strokeWidth={2.6} opacity={0.9} />}
      </g>
    </svg>
  )
}

/** The sitter's snapshot for "your photo → drawn by hand": flat colour shapes, the same pose as the sketch. */
export function PhotoStandIn({ seed }: { seed: string }) {
  const { bun, transform } = pose(seed)
  return (
    <svg viewBox="0 0 100 100" preserveAspectRatio="xMidYMid slice" aria-hidden="true" focusable="false" className="size-full">
      <rect width="100" height="100" fill="#d9cbb3" />
      <rect x="62" width="38" height="100" fill="#cdbd9f" />
      <g transform={transform}>
        <path d="M41 83C30 85 20 89 14 100H86C80 89 70 85 59 83C55 88 45 88 41 83Z" fill="#0b5e73" />
        <path d="M44 68V83C47 87 53 87 56 83V68Z" fill="#a8704c" />
        <path d="M34 45C30 44 30 52 35 53ZM66 45C70 44 70 52 65 53Z" fill="#b97d57" />
        <path d="M34 42C34 58 40 70 50 74C60 70 66 58 66 42C66 30 60 24 50 24C40 24 34 30 34 42Z" fill="#c68c63" />
        <path d={FACE.shade} fill="#000" opacity={0.12} />
        <path d={FACE.dark + (bun ? BUN : '')} fill="#2b211c" />
        <path d="M40 44.5C42 42.5 46 42.5 47 44.5C45 45.8 42 45.8 40 44.5ZM53 44.5C54 42.5 58 42.5 60 44.5C58 45.8 55 45.8 53 44.5Z" fill="#efe6da" />
        <path d="M43.6 44.1h.1M56.5 44.1h.1" stroke="#2b211c" strokeWidth={2.6} strokeLinecap="round" />
        <path
          d="M38 39.5C41 37.5 45 37.5 47.5 39M52.5 39C55 37.5 59 37.5 62 39.5M40 44.5C42 42.5 46 42.5 47 44.5M53 44.5C54 42.5 58 42.5 60 44.5M48.5 55.5C49.5 57 51.5 57 52.5 55.5M45 63C48 62 52 62 55 63"
          fill="none"
          stroke="#4a2c1d"
          strokeWidth={1}
          strokeLinecap="round"
          pathLength={1}
        />
        <path d="M45 63C48 65.5 52 65.5 55 63Z" fill="#8f4a3c" />
      </g>
    </svg>
  )
}

const SCHEMES = [
  { sky: ['#e8890c', '#d6457a'], sun: '#f2b705', hill: '#6b4a6e', land: '#0b5e73' }, // dusk on the river
  { sky: ['#7d97a3', '#0b5e73'], sun: '#d9d4c7', hill: '#2e6b3c', land: '#5aa16a' }, // monsoon
  { sky: ['#f2b705', '#7fc3d3'], sun: '#e8890c', hill: '#5aa16a', land: '#c9a46a' }, // morning fields
  { sky: ['#7fc3d3', '#f39ab8'], sun: '#f2b705', hill: '#1a8aa3', land: '#0b5e73' }, // ghat at dawn
]

/** Loose watercolour landscape on paper: translucent washes with bleeding edges and a few dry-brush marks. */
export function WashStandIn({ seed }: { seed: string }) {
  const rand = seededRandom(seed)
  const sc = SCHEMES[Math.floor(rand() * SCHEMES.length)]
  const h = r1(38 + rand() * 16)
  const sun = [r1(20 + rand() * 60), r1(h * 0.45 + rand() * 8)]
  let hills = `M4 ${h + 2}`
  for (let x = 4; x < 96; x += 23) hills += `Q${r1(x + 11)} ${r1(h - 6 - rand() * 12)} ${x + 23} ${r1(h + rand() * 4)}`
  const marks = Array.from({ length: 5 }, () => `M${r1(10 + rand() * 60)} ${r1(h + 22 + rand() * 30)}h${r1(8 + rand() * 18)}`).join('')
  const birds = Array.from({ length: 3 }, () => {
    const [x, y] = [r1(30 + rand() * 50), r1(10 + rand() * (h * 0.4))]
    return `M${x} ${y}q1.5-1.6 3 0q1.5-1.6 3 0`
  }).join('')
  const bx = r1(15 + rand() * 55)
  return (
    <svg viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true" focusable="false" className="wash absolute inset-[5%] size-[90%]">
      <g className="fx" filter="url(#wash)">
        <path d={`M5 5H95V${h + 4}C70 ${h - 2} 30 ${h + 8} 5 ${h}Z`} fill={sc.sky[0]} opacity={0.5} />
        <path d={`M7 4C30 9 60 3 95 8V${r1(h * 0.6)}C60 ${r1(h * 0.5)} 30 ${r1(h * 0.75)} 6 ${r1(h * 0.55)}Z`} fill={sc.sky[1]} opacity={0.4} />
        <circle cx={sun[0]} cy={sun[1]} r={7} fill={sc.sun} opacity={0.6} />
        <path d={`${hills}V${h + 20}H4Z`} fill={sc.hill} opacity={0.5} />
        <path d={`M4 ${h + 14}C30 ${h + 10} 70 ${h + 18} 96 ${h + 12}V95H4Z`} fill={sc.land} opacity={0.42} />
        <path d={marks} stroke={sc.sun} strokeWidth={1.4} strokeLinecap="round" opacity={0.45} />
      </g>
      <path d={birds} fill="none" stroke="#2a2522" strokeWidth={0.5} opacity={0.6} />
      <path d={`M${bx} ${h + 20}h9l-2 2.2h-5zM${bx + 4} ${h + 20}v-7l3.5 6`} fill="#2a2522" stroke="#2a2522" strokeWidth={0.4} opacity={0.65} />
    </svg>
  )
}
