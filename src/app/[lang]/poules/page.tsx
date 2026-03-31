import { createServerSupabaseClient } from '@/lib/supabase-server'
import { Equipe, Poule, EquipePoule } from '@/lib/types'
import { Lang, getDictionary } from '@/lib/dictionaries'

export const revalidate = 30

export default async function PoulesPage({ params }: { params: { lang: Lang } }) {
  const lang = params.lang === 'eu' ? 'eu' : 'fr'
  const t = getDictionary(lang)

  const supabase = await createServerSupabaseClient()

  const { data: poules } = await supabase
    .from('poules')
    .select('*')
    .order('serie', { ascending: true })
    .order('nom', { ascending: true })

  const { data: equipesPoules } = await supabase.from('equipes_poules').select('*')
  const { data: equipes } = await supabase.from('equipes').select('*')

  if (!poules || poules.length === 0) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center">
        <h1 className="text-3xl font-bold text-gray-800 mb-4">{t.poules.title}</h1>
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-8">
          <p className="text-yellow-800 text-lg">{t.poules.empty}</p>
        </div>
      </div>
    )
  }

  const equipesMap = new Map((equipes as Equipe[])?.map((e) => [e.id, e]) || [])

  const series = ['1ere', '2eme'] as const
  const poulesBySerie = series.map((serie) => ({
    serie,
    label: serie === '1ere' ? t.poules.serie1 : t.poules.serie2,
    poules: (poules as Poule[]).filter((p) => p.serie === serie),
  }))

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold text-gray-800 mb-8 text-center">{t.poules.title}</h1>

      {poulesBySerie.map(({ serie, label, poules: seriePoules }) => (
        seriePoules.length > 0 && (
          <div key={serie} className="mb-10">
            <h2 className="text-2xl font-bold text-basque-green mb-4">{label}</h2>
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
                    <h3 className="font-bold text-lg text-basque-red mb-3">{poule.nom}</h3>
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
        )
      ))}
    </div>
  )
}
