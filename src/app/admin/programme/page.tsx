'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { Equipe, Partie, Poule } from '@/lib/types'
import { SLOTS, getDatesPossibles } from '@/lib/calendrier-constraints'

export default function AdminProgramme() {
  const [parties, setParties] = useState<Partie[]>([])
  const [equipes, setEquipes] = useState<Equipe[]>([])
  const [poules, setPoules] = useState<Poule[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreneaux, setShowCreneaux] = useState(false)
  const [filterOnlyFree, setFilterOnlyFree] = useState(false)

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

      {/* Tableau des créneaux */}
      <div className="mb-8">
        <button
          onClick={() => setShowCreneaux(!showCreneaux)}
          className="text-sm text-basque-red hover:text-basque-red-dark underline font-medium mb-3"
        >
          {showCreneaux ? '▲ Masquer la vue créneaux' : '▼ Voir tous les créneaux (vue calendrier)'}
        </button>

        {showCreneaux && (() => {
          const datesPossibles = getDatesPossibles()
          // Map (jour_slotIdx) → partie
          const slotMap = new Map<string, Partie>()
          parties.forEach((p) => {
            if (!p.jour || !p.heure) return
            const slotIdx = SLOTS.indexOf(p.heure.substring(0, 5))
            if (slotIdx === -1) return
            slotMap.set(`${p.jour}_${slotIdx}`, p)
          })

          // Filtrer pour ne garder que les jours avec au moins 1 créneau libre si filterOnlyFree
          const displayedDates = filterOnlyFree
            ? datesPossibles.filter((jour) =>
                SLOTS.some((_, idx) => !slotMap.has(`${jour}_${idx}`))
              )
            : datesPossibles

          let countFree = 0
          let countBusy = 0
          datesPossibles.forEach((jour) => {
            SLOTS.forEach((_, idx) => {
              if (slotMap.has(`${jour}_${idx}`)) countBusy++
              else countFree++
            })
          })

          return (
            <div className="bg-white rounded-xl shadow p-4">
              <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                <div className="text-sm">
                  <span className="text-green-600 font-bold">{countFree}</span> créneaux libres ·
                  {' '}<span className="text-basque-red font-bold">{countBusy}</span> occupés
                </div>
                <label className="text-xs flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={filterOnlyFree}
                    onChange={(e) => setFilterOnlyFree(e.target.checked)}
                  />
                  Afficher uniquement les jours avec créneaux libres
                </label>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="bg-gray-50 text-gray-600">
                      <th className="text-left px-3 py-2 sticky left-0 bg-gray-50">Date</th>
                      {SLOTS.map((s) => (
                        <th key={s} className="px-3 py-2 text-center w-1/3">{s}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {displayedDates.map((jour) => {
                      const d = new Date(jour + 'T00:00:00')
                      const label = d.toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' })
                      return (
                        <tr key={jour} className="border-t">
                          <td className="px-3 py-2 font-medium sticky left-0 bg-white whitespace-nowrap">
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
                                <td key={slotIdx} className="px-3 py-2 text-center bg-red-50 text-xs">
                                  <div className="font-medium text-gray-800 leading-tight">
                                    {eq1 ? `${eq1.garcon.split(' ')[0]} & ${eq1.fille.split(' ')[0]}` : '?'}
                                  </div>
                                  <div className="text-gray-400 text-[10px]">vs</div>
                                  <div className="font-medium text-gray-800 leading-tight">
                                    {eq2 ? `${eq2.garcon.split(' ')[0]} & ${eq2.fille.split(' ')[0]}` : '?'}
                                  </div>
                                  <div className="text-[10px] text-basque-red mt-1">{poule?.nom}</div>
                                </td>
                              )
                            }
                            return (
                              <td key={slotIdx} className="px-3 py-2 text-center bg-green-50 text-green-700 font-medium">
                                Libre
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
        })()}
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
