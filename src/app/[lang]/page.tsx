import Link from 'next/link'
import Image from 'next/image'
import { Lang, getDictionary } from '@/lib/dictionaries'

export default function HomePage({ params }: { params: { lang: Lang } }) {
  const lang = params.lang === 'eu' ? 'eu' : 'fr'
  const t = getDictionary(lang)

  return (
    <div>
      {/* Hero */}
      <section className="bg-gradient-to-br from-basque-red to-basque-red-dark text-white py-16 sm:py-24">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <Image
            src="/logo-kimua.png"
            alt="Logo Kimua - Angeluko Ikastola"
            width={150}
            height={150}
            className="mx-auto mb-6 rounded-full bg-white p-1 shadow-lg"
          />
          <h1 className="text-4xl sm:text-5xl font-bold mb-4">
            {t.hero.title}
          </h1>
          <p className="text-xl sm:text-2xl mb-2 opacity-90">
            {t.hero.subtitle}
          </p>
          <p className="text-lg opacity-80 mb-8">
            {t.hero.organizer}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href={`/${lang}/inscription`}
              className="bg-white text-basque-red font-bold px-8 py-3 rounded-lg hover:bg-gray-100 transition text-lg"
            >
              {t.hero.signup}
            </Link>
            <Link
              href={`/${lang}/programme`}
              className="border-2 border-white text-white font-bold px-8 py-3 rounded-lg hover:bg-white/10 transition text-lg"
            >
              {t.hero.schedule}
            </Link>
            <a
              href="/reglement.pdf"
              target="_blank"
              className="border-2 border-white text-white font-bold px-8 py-3 rounded-lg hover:bg-white/10 transition text-lg"
            >
              {t.hero.rules}
            </a>
          </div>
        </div>
      </section>

      {/* Infos */}
      <section className="max-w-4xl mx-auto px-4 py-12">
        <div className="grid sm:grid-cols-3 gap-6">
          <div className="bg-white rounded-xl shadow p-6 text-center">
            <div className="text-3xl mb-2">📅</div>
            <h3 className="font-bold text-lg text-gray-800">{t.info.date}</h3>
            <p className="text-gray-600 mt-1">{t.info.dateValue}</p>
          </div>
          <div className="bg-white rounded-xl shadow p-6 text-center">
            <div className="text-3xl mb-2">📍</div>
            <h3 className="font-bold text-lg text-gray-800">{t.info.location}</h3>
            <p className="text-gray-600 mt-1">{t.info.locationValue}</p>
          </div>
          <div className="bg-white rounded-xl shadow p-6 text-center">
            <div className="text-3xl mb-2">🏆</div>
            <h3 className="font-bold text-lg text-gray-800">{t.info.format}</h3>
            <p className="text-gray-600 mt-1">{t.info.formatValue}</p>
          </div>
        </div>
      </section>

      {/* Comment ça marche */}
      <section className="bg-white py-12">
        <div className="max-w-4xl mx-auto px-4">
          <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">
            {t.howItWorks.title}
          </h2>
          <div className="grid sm:grid-cols-2 gap-6">
            {[
              { title: t.howItWorks.step1Title, desc: t.howItWorks.step1Desc },
              { title: t.howItWorks.step2Title, desc: t.howItWorks.step2Desc },
              { title: t.howItWorks.step3Title, desc: t.howItWorks.step3Desc },
              { title: t.howItWorks.step4Title, desc: t.howItWorks.step4Desc },
            ].map((step, i) => (
              <div key={i} className="flex gap-4">
                <div className="bg-basque-green text-white rounded-full w-10 h-10 flex items-center justify-center font-bold flex-shrink-0">
                  {i + 1}
                </div>
                <div>
                  <h3 className="font-semibold text-gray-800">{step.title}</h3>
                  <p className="text-gray-600 text-sm mt-1">{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}
