'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { Equipe, Partie, Poule } from '@/lib/types'

export default function AdminScores() {
  const [parties, setParties] = useState<Partie[]>([])
  const [equipes, setEquipes] = useState<Equipe[]>([])
  const [poules, setPoules] = useState<Poule[]>([])
  const [loading, setLoading] = useState(true)
  const [scores, setScores] = useState<Record<string, { score1: string; score2: string }>>({})

  const supabase = createClient()

  async function loadData() {
    const [paRes, eqRes, poRes] = await Promise.all([
      supabase.from('parties').select('*').order('heure', { ascending: true }),
      supabase.from('equipes').select('*'),
      supabase.from('poules').select('*'),
    ])
    const pa = (paRes.data as Partie[]) || []
    setParties(pa)
    setEquipes((eqRes.data as Equipe[]) || [])
    setPoules((poRes.data as Poule[]) || [])

    // Initialiser les scores locaux
    const s: Record<string, { score1: string; score2: string }> = {}
    pa.forEach((p) => {
      s[p.id] = {
        score1: p.score1 !== null ? String(p.score1) : '',
        score2: p.score2 !== null ? String(p.score2) : '',
      }
    })
    setScores(s)
    setLoading(false)
  }

  useEffect(() => {
    loadData()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function validerScore(partieId: string) {
    const s = scores[partieId]
    if (!s || s.score1 === '' || s.score2 === '') return

    await supabase
      .from('parties')
      .update({
        score1: parseInt(s.score1),
        score2: parseInt(s.score2),
        jouee: true,
      })
      .eq('id', partieId)

    setParties((prev) =>
      prev.map((p) =>
        p.id === partieId
          ? { ...p, score1: parseInt(s.score1), score2: parseInt(s.score2), jouee: true }
          : p
      )
    )
  }

  async function annulerScore(partieId: string) {
    await supabase
      .from('parties')
      .update({ score1: null, score2: null, jouee: false })
      .eq('id', partieId)

    setScores((prev) => ({
      ...prev,
      [partieId]: { score1: '', score2: '' },
    }))
    setParties((prev) =>
      prev.map((p) =>
        p.id === partieId ? { ...p, score1: null, score2: null, jouee: false } : p
      )
    )
  }

  if (loading) return <p className="text-gray-500">Chargement...</p>

  const equipesMap = new Map(equipes.map((e) => [e.id, e]))
  const poulesMap = new Map(poules.map((p) => [p.id, p]))

  if (parties.length === 0) {
    return (
      <div>
        <h1 className="text-2xl font-bold text-gray-800 mb-4">Saisie des scores</h1>
        <p className="text-gray-500">Aucune partie. Générez d&apos;abord les poules.</p>
      </div>
    )
  }

  const nonJouees = parties.filter((p) => !p.jouee)
  const jouees = parties.filter((p) => p.jouee)

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-4">Saisie des scores</h1>

      {/* Parties à jouer */}
      {nonJouees.length > 0 && (
        <div className="mb-8">
          <h2 className="text-lg font-bold text-gray-700 mb-3">
            Parties à jouer ({nonJouees.length})
          </h2>
          <div className="space-y-3">
            {nonJouees.map((partie) => {
              const eq1 = equipesMap.get(partie.equipe1_id)
              const eq2 = equipesMap.get(partie.equipe2_id)
              const poule = poulesMap.get(partie.poule_id)
              const s = scores[partie.id] || { score1: '', score2: '' }

              return (
                <div key={partie.id} className="bg-white rounded-xl shadow p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-xs bg-basque-red/10 text-basque-red px-2 py-0.5 rounded font-medium">
                      {poule?.nom}
                    </span>
                    {partie.heure && (
                      <span className="text-xs text-gray-500">{partie.heure}</span>
                    )}
                    {partie.jour && (
                      <span className="text-xs text-gray-500">
                        {new Date(partie.jour + 'T00:00:00').toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-3 flex-wrap">
                    <span className="text-sm font-medium text-gray-800 flex-1 min-w-0">
                      {eq1 ? `${eq1.garcon} & ${eq1.fille}` : '?'}
                    </span>
                    <input
                      type="number"
                      min="0"
                      value={s.score1}
                      onChange={(e) =>
                        setScores((prev) => ({
                          ...prev,
                          [partie.id]: { ...prev[partie.id], score1: e.target.value },
                        }))
                      }
                      className="border border-gray-300 rounded-lg px-3 py-1.5 w-16 text-center font-bold"
                      placeholder="0"
                    />
                    <span className="text-gray-400 font-bold">-</span>
                    <input
                      type="number"
                      min="0"
                      value={s.score2}
                      onChange={(e) =>
                        setScores((prev) => ({
                          ...prev,
                          [partie.id]: { ...prev[partie.id], score2: e.target.value },
                        }))
                      }
                      className="border border-gray-300 rounded-lg px-3 py-1.5 w-16 text-center font-bold"
                      placeholder="0"
                    />
                    <span className="text-sm font-medium text-gray-800 flex-1 min-w-0 text-right">
                      {eq2 ? `${eq2.garcon} & ${eq2.fille}` : '?'}
                    </span>
                    <button
                      onClick={() => validerScore(partie.id)}
                      disabled={s.score1 === '' || s.score2 === ''}
                      className="bg-basque-green text-white px-4 py-1.5 rounded-lg text-sm font-medium hover:bg-basque-green-dark disabled:opacity-50"
                    >
                      Valider
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Parties jouées */}
      {jouees.length > 0 && (
        <div>
          <h2 className="text-lg font-bold text-gray-700 mb-3">
            Parties terminées ({jouees.length})
          </h2>
          <div className="space-y-2">
            {jouees.map((partie) => {
              const eq1 = equipesMap.get(partie.equipe1_id)
              const eq2 = equipesMap.get(partie.equipe2_id)
              const poule = poulesMap.get(partie.poule_id)

              return (
                <div
                  key={partie.id}
                  className="bg-white rounded-xl shadow p-3 flex items-center gap-3 border-l-4 border-basque-green"
                >
                  <span className="text-xs bg-basque-red/10 text-basque-red px-2 py-0.5 rounded font-medium">
                    {poule?.nom}
                  </span>
                  <span className="text-sm text-gray-800 flex-1">
                    {eq1 ? `${eq1.garcon} & ${eq1.fille}` : '?'}
                  </span>
                  <span className="bg-basque-green text-white font-bold px-3 py-1 rounded text-sm">
                    {partie.score1} - {partie.score2}
                  </span>
                  <span className="text-sm text-gray-800 flex-1 text-right">
                    {eq2 ? `${eq2.garcon} & ${eq2.fille}` : '?'}
                  </span>
                  <button
                    onClick={() => annulerScore(partie.id)}
                    className="text-xs text-red-500 hover:text-red-700"
                  >
                    Annuler
                  </button>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
