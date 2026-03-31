import Link from 'next/link'
import { Lang, getDictionary } from '@/lib/dictionaries'

export function generateStaticParams() {
  return [{ lang: 'fr' }, { lang: 'eu' }]
}

function LanguageSwitcher({ lang }: { lang: Lang }) {
  return (
    <div className="flex gap-1 bg-white/20 rounded-lg p-0.5">
      <Link
        href="/eu"
        className={`px-2 py-1 rounded text-xs font-bold transition ${
          lang === 'eu' ? 'bg-white text-basque-red' : 'text-white hover:bg-white/20'
        }`}
      >
        EU
      </Link>
      <Link
        href="/fr"
        className={`px-2 py-1 rounded text-xs font-bold transition ${
          lang === 'fr' ? 'bg-white text-basque-red' : 'text-white hover:bg-white/20'
        }`}
      >
        FR
      </Link>
    </div>
  )
}

export default function LangLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: { lang: Lang }
}) {
  const lang = params.lang === 'eu' ? 'eu' : 'fr'
  const t = getDictionary(lang)

  return (
    <>
      <header className="bg-basque-red text-white shadow-lg">
        <nav className="max-w-6xl mx-auto px-4 py-3">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-2">
            <Link href={`/${lang}`} className="text-xl font-bold tracking-tight">
              Kimuako Pala Txapelketa
            </Link>
            <div className="flex gap-1 sm:gap-2 flex-wrap justify-center items-center">
              <Link
                href={`/${lang}`}
                className="px-3 py-1.5 rounded hover:bg-basque-red-dark transition text-sm font-medium"
              >
                {t.nav.home}
              </Link>
              <Link
                href={`/${lang}/poules`}
                className="px-3 py-1.5 rounded hover:bg-basque-red-dark transition text-sm font-medium"
              >
                {t.nav.poules}
              </Link>
              <Link
                href={`/${lang}/programme`}
                className="px-3 py-1.5 rounded hover:bg-basque-red-dark transition text-sm font-medium"
              >
                {t.nav.programme}
              </Link>
              <Link
                href={`/${lang}/resultats`}
                className="px-3 py-1.5 rounded hover:bg-basque-red-dark transition text-sm font-medium"
              >
                {t.nav.resultats}
              </Link>
              <LanguageSwitcher lang={lang} />
            </div>
          </div>
        </nav>
      </header>
      {children}
      <footer className="bg-basque-green text-white py-6 mt-auto">
        <div className="max-w-6xl mx-auto px-4 text-center text-sm">
          <p className="font-semibold">{t.footer.org}</p>
          <p className="mt-1 opacity-80">{t.footer.tournament}</p>
        </div>
      </footer>
    </>
  )
}
