import Link from 'next/link'
import Image from 'next/image'
import { Lang, getDictionary } from '@/lib/dictionaries'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { Equipe, Poule, EquipePoule } from '@/lib/types'

export const revalidate = 30

export default async function HomePage({ params }: { params: { lang: Lang } }) {
  const lang = params.lang === 'eu' ? 'eu' : 'fr'
  const t = getDictionary(lang)

  // Charger les poules pour affichage sur la page d'accueil
  const supabase = await createServerSupabaseClient()
  const { data: poules } = await supabase
    .from('poules')
    .select('*')
    .order('serie', { ascending: true })
    .order('nom', { ascending: true })
  const { data: equipesPoules } = await supabase.from('equipes_poules').select('*')
  const { data: equipes } = await supabase.from('equipes').select('*')

  const equipesMap = new Map((equipes as Equipe[])?.map((e) => [e.id, e]) || [])
  const hasPoules = poules && poules.length > 0

  const series = ['1ere', '2eme'] as const
  const poulesBySerie = hasPoules
    ? series.map((serie) => ({
        serie,
        label: serie === '1ere' ? t.poules.serie1 : t.poules.serie2,
        poules: (poules as Poule[]).filter((p) => p.serie === serie),
      }))
    : []

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

      {/* Poules */}
      {hasPoules && (
        <section className="bg-gray-50 py-12">
          <div className="max-w-4xl mx-auto px-4">
            <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">
              {t.poules.title}
            </h2>

            {poulesBySerie.map(({ serie, label, poules: seriePoules }) =>
              seriePoules.length > 0 ? (
                <div key={serie} className="mb-8">
                  <h3 className="text-xl font-bold text-basque-green mb-4">{label}</h3>
                  <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {seriePoules.map((poule) => {
                      const pouleEquipeIds = (equipesPoules as EquipePoule[])
                        ?.filter((ep) => ep.poule_id === poule.id)
                        .map((ep) => ep.equipe_id) || []
                      const pouleEquipes = pouleEquipeIds
                        .map((id) => equipesMap.get(id))
                        .filter(Boolean) as Equipe[]

                      return (
                        <div key={poule.id} className="bg-white rounded-xl shadow p-5">
                          <h4 className="font-bold text-lg text-basque-red mb-3">{poule.nom}</h4>
                          <ul className="space-y-2">
                            {pouleEquipes.map((equipe) => (
                              <li key={equipe.id} className="text-sm text-gray-700 bg-gray-50 rounded-lg px-3 py-2">
                                <span className="font-medium">{equipe.garcon}</span>
                                {' & '}
                                <span className="font-medium">{equipe.fille}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )
                    })}
                  </div>
                </div>
              ) : null
            )}

            <div className="text-center mt-6">
              <Link
                href={`/${lang}/poules`}
                className="inline-block bg-basque-green text-white font-bold px-6 py-2.5 rounded-lg hover:bg-basque-green-dark transition"
              >
                {t.poules.seeAll}
              </Link>
            </div>
          </div>
        </section>
      )}

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
