import { createServerSupabaseClient } from '@/lib/supabase-server'
import { Equipe, Partie, Poule } from '@/lib/types'
import { Lang, getDictionary } from '@/lib/dictionaries'

export const revalidate = 30

export default async function ProgrammePage({ params }: { params: { lang: Lang } }) {
  const lang = params.lang === 'eu' ? 'eu' : 'fr'
  const t = getDictionary(lang)

  const supabase = await createServerSupabaseClient()

  const { data: parties } = await supabase
    .from('parties')
    .select('*')
    .order('heure', { ascending: true })

  const { data: equipes } = await supabase.from('equipes').select('*')
  const { data: poules } = await supabase.from('poules').select('*')

  if (!parties || parties.length === 0) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center">
        <h1 className="text-3xl font-bold text-gray-800 mb-4">{t.programme.title}</h1>
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-8">
          <p className="text-yellow-800 text-lg">{t.programme.empty}</p>
        </div>
      </div>
    )
  }

  const equipesMap = new Map((equipes as Equipe[])?.map((e) => [e.id, e]) || [])
  const poulesMap = new Map((poules as Poule[])?.map((p) => [p.id, p]) || [])

  // Grouper les parties par jour
  const partiesByJour = new Map<string, Partie[]>()
  ;(parties as Partie[]).forEach((p) => {
    const jour = p.jour || 'non_planifie'
    if (!partiesByJour.has(jour)) partiesByJour.set(jour, [])
    partiesByJour.get(jour)!.push(p)
  })

  const joursOrdonnes = Array.from(partiesByJour.keys()).sort((a, b) => {
    if (a === 'non_planifie') return 1
    if (b === 'non_planifie') return -1
    return a.localeCompare(b)
  })

  const nonPlanifieLabel = lang === 'eu' ? 'Oraindik planifikatu gabe' : 'Non planifié'

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold text-gray-800 mb-8 text-center">{t.programme.title}</h1>

      {joursOrdonnes.map((jour) => (
        <div key={jour} className="mb-10">
          <h2 className="text-xl font-bold text-basque-green mb-4 border-b-2 border-basque-green/20 pb-2">
            {jour === 'non_planifie'
              ? nonPlanifieLabel
              : new Date(jour + 'T00:00:00').toLocaleDateString(lang === 'eu' ? 'eu' : 'fr-FR', {
                  weekday: 'long',
                  day: 'numeric',
                  month: 'long',
                })}
          </h2>

          <div className="space-y-3">
            {partiesByJour.get(jour)!.map((partie) => {
              const eq1 = equipesMap.get(partie.equipe1_id)
              const eq2 = equipesMap.get(partie.equipe2_id)
              const poule = poulesMap.get(partie.poule_id)

              return (
                <div
                  key={partie.id}
                  className={`bg-white rounded-xl shadow p-4 flex flex-col sm:flex-row items-center gap-3 ${
                    partie.jouee ? 'border-l-4 border-basque-green' : ''
                  }`}
                >
                  <div className="flex items-center gap-2 sm:w-20 text-center flex-shrink-0">
                    <span className="text-sm font-bold text-basque-red">
                      {partie.heure || '—'}
                    </span>
                  </div>

                  <div className="flex-1 flex items-center justify-center gap-4 text-center">
                    <div className="flex-1 text-right">
                      <p className="font-semibold text-gray-800 text-sm">
                        {eq1 ? `${eq1.garcon} & ${eq1.fille}` : '?'}
                      </p>
                    </div>

                    <div className="flex items-center gap-2 flex-shrink-0">
                      {partie.jouee ? (
                        <span className="bg-basque-green text-white font-bold px-3 py-1 rounded text-lg">
                          {partie.score1} - {partie.score2}
                        </span>
                      ) : (
                        <span className="bg-gray-200 text-gray-500 px-3 py-1 rounded text-sm">
                          VS
                        </span>
                      )}
                    </div>

                    <div className="flex-1 text-left">
                      <p className="font-semibold text-gray-800 text-sm">
                        {eq2 ? `${eq2.garcon} & ${eq2.fille}` : '?'}
                      </p>
                    </div>
                  </div>

                  <div className="sm:w-24 text-center flex-shrink-0">
                    {poule && (
                      <span className="text-xs bg-basque-red/10 text-basque-red px-2 py-0.5 rounded">
                        {poule.nom}
                      </span>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      ))}
    </div>
  )
}
