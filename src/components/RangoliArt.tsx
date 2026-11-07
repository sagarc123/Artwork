import type { CSSProperties } from 'react'
import type { Rangoli } from '@/lib/rangoli'

const idx = (i: number) => ({ '--i': i }) as CSSProperties

/** A generated rangoli as SVG (-100..100 box). It draws itself dot → line → colour when mounted (globals.css .rg; still under calm modes). `tm` slows the draw. */
export function RangoliArt({ rangoli: r, tm = 1.35 }: { rangoli: Rangoli; tm?: number }) {
  let f = 0
  return (
    <svg className="rg" viewBox="-100 -100 200 200" width="200" height="200" focusable="false" style={{ '--tm': tm } as CSSProperties}>
      <g>
        {r.dots.map((d, i) => (
          <circle key={i} className="d" cx={d.x} cy={d.y} r={d.r} style={idx(i)} />
        ))}
      </g>
      <g className="gl">
        {r.lines.map((d, i) => (
          <path key={i} d={d} pathLength={1} />
        ))}
      </g>
      <g>
        {r.shapes.map((s, i) => (
          <g key={i} className="f" style={idx(f++)}>
            {s.kind === 'dot' && <circle r={s.r} fill={s.fill} />}
            {s.kind === 'petal' && <ellipse transform={`rotate(${s.angle.toFixed(1)}) translate(0,${-s.at})`} rx={s.rx} ry={s.ry} fill={s.fill} />}
            {s.kind === 'diya' && (
              <g transform={`rotate(${s.angle.toFixed(1)}) translate(0,-92)`}>
                <ellipse rx="5" ry="2.6" fill={s.fill} />
                <path d="M0 -2.4 C3 -7 0 -9 0 -11 C-1 -8 -3 -6 0 -2.4Z" fill="#FFE7A8" />
              </g>
            )}
          </g>
        ))}
      </g>
    </svg>
  )
}
