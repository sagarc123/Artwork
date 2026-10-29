import type { Metadata, Viewport } from 'next'
import { Hind, Lexend, Mukta, Rozha_One, Tiro_Devanagari_Marathi } from 'next/font/google'
import { ViewTransition } from 'react'
import '../globals.css'
import { BottomTabBar } from '@/components/BottomTabBar'
import { ConsentTrackers } from '@/components/ConsentTrackers'
import { CookieBanner } from '@/components/CookieBanner'
import { EverydayMotion } from '@/components/EverydayMotion'
import { Footer } from '@/components/Footer'
import { Header } from '@/components/Header'
import { LanguageChooser } from '@/components/LanguagePicker'
import { ArtDefs } from '@/components/StandIns'
import { WhatsAppButton } from '@/components/WhatsAppButton'
import { locales } from '@/i18n/config'
import { GA_ID, META_ID } from '@/lib/consent'
import { getDictionary, getLocale } from '@/i18n/dictionaries'
import { site } from '@/lib/site'
import { InlineScript } from '@/components/InlineScript'
import { FESTIVE_KINDS, festiveWindows, fixedSeason } from '@/lib/festive'
import { getFestivals, getSiteExtras } from '@/server/content'

const tiro = Tiro_Devanagari_Marathi({ weight: '400', subsets: ['devanagari', 'latin'], variable: '--font-tiro', display: 'swap' })
// Festival-poster display face, used only for one giant word per section and step numerals.
const rozha = Rozha_One({ weight: '400', subsets: ['devanagari', 'latin'], variable: '--font-rozha', display: 'swap', preload: false })
// Everyday look (globals.css --heading-face / --body-face): Lexend headings, Hind body and Devanagari. Mukta stays for festive body text.
const lexend = Lexend({ subsets: ['latin'], variable: '--font-lexend', display: 'swap' })
const hind = Hind({ weight: ['400', '500', '600', '700'], subsets: ['devanagari', 'latin'], variable: '--font-hind', display: 'swap' })
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
  const [{ festiveLook, siteLook }, festivals] = await Promise.all([getSiteExtras(locale), getFestivals(locale)])
  // A look the owner picked is drawn from the first paint; "auto" depends on the visitor's own date, so the head
  // script picks it before first paint (no flash). Without JS "auto" stays everyday (the CSS default).
  const fixedLook = (FESTIVE_KINDS as readonly string[]).includes(festiveLook) ? festiveLook : undefined
  const season = fixedSeason(siteLook, festiveLook)
  // ponytail: pickWindow() in src/lib/festive.ts, inlined; the windows (festival day minus 21 days) come from there.
  const lookScript =
    !season || (season === 'festive' && festiveLook === 'auto')
      ? `var W=${JSON.stringify(festiveWindows(festivals))},n=new Date(),t=n.getFullYear()+"-"+("0"+(n.getMonth()+1)).slice(-2)+"-"+("0"+n.getDate()).slice(-2),k;for(var i=0;i<W.length;i++)if(W[i][1]<=t&&t<=W[i][2]){k=W[i][0];break}${season ? '' : 'd.dataset.season=k?"festive":"everyday";'}${festiveLook === 'auto' ? 'if(k)d.dataset.festive=k;' : ''}`
      : ''

  return (
    <html lang={locale} className={`${tiro.variable} ${mukta.variable} ${rozha.variable} ${lexend.variable} ${hind.variable}`} data-festive={fixedLook} data-season={season ?? undefined} suppressHydrationWarning>
      <head>
        {/* Before first paint: a saved "Stop animations" and the slow-phone test (so effects don't start and then jump), an announcement closed earlier this visit, and the automatic look. */}
        <InlineScript
          html={`try{var d=document.documentElement;if(localStorage.getItem("motion")==="off")d.dataset.motion="off";var n=navigator,c=n.connection;if(c&&(c.saveData||/(^|-)(2g|3g)$/.test(c.effectiveType||""))||n.deviceMemory<4||n.hardwareConcurrency<4)d.dataset.fx="lite";if(window.IntersectionObserver&&d.dataset.motion!=="off"&&!matchMedia("(prefers-reduced-motion:reduce)").matches){d.dataset.rv="";setTimeout(function(){d.dataset.rvLive===undefined&&delete d.dataset.rv},3000)}var a=sessionStorage.getItem("ann");if(a)d.dataset.annOff=a}catch(e){}${lookScript}`}
        />
      </head>
      <body className="flex min-h-dvh flex-col">
        <a href="#main" className="skip-link">
          {t.nav.skip}
        </a>
        <ArtDefs />
        {/* At the very top, in the flow: it never covers the tab bar or a buy bar. Only when there is something to ask about. */}
        <CookieBanner configured={{ analytics: !!GA_ID, marketing: !!META_ID }} t={t.cookies} />
        <ConsentTrackers />
        <Header locale={locale} t={t} />
        <main id="main" tabIndex={-1} className="flex-1 outline-none">
          <ViewTransition default={{ form: 'none', default: 'page' }}>{children}</ViewTransition>
        </main>
        <Footer locale={locale} t={t} />
        <WhatsAppButton {...t.whatsapp} />
        <EverydayMotion />
        <LanguageChooser current={locale} labels={t.langStrip} />
        <BottomTabBar locale={locale} labels={t.tabs} navLabel={t.nav.mainNav} itemsLabel={t.cart.items} />
      </body>
    </html>
  )
}
