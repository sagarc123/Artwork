// Everyday home, "Fresh from the studio": the courtyard wall. A toran across the top, pieces hanging on threads in the shape of their medium
// (arch for portraits, frame for paintings, plate for rangoli), and a dotted floor with rangoli plates seen from above.
// Each piece is the same link card as before: title, kind, price, Sold badge and the card → product transition name.
import Link from 'next/link'
import { ViewTransition } from 'react'
import type { Dictionary } from '@/i18n/dictionaries'
import { formatPrice } from '@/lib/site'
import { MediaImage, photoSrc } from './MediaImage'
import { PhotoPlaceholder } from './PhotoPlaceholder'
import type { ShopItem } from './ShopGrid'
import { SoldBadge } from './SoldBadge'
import { ArtShape, focusFor, shapeFor, Thali } from './Thali'

/** Thread lengths (px) and sizes along the wall: mixed on purpose, and short on phones where the wall is two columns (globals.css). */
const MIX = [{ len: 70 }, { len: 150 }, { len: 36 }, { len: 112 }]

export function CourtyardWall({ items, t }: { items: ShopItem[]; t: Dictionary }) {
  return (
    <div className="look-everyday">
      <div className="cy-wall">
        <ul className="cy-hangs">
          {items.slice(0, 4).map((f, i) => {
            const shape = shapeFor(f.medium)
            const photo = !!photoSrc(f.image)
            return (
              <li key={f.slug} className={`cy-hang rv cy-${i}`} style={{ '--len': `${MIX[i].len}px` } as React.CSSProperties}>
                <Link href={f.href} className="cy-card">
                  <span className="cy-art">
                    <ArtShape medium={f.medium} seed={f.seed} photo={photo}>
                      <ViewTransition name={`art-${f.slug}`} share="morph" default="none">
                        <MediaImage
                          media={f.image}
                          alt={f.title}
                          ratio={shape === 'frame' ? '4/3' : shape === 'arch' ? '3/4' : '1/1'}
                          seed={f.seed}
                          medium={f.medium}
                          floor="paper"
                          focus={focusFor(shape)}
                          sizes="(min-width: 1024px) 25vw, 50vw"
                          className={`size-full ${f.sold ? 'opacity-70 grayscale-[.3]' : ''}`}
                        />
                      </ViewTransition>
                    </ArtShape>
                    {f.sold && <SoldBadge label={t.shop.sold} className="absolute top-3 left-3 z-10" />}
                  </span>
                  <span className="kind">{t.shop.types[f.type]}</span>
                  <span className="font-heading text-h3-sm">{f.title}</span>
                  {f.sold ? (
                    <s className="text-muted">{formatPrice(f.price)}</s>
                  ) : (
                    <span className="price-pill font-semibold">
                      {f.hasMorePrices && <span className="font-normal text-muted">{t.shop.from} </span>}
                      {formatPrice(f.price)}
                    </span>
                  )}
                </Link>
              </li>
            )
          })}
        </ul>
      </div>
      {/* The floor: two rangoli plates seen from above, on dots. Decoration only. */}
      <div className="cy-floor" aria-hidden="true">
        {['floor-a', 'floor-b'].map((seed) => (
          <Thali key={seed} category="rangoli" seed={seed} n={22} width="100%" className="cy-plate">
            <PhotoPlaceholder ratio="1/1" seed={seed} medium="rangoli" floor="paper" alt="" slot={seed} />
          </Thali>
        ))}
      </div>
    </div>
  )
}
