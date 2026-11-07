// The broom sweep's geometry: a curved, jittering front that crosses the screen left to right. Pure maths (no DOM), shared by the splash and the page
// transition so the band, the cleared area and the tests all agree.

export type Sweep = { W: number; H: number }

/** Width of one colour of the band (it has three: marigold, kumkum, peacock). */
export const bandWidth = (W: number) => Math.max(26, W * 0.05)

/** Ease in-out (cubic). */
export const ease = (k: number) => (k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2)

/** Where the front is (its x at the top of the screen) once the sweep is `k` (0..1) of the way: it starts fully off the left edge and ends fully off the right. */
export function frontStart({ W, H }: Sweep, k: number) {
  const tot = bandWidth(W) * 3
  const bow = H * 0.16
  const tilt = W * 0.14
  // Far enough out at both ends that not a pixel of the band shows at k = 0 or k = 1 (the bow and tilt push the front further in).
  const s0 = -tot - bow - tilt * 0.5 - 12
  return s0 + (W + 2 * tot + 2 * bow + tilt + 24) * ease(k)
}

/** The front's x at height y: bowed, tilted, and shaking a little (`ms` is the time, for the shake). */
export function frontX({ W, H }: Sweep, s: number, y: number, ms = 0) {
  const k = y / H
  return s + Math.sin(k * Math.PI) * H * 0.16 + (k - 0.5) * W * 0.14 + 5 * Math.sin(y * 0.045 + ms * 0.009) + 3 * Math.sin(y * 0.11 - ms * 0.006)
}

/** The front as points from the top of the screen to the bottom. */
export const frontLine = (sw: Sweep, s: number, ms = 0, n = 26) => Array.from({ length: n + 1 }, (_, i) => [frontX(sw, s, (sw.H * i) / n, ms), (sw.H * i) / n] as const)

/** CSS polygon of the area on one side of the front: `ahead` is the part not yet swept (right of it), else the part already swept. */
export function polygon(line: readonly (readonly [number, number])[], W: number, ahead: boolean, offset = 0) {
  const pts = line.map(([x, y]) => [x - offset, y])
  const edge = ahead ? [[W + 8, line[line.length - 1][1]], [W + 8, 0]] : [[-8, line[line.length - 1][1]], [-8, 0]]
  return `polygon(${[...pts, ...edge].map(([x, y]) => `${x.toFixed(1)}px ${y.toFixed(1)}px`).join(',')})`
}
