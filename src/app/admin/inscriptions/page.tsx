'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { Equipe } from '@/lib/types'

export default function AdminInscriptions() {
  const [equipes, setEquipes] = useState<Equipe[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'en_attente' | 'validee' | 'refusee'>('all')

  const supabase = createClient()

  async function loadEquipes() {
    const { data } = await supabase
      .from('equipes')
      .select('*')
      .order('created_at', { ascending: false })
    setEquipes((data as Equipe[]) || [])
    setLoading(false)
  }

  useEffect(() => {
    loadEquipes()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function updateStatut(id: string, statut: string) {
    await supabase.from('equipes').update({ statut }).eq('id', id)
    loadEquipes()
  }

  async function togglePaye(id: string, paye: boolean) {
    await supabase.from('equipes').update({ paye: !paye }).eq('id', id)
    loadEquipes()
  }

  async function deleteEquipe(id: string) {
    if (!confirm('Supprimer cette équipe ?')) return
    await supabase.from('equipes').delete().eq('id', id)
    loadEquipes()
  }

  const filtered = filter === 'all' ? equipes : equipes.filter((e) => e.statut === filter)

  if (loading) return <p className="text-gray-500">Chargement...</p>

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-4">Gestion des inscriptions</h1>

      {/* Filtres */}
      <div className="flex gap-2 mb-4 flex-wrap">
        {[
          { value: 'all', label: 'Toutes' },
          { value: 'en_attente', label: 'En attente' },
          { value: 'validee', label: 'Validées' },
          { value: 'refusee', label: 'Refusées' },
        ].map((f) => (
          <button
            key={f.value}
            onClick={() => setFilter(f.value as typeof filter)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${
              filter === f.value
                ? 'bg-basque-red text-white'
                : 'bg-white text-gray-700 border hover:bg-gray-50'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Tableau */}
      <div className="overflow-x-auto">
        <table className="w-full bg-white rounded-xl shadow text-sm">
          <thead>
            <tr className="bg-gray-50 text-gray-600 text-left">
              <th className="px-4 py-3">Joueur.se 1</th>
              <th className="px-4 py-3">Joueur.se 2</th>
              <th className="px-4 py-3 hidden sm:table-cell">Email</th>
              <th className="px-3 py-3">Série</th>
              <th className="px-3 py-3">Statut</th>
              <th className="px-3 py-3">Paiement</th>
              <th className="px-3 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((equipe) => (
              <tr key={equipe.id} className="border-t">
                <td className="px-4 py-2.5 font-medium">{equipe.garcon}</td>
                <td className="px-4 py-2.5 font-medium">{equipe.fille}</td>
                <td className="px-4 py-2.5 text-gray-500 hidden sm:table-cell">
                  {equipe.email}
                </td>
                <td className="px-3 py-2.5">
                  <span className="bg-gray-100 px-2 py-0.5 rounded text-xs">
                    {equipe.serie === '1ere' ? '1ère' : '2ème'}
                  </span>
                </td>
                <td className="px-3 py-2.5">
                  <span
                    className={`px-2 py-0.5 rounded text-xs font-medium ${
                      equipe.statut === 'validee'
                        ? 'bg-green-100 text-green-700'
                        : equipe.statut === 'refusee'
                        ? 'bg-red-100 text-red-700'
                        : 'bg-yellow-100 text-yellow-700'
                    }`}
                  >
                    {equipe.statut === 'validee'
                      ? 'Validée'
                      : equipe.statut === 'refusee'
                      ? 'Refusée'
                      : 'En attente'}
                  </span>
                </td>
                <td className="px-3 py-2.5">
                  <button
                    onClick={() => togglePaye(equipe.id, equipe.paye)}
                    className={`px-2 py-0.5 rounded text-xs font-medium ${
                      equipe.paye
                        ? 'bg-green-100 text-green-700'
                        : 'bg-red-100 text-red-700'
                    }`}
                  >
                    {equipe.paye ? 'Payé' : 'Non payé'}
                  </button>
                </td>
                <td className="px-3 py-2.5">
                  <div className="flex gap-1 flex-wrap">
                    {equipe.statut !== 'validee' && (
                      <button
                        onClick={() => updateStatut(equipe.id, 'validee')}
                        className="bg-green-500 text-white px-2 py-1 rounded text-xs hover:bg-green-600"
                      >
                        Valider
                      </button>
                    )}
                    {equipe.statut !== 'refusee' && (
                      <button
                        onClick={() => updateStatut(equipe.id, 'refusee')}
                        className="bg-red-500 text-white px-2 py-1 rounded text-xs hover:bg-red-600"
                      >
                        Refuser
                      </button>
                    )}
                    <button
                      onClick={() => deleteEquipe(equipe.id)}
                      className="bg-gray-300 text-gray-700 px-2 py-1 rounded text-xs hover:bg-gray-400"
                    >
                      Suppr.
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {filtered.length === 0 && (
        <p className="text-center text-gray-400 py-8">Aucune équipe trouvée.</p>
      )}
    </div>
  )
}
