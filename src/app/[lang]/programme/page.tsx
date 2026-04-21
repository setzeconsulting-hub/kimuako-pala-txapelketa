import { createServerSupabaseClient } from '@/lib/supabase-server'
import { Equipe, Partie, Poule } from '@/lib/types'
import { Lang, getDictionary } from '@/lib/dictionaries'
import { SLOTS, getDatesPossibles } from '@/lib/calendrier-constraints'
import Link from 'next/link'

export const revalidate = 30

export default async function ProgrammePage({ params }: { params: { lang: Lang } }) {
  const lang = params.lang === 'eu' ? 'eu' : 'fr'
  const t = getDictionary(lang)

  const supabase = await createServerSupabaseClient()

  const { data: parties } = await supabase
    .from('parties')
    .select('*')
    .eq('publie', true)
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

  // Construire la map (jour_slotIdx → Partie)
  const slotMap = new Map<string, Partie>()
  ;(parties as Partie[]).forEach((p) => {
    if (!p.jour || !p.heure) return
    const slotIdx = SLOTS.indexOf(p.heure.substring(0, 5))
    if (slotIdx === -1) return
    slotMap.set(`${p.jour}_${slotIdx}`, p)
  })

  const datesPossibles = getDatesPossibles()
  // Ne garder que les jours avec au moins 1 partie ou... montrer tous les jours
  // Afficher tous les jours — pour voir les créneaux libres
  const displayedDates = datesPossibles

  return (
    <div className="max-w-5xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold text-gray-800 mb-6 text-center">{t.programme.title}</h1>

      <div className="flex flex-wrap gap-3 justify-center text-xs mb-6">
        <span className="inline-flex items-center gap-1">
          <span className="inline-block w-3 h-3 bg-red-50 border border-red-200 rounded"></span>
          Partie programmée
        </span>
        <span className="inline-flex items-center gap-1">
          <span className="inline-block w-3 h-3 bg-green-50 border border-green-200 rounded"></span>
          {t.programme.free}
        </span>
      </div>

      <div className="bg-white rounded-xl shadow overflow-x-auto">
        <table className="w-full text-xs sm:text-sm">
          <thead>
            <tr className="bg-gray-50 text-gray-600">
              <th className="text-left px-2 sm:px-3 py-2 sticky left-0 bg-gray-50">{t.programme.date}</th>
              {SLOTS.map((s) => (
                <th key={s} className="px-2 sm:px-3 py-2 text-center w-1/4">{s}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {displayedDates.map((jour) => {
              const d = new Date(jour + 'T00:00:00')
              const label = d.toLocaleDateString(lang === 'eu' ? 'eu' : 'fr-FR', {
                weekday: 'short',
                day: 'numeric',
                month: 'short',
              })
              return (
                <tr key={jour} className="border-t">
                  <td className="px-2 sm:px-3 py-2 font-medium sticky left-0 bg-white whitespace-nowrap">
                    {label}
                  </td>
                  {SLOTS.map((_, slotIdx) => {
                    const key = `${jour}_${slotIdx}`
                    const partie = slotMap.get(key)
                    if (partie) {
                      const eq1 = equipesMap.get(partie.equipe1_id)
                      const eq2 = equipesMap.get(partie.equipe2_id)
                      const poule = poulesMap.get(partie.poule_id)
                      return (
                        <td key={slotIdx} className={`px-2 sm:px-3 py-2 text-center text-xs ${partie.jouee ? 'bg-green-50' : 'bg-red-50'}`}>
                          <div className="font-semibold text-gray-800 leading-tight">
                            {eq1 ? `${eq1.garcon.split(' ')[0]} & ${eq1.fille.split(' ')[0]}` : '?'}
                          </div>
                          <div className="my-0.5">
                            {partie.jouee ? (
                              <span className="bg-basque-green text-white font-bold px-2 py-0.5 rounded text-xs">
                                {partie.score1} - {partie.score2}
                              </span>
                            ) : (
                              <span className="text-gray-400 text-[10px]">vs</span>
                            )}
                          </div>
                          <div className="font-semibold text-gray-800 leading-tight">
                            {eq2 ? `${eq2.garcon.split(' ')[0]} & ${eq2.fille.split(' ')[0]}` : '?'}
                          </div>
                          <div className="text-[10px] text-basque-red mt-1">{poule?.nom}</div>
                          {!partie.jouee && (
                            <Link
                              href={`/${lang}/report?partie=${partie.id}`}
                              className="inline-block mt-1 text-[10px] text-basque-red underline hover:text-basque-red-dark"
                            >
                              {t.programme.requestMove}
                            </Link>
                          )}
                        </td>
                      )
                    }
                    return (
                      <td key={slotIdx} className="px-2 sm:px-3 py-2 text-center bg-green-50 text-green-700 font-medium">
                        {t.programme.free}
                      </td>
                    )
                  })}
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
