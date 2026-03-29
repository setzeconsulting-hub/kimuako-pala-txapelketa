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

  async function updatePartie(id: string, field: 'heure' | 'terrain', value: string) {
    await supabase.from('parties').update({ [field]: value }).eq('id', id)
    setParties((prev) =>
      prev.map((p) => (p.id === id ? { ...p, [field]: value } : p))
    )
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

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-4">Gestion du programme</h1>
      <p className="text-sm text-gray-500 mb-6">
        Saisissez l&apos;heure et le terrain pour chaque partie.
      </p>

      <div className="space-y-3">
        {parties.map((partie) => {
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

              {/* Heure */}
              <input
                type="time"
                value={partie.heure || ''}
                onChange={(e) => updatePartie(partie.id, 'heure', e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm w-28"
              />

              {/* Terrain */}
              <input
                type="text"
                placeholder="Terrain"
                value={partie.terrain || ''}
                onChange={(e) => updatePartie(partie.id, 'terrain', e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm w-24"
              />
            </div>
          )
        })}
      </div>
    </div>
  )
}
