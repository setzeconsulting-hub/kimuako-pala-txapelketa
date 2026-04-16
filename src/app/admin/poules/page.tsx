'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { Equipe, Poule, EquipePoule } from '@/lib/types'

// Contraintes : ces paires d'équipes ne doivent PAS être dans la même poule
// Chaque entrée = [joueur1_equipeA, joueur1_equipeB] (on cherche par nom de garcon ou fille)
const CONTRAINTES_SEPARATION = [
  { equipe1: { garcon: 'Oihana', fille: 'Lur' }, equipe2: { garcon: 'Marie', fille: 'Julien' } },
]

function doiventEtreSeparees(eq1: Equipe, eq2: Equipe): boolean {
  return CONTRAINTES_SEPARATION.some((c) => {
    const match1 = (
      (eq1.garcon.toLowerCase().includes(c.equipe1.garcon.toLowerCase()) &&
        eq1.fille.toLowerCase().includes(c.equipe1.fille.toLowerCase())) ||
      (eq1.fille.toLowerCase().includes(c.equipe1.garcon.toLowerCase()) &&
        eq1.garcon.toLowerCase().includes(c.equipe1.fille.toLowerCase()))
    )
    const match2 = (
      (eq2.garcon.toLowerCase().includes(c.equipe2.garcon.toLowerCase()) &&
        eq2.fille.toLowerCase().includes(c.equipe2.fille.toLowerCase())) ||
      (eq2.fille.toLowerCase().includes(c.equipe2.garcon.toLowerCase()) &&
        eq2.garcon.toLowerCase().includes(c.equipe2.fille.toLowerCase()))
    )
    const match1Reverse = (
      (eq1.garcon.toLowerCase().includes(c.equipe2.garcon.toLowerCase()) &&
        eq1.fille.toLowerCase().includes(c.equipe2.fille.toLowerCase())) ||
      (eq1.fille.toLowerCase().includes(c.equipe2.garcon.toLowerCase()) &&
        eq1.garcon.toLowerCase().includes(c.equipe2.fille.toLowerCase()))
    )
    const match2Reverse = (
      (eq2.garcon.toLowerCase().includes(c.equipe1.garcon.toLowerCase()) &&
        eq2.fille.toLowerCase().includes(c.equipe1.fille.toLowerCase())) ||
      (eq2.fille.toLowerCase().includes(c.equipe1.garcon.toLowerCase()) &&
        eq2.garcon.toLowerCase().includes(c.equipe1.fille.toLowerCase()))
    )
    return (match1 && match2) || (match1Reverse && match2Reverse)
  })
}

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

    // Équipes validées uniquement (pas besoin d'avoir payé)
    const eligibles = equipes.filter((e) => e.statut === 'validee')

    for (const serie of ['1ere', '2eme'] as const) {
      const serieEquipes = eligibles.filter((e) => e.serie === serie)
      if (serieEquipes.length < 2) continue

      // Calcul du nombre de poules adapté :
      // 1ère série : 12 équipes → 3 poules de 4
      // 2ème série : 18 équipes → 3 poules de 6
      // Règle générale : viser 4 équipes/poule en S1, 6 en S2
      const taillePoule = serie === '1ere' ? 4 : 6
      let nbPoules = Math.max(1, Math.round(serieEquipes.length / taillePoule))
      if (nbPoules < 1) nbPoules = 1

      // Mélanger aléatoirement
      const shuffled = [...serieEquipes].sort(() => Math.random() - 0.5)

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
      const pouleAssignments: { equipe_id: string; poule_id: string }[][] =
        Array.from({ length: nbPoules }, () => [])

      shuffled.forEach((equipe, index) => {
        const pouleIndex = index % nbPoules
        pouleAssignments[pouleIndex].push({
          equipe_id: equipe.id,
          poule_id: newPoules[pouleIndex].id,
        })
      })

      // Vérifier les contraintes de séparation et corriger si nécessaire
      for (let attempt = 0; attempt < 20; attempt++) {
        let violated = false
        for (let p = 0; p < nbPoules; p++) {
          const pouleEquipes = pouleAssignments[p].map(
            (a) => shuffled.find((e) => e.id === a.equipe_id)!
          )
          for (let i = 0; i < pouleEquipes.length; i++) {
            for (let j = i + 1; j < pouleEquipes.length; j++) {
              if (doiventEtreSeparees(pouleEquipes[i], pouleEquipes[j])) {
                violated = true
                // Trouver une autre poule pour échanger
                const autrePoule = (p + 1) % nbPoules
                // Échanger l'équipe j avec la dernière de l'autre poule
                if (pouleAssignments[autrePoule].length > 0) {
                  const temp = pouleAssignments[p][j]
                  const swapIdx = pouleAssignments[autrePoule].length - 1
                  pouleAssignments[p][j] = {
                    ...pouleAssignments[autrePoule][swapIdx],
                    poule_id: newPoules[p].id,
                  }
                  pouleAssignments[autrePoule][swapIdx] = {
                    ...temp,
                    poule_id: newPoules[autrePoule].id,
                  }
                }
              }
            }
          }
        }
        if (!violated) break
      }

      const insertions = pouleAssignments.flat()
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

  const eligibles = equipes.filter((e) => e.statut === 'validee')

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-4">Gestion des poules</h1>

      {/* Infos */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6 text-sm text-blue-800">
        <p>
          <strong>{eligibles.length}</strong> équipes éligibles (validées) :
          {' '}{eligibles.filter((e) => e.serie === '1ere').length} en 1ère série (poules de 4),
          {' '}{eligibles.filter((e) => e.serie === '2eme').length} en 2ème série (poules de 6).
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
                        <h3 className="font-bold text-basque-green mb-2">
                          {poule.nom} ({pouleEquipes.length} éq.)
                        </h3>
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
