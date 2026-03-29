import { createServerSupabaseClient } from '@/lib/supabase-server'
import { Equipe, Partie, Poule } from '@/lib/types'

export const revalidate = 30

export default async function ProgrammePage() {
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
        <h1 className="text-3xl font-bold text-gray-800 mb-4">Programme</h1>
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-8">
          <p className="text-yellow-800 text-lg">
            Le programme n&apos;est pas encore disponible. Revenez plus tard !
          </p>
        </div>
      </div>
    )
  }

  const equipesMap = new Map((equipes as Equipe[])?.map((e) => [e.id, e]) || [])
  const poulesMap = new Map((poules as Poule[])?.map((p) => [p.id, p]) || [])

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold text-gray-800 mb-8 text-center">Programme des parties</h1>

      <div className="space-y-3">
        {(parties as Partie[]).map((partie) => {
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
              {/* Heure & Terrain */}
              <div className="flex sm:flex-col items-center gap-2 sm:w-24 text-center flex-shrink-0">
                <span className="text-sm font-bold text-basque-red">
                  {partie.heure || '—'}
                </span>
                {partie.terrain && (
                  <span className="text-xs bg-gray-100 px-2 py-0.5 rounded">
                    Terrain {partie.terrain}
                  </span>
                )}
              </div>

              {/* Equipes & Score */}
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

              {/* Poule */}
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
  )
}
