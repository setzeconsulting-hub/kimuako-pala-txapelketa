'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { Equipe, Partie, Poule } from '@/lib/types'

export default function AdminProgramme() {
  const [parties, setParties] = useState<Partie[]>([])
  const [equipes, setEquipes] = useState<Equipe[]>([])
  const [poules, setPoules] = useState<Poule[]>([])
  const [loading, setLoading] = useState(true)

  const supabase = createClient()

  async function loadData() {
    const [paRes, eqRes, poRes] = await Promise.all([
      supabase.from('parties').select('*').order('heure', { ascending: true }),
      supabase.from('equipes').select('*'),
      supabase.from('poules').select('*'),
    ])
    setParties((paRes.data as Partie[]) || [])
    setEquipes((eqRes.data as Equipe[]) || [])
    setPoules((poRes.data as Poule[]) || [])
    setLoading(false)
  }

  useEffect(() => {
    loadData()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function updatePartie(id: string, field: 'jour' | 'heure', value: string) {
    await supabase.from('parties').update({ [field]: value }).eq('id', id)
    setParties((prev) =>
      prev.map((p) => (p.id === id ? { ...p, [field]: value } : p))
    )
  }

  async function publierTout() {
    if (!confirm('Publier TOUT le programme ? Les parties seront visibles publiquement.')) return
    await supabase.from('parties').update({ publie: true }).neq('id', '00000000-0000-0000-0000-000000000000')
    setParties((prev) => prev.map((p) => ({ ...p, publie: true })))
  }

  async function depublierTout() {
    if (!confirm('Dépublier TOUT le programme ? Plus rien ne sera visible publiquement.')) return
    await supabase.from('parties').update({ publie: false }).neq('id', '00000000-0000-0000-0000-000000000000')
    setParties((prev) => prev.map((p) => ({ ...p, publie: false })))
  }

  if (loading) return <p className="text-gray-500">Chargement...</p>

  const equipesMap = new Map(equipes.map((e) => [e.id, e]))
  const poulesMap = new Map(poules.map((p) => [p.id, p]))

  if (parties.length === 0) {
    return (
      <div>
        <h1 className="text-2xl font-bold text-gray-800 mb-4">Programme</h1>
        <p className="text-gray-500">Aucune partie. Générez d&apos;abord les poules.</p>
      </div>
    )
  }

  // Grouper les parties par jour
  const partiesByJour = new Map<string, Partie[]>()
  parties.forEach((p) => {
    const jour = p.jour || 'Non planifié'
    if (!partiesByJour.has(jour)) partiesByJour.set(jour, [])
    partiesByJour.get(jour)!.push(p)
  })

  const joursOrdonnes = Array.from(partiesByJour.keys()).sort((a, b) => {
    if (a === 'Non planifié') return 1
    if (b === 'Non planifié') return -1
    return a.localeCompare(b)
  })

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-4">Gestion du programme</h1>
      <p className="text-sm text-gray-500 mb-4">
        Saisissez le jour et l&apos;heure pour chaque partie.
      </p>

      {/* Statut publication */}
      <div className="mb-6 p-4 bg-gray-50 rounded-lg flex flex-col sm:flex-row sm:items-center gap-3">
        <div className="flex-1 text-sm">
          <span className="font-medium">Publication : </span>
          <span className={parties.some((p) => p.publie) ? 'text-green-600 font-bold' : 'text-gray-500'}>
            {parties.filter((p) => p.publie).length} / {parties.length} parties publiées
          </span>
        </div>
        <div className="flex gap-2">
          <button
            onClick={publierTout}
            className="bg-basque-green text-white font-medium px-4 py-2 rounded-lg hover:bg-basque-green-dark transition text-sm"
          >
            🌐 Tout publier
          </button>
          <button
            onClick={depublierTout}
            className="bg-gray-600 text-white font-medium px-4 py-2 rounded-lg hover:bg-gray-700 transition text-sm"
          >
            🔒 Tout dépublier
          </button>
        </div>
      </div>

      {joursOrdonnes.map((jour) => (
        <div key={jour} className="mb-8">
          <h2 className="text-lg font-bold text-basque-green mb-3">
            {jour === 'Non planifié' ? 'Non planifié' : new Date(jour + 'T00:00:00').toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}
          </h2>
          <div className="space-y-3">
            {partiesByJour.get(jour)!.map((partie) => {
              const eq1 = equipesMap.get(partie.equipe1_id)
              const eq2 = equipesMap.get(partie.equipe2_id)
              const poule = poulesMap.get(partie.poule_id)

              return (
                <div
                  key={partie.id}
                  className="bg-white rounded-xl shadow p-4 flex flex-col sm:flex-row items-start sm:items-center gap-3"
                >
                  {/* Poule */}
                  <span className="text-xs bg-basque-red/10 text-basque-red px-2 py-0.5 rounded font-medium flex-shrink-0">
                    {poule?.nom}
                  </span>

                  {/* Equipes */}
                  <div className="flex-1 text-sm text-gray-800">
                    <span className="font-medium">
                      {eq1 ? `${eq1.garcon} & ${eq1.fille}` : '?'}
                    </span>
                    <span className="text-gray-400 mx-2">vs</span>
                    <span className="font-medium">
                      {eq2 ? `${eq2.garcon} & ${eq2.fille}` : '?'}
                    </span>
                  </div>

                  {/* Jour */}
                  <input
                    type="date"
                    value={partie.jour || ''}
                    onChange={(e) => updatePartie(partie.id, 'jour', e.target.value)}
                    className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm w-36"
                  />

                  {/* Heure */}
                  <input
                    type="time"
                    value={partie.heure || ''}
                    onChange={(e) => updatePartie(partie.id, 'heure', e.target.value)}
                    className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm w-28"
                  />

                </div>
              )
            })}
          </div>
        </div>
      ))}
    </div>
  )
}
