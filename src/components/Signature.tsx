// ponytail: PLACEHOLDER sign-off — his name set in the Devanagari display face, slanted like handwriting and revealed
// left to right. A traced guess misspelt the name, which is worse than type.
// TODO(owner): replace with a vectorised scan of Siddesh's real signature (one path per pen stroke).

/** The artist's sign-off. `draw`: "load" signs after the hero rangoli, "scroll" signs as it scrolls into view. Decorative. */
export function Signature({ draw, className = '' }: { draw?: 'load' | 'scroll'; className?: string }) {
  return (
    <span aria-hidden="true" lang="mr" className={`sig ${draw ? `sig--${draw}` : ''} ${className}`}>
      <span className="sig-name">सिद्धेश</span>
      <svg viewBox="0 0 120 12" className="sig-flourish" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
        <path d="M2 6C30 11 70 9 118 3" />
      </svg>
    </span>
  )
}
