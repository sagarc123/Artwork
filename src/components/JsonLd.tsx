import { localePath, type Locale } from '@/i18n/config'
import { jsonLdText } from '@/lib/json-ld'
import { site } from '@/lib/site'

/** Structured data for search engines. `<` is escaped so text from the CMS can never close the script tag. */
export function JsonLd({ data }: { data: object }) {
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdText(data) }} />
}

/** Home > ... > this page. `items` are [name, path] pairs; the last one is the page itself. */
export function Breadcrumbs({ locale, items }: { locale: Locale; items: [string, string][] }) {
  return (
    <JsonLd
      data={{
        '@type': 'BreadcrumbList',
        itemListElement: items.map(([name, path], i) => ({ '@type': 'ListItem', position: i + 1, name, item: new URL(localePath(locale, path), site.url).toString() })),
      }}
    />
  )
}

const sameAs = [site.instagram, site.youtube, site.facebook].filter(Boolean)
const contact = { telephone: site.phone || undefined, email: site.email || undefined }

/** The studio, for home. Phone, email and social links appear once the owner has filled them in. */
export const org = { '@type': 'Organization', '@id': `${site.url}/#org`, name: site.brandName, url: site.url, logo: new URL('/icon.png', site.url).toString(), sameAs: sameAs.length ? sameAs : undefined, ...contact }

/** The artist, for About. */
export const artist = { '@type': 'Person', name: site.artistName, url: site.url, jobTitle: 'Rangoli and portrait artist', sameAs: sameAs.length ? sameAs : undefined, ...contact, worksFor: { '@id': org['@id'] } }

/** A service he offers (event rangoli, custom portraits), priced "from" when a price is known. */
export function service(name: string, description: string, url: string, from?: number) {
  return {
    '@type': 'Service',
    name,
    description,
    url,
    provider: { '@id': org['@id'] },
    areaServed: { '@type': 'AdministrativeArea', name: 'Maharashtra, India' },
    offers: from ? { '@type': 'Offer', priceCurrency: 'INR', priceSpecification: { '@type': 'PriceSpecification', priceCurrency: 'INR', minPrice: from } } : undefined,
  }
}
