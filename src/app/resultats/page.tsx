import { createServerSupabaseClient } from '@/lib/supabase-server'
import { Equipe, Partie, Poule, EquipePoule, ClassementEquipe } from '@/lib/types'

export const revalidate = 30

function calculerClassement(
  pouleEquipes: Equipe[],
  parties: Partie[]
): ClassementEquipe[] {
  const classement: ClassementEquipe[] = pouleEquipes.map((equipe) => ({
    equipe,
    points: 0,
    victoires: 0,
    defaites: 0,
    nuls: 0,
    pointsMarques: 0,
    pointsEncaisses: 0,
    diff: 0,
    joues: 0,
  }))

  const map = new Map(classement.map((c) => [c.equipe.id, c]))

  parties
    .filter((p) => p.jouee && p.score1 !== null && p.score2 !== null)
    .forEach((p) => {
      const c1 = map.get(p.equipe1_id)
      const c2 = map.get(p.equipe2_id)
      if (!c1 || !c2) return

      c1.joues++
      c2.joues++
      c1.pointsMarques += p.score1!
      c1.pointsEncaisses += p.score2!
      c2.pointsMarques += p.score2!
      c2.pointsEncaisses += p.score1!

      if (p.score1! > p.score2!) {
        c1.victoires++
        c1.points += 3
        c2.defaites++
      } else if (p.score1! < p.score2!) {
        c2.victoires++
        c2.points += 3
        c1.defaites++
      } else {
        c1.nuls++
        c2.nuls++
        c1.points += 1
        c2.points += 1
      }
    })

  classement.forEach((c) => {
    c.diff = c.pointsMarques - c.pointsEncaisses
  })

  classement.sort((a, b) => b.points - a.points || b.diff - a.diff)

  return classement
}

export default async function ResultatsPage() {
  const supabase = await createServerSupabaseClient()

  const { data: poules } = await supabase
    .from('poules')
    .select('*')
    .order('serie')
    .order('nom')
  const { data: equipesPoules } = await supabase.from('equipes_poules').select('*')
  const { data: equipes } = await supabase.from('equipes').select('*')
  const { data: parties } = await supabase.from('parties').select('*')

  if (!poules || poules.length === 0) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center">
        <h1 className="text-3xl font-bold text-gray-800 mb-4">Résultats & Classements</h1>
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-8">
          <p className="text-yellow-800 text-lg">
            Les résultats ne sont pas encore disponibles.
          </p>
        </div>
      </div>
    )
  }

  const equipesMap = new Map((equipes as Equipe[])?.map((e) => [e.id, e]) || [])
  const series = ['1ere', '2eme'] as const

  return (
    <div className="max-w-5xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold text-gray-800 mb-8 text-center">
        Résultats & Classements
      </h1>

      {series.map((serie) => {
        const seriePoules = (poules as Poule[]).filter((p) => p.serie === serie)
        if (seriePoules.length === 0) return null

        return (
          <div key={serie} className="mb-10">
            <h2 className="text-2xl font-bold text-basque-green mb-4">
              {serie === '1ere' ? '1ère Série' : '2ème Série'}
            </h2>

            {seriePoules.map((poule) => {
              const pouleEquipeIds = (equipesPoules as EquipePoule[])
                ?.filter((ep) => ep.poule_id === poule.id)
                .map((ep) => ep.equipe_id) || []
              const pouleEquipes = pouleEquipeIds
                .map((id) => equipesMap.get(id))
                .filter(Boolean) as Equipe[]
              const pouleParties = (parties as Partie[])?.filter(
                (p) => p.poule_id === poule.id
              ) || []

              const classement = calculerClassement(pouleEquipes, pouleParties)

              return (
                <div key={poule.id} className="mb-6">
                  <h3 className="font-bold text-lg text-basque-red mb-2">{poule.nom}</h3>
                  <div className="overflow-x-auto">
                    <table className="w-full bg-white rounded-xl shadow text-sm">
                      <thead>
                        <tr className="bg-gray-50 text-gray-600">
                          <th className="text-left px-4 py-3">#</th>
                          <th className="text-left px-4 py-3">Équipe</th>
                          <th className="text-center px-2 py-3">J</th>
                          <th className="text-center px-2 py-3">V</th>
                          <th className="text-center px-2 py-3">N</th>
                          <th className="text-center px-2 py-3">D</th>
                          <th className="text-center px-2 py-3">PM</th>
                          <th className="text-center px-2 py-3">PE</th>
                          <th className="text-center px-2 py-3">Diff</th>
                          <th className="text-center px-2 py-3 font-bold">Pts</th>
                        </tr>
                      </thead>
                      <tbody>
                        {classement.map((c, i) => (
                          <tr
                            key={c.equipe.id}
                            className={`border-t ${i === 0 ? 'bg-green-50' : ''}`}
                          >
                            <td className="px-4 py-2.5 font-bold text-gray-400">
                              {i + 1}
                            </td>
                            <td className="px-4 py-2.5 font-medium text-gray-800">
                              {c.equipe.garcon} & {c.equipe.fille}
                            </td>
                            <td className="text-center px-2 py-2.5">{c.joues}</td>
                            <td className="text-center px-2 py-2.5 text-green-600">
                              {c.victoires}
                            </td>
                            <td className="text-center px-2 py-2.5 text-yellow-600">
                              {c.nuls}
                            </td>
                            <td className="text-center px-2 py-2.5 text-red-600">
                              {c.defaites}
                            </td>
                            <td className="text-center px-2 py-2.5">{c.pointsMarques}</td>
                            <td className="text-center px-2 py-2.5">{c.pointsEncaisses}</td>
                            <td className="text-center px-2 py-2.5">
                              <span
                                className={
                                  c.diff > 0
                                    ? 'text-green-600'
                                    : c.diff < 0
                                    ? 'text-red-600'
                                    : ''
                                }
                              >
                                {c.diff > 0 ? '+' : ''}
                                {c.diff}
                              </span>
                            </td>
                            <td className="text-center px-2 py-2.5 font-bold text-basque-red">
                              {c.points}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )
            })}
          </div>
        )
      })}
    </div>
  )
}
