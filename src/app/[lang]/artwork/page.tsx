import type { Metadata } from 'next'
import { Gallery } from '@/components/Gallery'
import { PageHero } from '@/components/PageHero'
import { alternates } from '@/i18n/config'
import { getDictionary, getLocale } from '@/i18n/dictionaries'
import { getGallery, toGalleryItem } from '@/server/content'

export async function generateMetadata(): Promise<Metadata> {
  const t = await getDictionary()
  return { title: t.gallery.metaTitle, description: t.gallery.metaDesc, alternates: alternates(await getLocale(), '/artwork') }
}

export default async function ArtworkPage() {
  const locale = await getLocale()
  const t = await getDictionary()
  const items = (await getGallery(locale)).map((a) => toGalleryItem(a, locale))

  return (
    <>
      <PageHero title={t.gallery.title} sub={t.gallery.intro} word="कला" />
      <section className="bg-paper pb-20 lg:pb-28">
        <div className="wrap">
          <Gallery items={items} t={t.gallery} enquiryMessage={`${t.forms.waIntro} ${t.gallery.enquire}:`} />
        </div>
      </section>
    </>
  )
}
