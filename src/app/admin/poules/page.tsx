'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { Equipe, Poule, EquipePoule } from '@/lib/types'

export default function AdminPoules() {
  const [equipes, setEquipes] = useState<Equipe[]>([])
  const [poules, setPoules] = useState<Poule[]>([])
  const [equipesPoules, setEquipesPoules] = useState<EquipePoule[]>([])
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)

  const supabase = createClient()

  async function loadData() {
    const [eqRes, poRes, epRes] = await Promise.all([
      supabase.from('equipes').select('*'),
      supabase.from('poules').select('*').order('serie').order('nom'),
      supabase.from('equipes_poules').select('*'),
    ])
    setEquipes((eqRes.data as Equipe[]) || [])
    setPoules((poRes.data as Poule[]) || [])
    setEquipesPoules((epRes.data as EquipePoule[]) || [])
    setLoading(false)
  }

  useEffect(() => {
    loadData()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function genererPoules() {
    if (
      poules.length > 0 &&
      !confirm('Des poules existent déjà. Voulez-vous tout régénérer ? Cela supprimera aussi les parties existantes.')
    ) {
      return
    }

    setGenerating(true)

    // Supprimer les anciennes données
    await supabase.from('parties').delete().neq('id', '00000000-0000-0000-0000-000000000000')
    await supabase.from('equipes_poules').delete().neq('id', '00000000-0000-0000-0000-000000000000')
    await supabase.from('poules').delete().neq('id', '00000000-0000-0000-0000-000000000000')

    // Équipes validées et payées uniquement
    const eligibles = equipes.filter((e) => e.statut === 'validee' && e.paye)

    for (const serie of ['1ere', '2eme'] as const) {
      const serieEquipes = eligibles.filter((e) => e.serie === serie)
      if (serieEquipes.length < 2) continue

      // Mélanger aléatoirement
      const shuffled = [...serieEquipes].sort(() => Math.random() - 0.5)

      // Calculer le nombre de poules (4-5 équipes par poule)
      let nbPoules = Math.max(1, Math.round(shuffled.length / 4))
      // S'assurer qu'on a au moins 2 équipes par poule
      while (nbPoules > 1 && shuffled.length / nbPoules < 2) {
        nbPoules--
      }

      // Créer les poules
      const pouleNames = Array.from({ length: nbPoules }, (_, i) => {
        const serieLabel = serie === '1ere' ? 'S1' : 'S2'
        return `Poule ${serieLabel}-${String.fromCharCode(65 + i)}`
      })

      const { data: newPoules } = await supabase
        .from('poules')
        .insert(pouleNames.map((nom) => ({ nom, serie })))
        .select()

      if (!newPoules) continue

      // Répartir les équipes dans les poules (round-robin)
      const insertions: { equipe_id: string; poule_id: string }[] = []
      shuffled.forEach((equipe, index) => {
        const pouleIndex = index % nbPoules
        insertions.push({
          equipe_id: equipe.id,
          poule_id: newPoules[pouleIndex].id,
        })
      })

      await supabase.from('equipes_poules').insert(insertions)

      // Générer les parties (round-robin dans chaque poule)
      for (const poule of newPoules) {
        const pouleEquipeIds = insertions
          .filter((ins) => ins.poule_id === poule.id)
          .map((ins) => ins.equipe_id)

        const partiesInsert: {
          poule_id: string
          equipe1_id: string
          equipe2_id: string
        }[] = []

        for (let i = 0; i < pouleEquipeIds.length; i++) {
          for (let j = i + 1; j < pouleEquipeIds.length; j++) {
            partiesInsert.push({
              poule_id: poule.id,
              equipe1_id: pouleEquipeIds[i],
              equipe2_id: pouleEquipeIds[j],
            })
          }
        }

        if (partiesInsert.length > 0) {
          await supabase.from('parties').insert(partiesInsert)
        }
      }
    }

    await loadData()
    setGenerating(false)
  }

  if (loading) return <p className="text-gray-500">Chargement...</p>

  const eligibles = equipes.filter((e) => e.statut === 'validee' && e.paye)

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-4">Gestion des poules</h1>

      {/* Infos */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6 text-sm text-blue-800">
        <p>
          <strong>{eligibles.length}</strong> équipes éligibles (validées + payées) :
          {' '}{eligibles.filter((e) => e.serie === '1ere').length} en 1ère série,
          {' '}{eligibles.filter((e) => e.serie === '2eme').length} en 2ème série.
        </p>
      </div>

      {/* Bouton génération */}
      <button
        onClick={genererPoules}
        disabled={generating || eligibles.length < 2}
        className="bg-basque-green text-white font-bold px-6 py-2.5 rounded-lg hover:bg-basque-green-dark transition disabled:opacity-50 mb-8"
      >
        {generating
          ? 'Génération en cours...'
          : poules.length > 0
          ? 'Régénérer les poules'
          : 'Générer les poules'}
      </button>

      {/* Affichage des poules */}
      {poules.length > 0 && (
        <div className="space-y-6">
          {['1ere', '2eme'].map((serie) => {
            const seriePoules = poules.filter((p) => p.serie === serie)
            if (seriePoules.length === 0) return null

            return (
              <div key={serie}>
                <h2 className="text-xl font-bold text-basque-red mb-3">
                  {serie === '1ere' ? '1ère Série' : '2ème Série'}
                </h2>
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {seriePoules.map((poule) => {
                    const pouleEquipeIds = equipesPoules
                      .filter((ep) => ep.poule_id === poule.id)
                      .map((ep) => ep.equipe_id)
                    const pouleEquipes = pouleEquipeIds
                      .map((id) => equipes.find((e) => e.id === id))
                      .filter(Boolean) as Equipe[]

                    return (
                      <div key={poule.id} className="bg-white rounded-xl shadow p-4">
                        <h3 className="font-bold text-basque-green mb-2">{poule.nom}</h3>
                        <ul className="space-y-1">
                          {pouleEquipes.map((eq) => (
                            <li key={eq.id} className="text-sm text-gray-700 bg-gray-50 rounded px-2 py-1">
                              {eq.garcon} & {eq.fille}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
