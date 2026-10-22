import type { Metadata, Viewport } from 'next'
import { Mukta, Rozha_One, Tiro_Devanagari_Marathi } from 'next/font/google'
import { ViewTransition } from 'react'
import '../globals.css'
import { BottomTabBar } from '@/components/BottomTabBar'
import { Footer } from '@/components/Footer'
import { Header } from '@/components/Header'
import { FirstVisitLanguagePicker } from '@/components/LanguagePicker'
import { TapRipple } from '@/components/TapRipple'
import { WhatsAppButton } from '@/components/WhatsAppButton'
import { locales } from '@/i18n/config'
import { getDictionary, getLocale } from '@/i18n/dictionaries'
import { site } from '@/lib/site'

const tiro = Tiro_Devanagari_Marathi({ weight: '400', subsets: ['devanagari', 'latin'], variable: '--font-tiro', display: 'swap' })
// Festival-poster display face, used only for one giant word per section and step numerals.
const rozha = Rozha_One({ weight: '400', subsets: ['devanagari', 'latin'], variable: '--font-rozha', display: 'swap', preload: false })
const mukta = Mukta({ weight: ['400', '500', '600', '700'], subsets: ['devanagari', 'latin'], variable: '--font-mukta', display: 'swap' })

export function generateStaticParams() {
  return locales.map((lang) => ({ lang }))
}

export async function generateMetadata(): Promise<Metadata> {
  const t = await getDictionary()
  return {
    metadataBase: new URL(site.url),
    title: { default: t.meta.title, template: `%s | ${site.brandName}` },
    description: t.meta.description,
    applicationName: site.brandName,
    appleWebApp: { capable: true, title: site.brandName, statusBarStyle: 'default' },
    openGraph: { siteName: site.brandName, type: 'website', title: t.meta.title, description: t.meta.description },
  }
}

// Zoom is never blocked (accessibility rule); theme colour matches the paper background.
export const viewport: Viewport = { themeColor: '#FAF6EF' }

export default async function LocaleLayout({ children }: LayoutProps<'/[lang]'>) {
  const locale = await getLocale()
  const t = await getDictionary()

  return (
    <html lang={locale} className={`${tiro.variable} ${mukta.variable} ${rozha.variable}`}>
      <body className="flex min-h-dvh flex-col">
        <a href="#main" className="skip-link">
          {t.nav.skip}
        </a>
        <div aria-hidden="true" className="scroll-ink" />
        <Header locale={locale} t={t} />
        <main id="main" className="flex-1">
          <ViewTransition default="page">{children}</ViewTransition>
        </main>
        <Footer locale={locale} t={t} />
        <WhatsAppButton {...t.whatsapp} />
        <BottomTabBar locale={locale} labels={t.tabs} navLabel={t.nav.mainNav} />
        <FirstVisitLanguagePicker current={locale} />
        <TapRipple />
      </body>
    </html>
  )
}
