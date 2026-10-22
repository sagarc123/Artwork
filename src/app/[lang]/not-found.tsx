import { ButtonLink } from '@/components/ButtonLink'
import { RangoliDraw } from '@/components/Rangoli'
import { localePath } from '@/i18n/config'
import { getDictionary, getLocale } from '@/i18n/dictionaries'

export default async function NotFound() {
  const locale = await getLocale()
  const t = await getDictionary()
  return (
    <section className="kolam">
      <div className="wrap grid justify-items-center gap-6 py-20 text-center lg:py-28">
        <RangoliDraw className="size-32" />
        <h1 className="font-heading text-h1 lg:text-h1-lg">{t.notFound.title}</h1>
        <p className="text-muted">{t.notFound.body}</p>
        <ButtonLink href={localePath(locale, '/')}>{t.notFound.home}</ButtonLink>
      </div>
    </section>
  )
}
