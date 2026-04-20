'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { Equipe, Partie, Poule } from '@/lib/types'
import { genererCalendrier } from '@/lib/calendrier'
import {
  INDISPOS,
  DISPO_UNIQUEMENT,
  SLOT_MAX,
  COVOITURAGES,
  VENDREDI_SLOT_1,
  FRONTON_FERME,
  FERIES,
} from '@/lib/calendrier-constraints'

export default function AdminCalendrier() {
  const [parties, setParties] = useState<Partie[]>([])
  const [equipes, setEquipes] = useState<Equipe[]>([])
  const [poules, setPoules] = useState<Poule[]>([])
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null)

  const supabase = createClient()

  async function loadData() {
    const [paRes, eqRes, poRes] = await Promise.all([
      supabase.from('parties').select('*'),
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

  async function lancerGeneration() {
    if (
      parties.some((p) => p.jour) &&
      !confirm(
        'Des dates sont déjà saisies pour certaines parties. Générer un nouveau calendrier écrasera les dates/heures existantes et dépubliera le programme. Continuer ?'
      )
    ) {
      return
    }

    setGenerating(true)
    setResult(null)

    const res = genererCalendrier(parties, equipes)

    if (!res.success) {
      setResult({
        success: false,
        message: res.error || 'Erreur inconnue',
      })
      setGenerating(false)
      return
    }

    // Enregistrer en base : jour+heure + dépublier
    const updates = res.assignments.map((a) =>
      supabase
        .from('parties')
        .update({ jour: a.jour, heure: a.heure, publie: false })
        .eq('id', a.partie_id)
    )
    await Promise.all(updates)

    // Recharger
    await loadData()
    setResult({
      success: true,
      message: `Calendrier généré avec succès ! ${res.assignments.length} parties planifiées. Le programme n'est PAS encore publié — vérifiez-le puis publiez-le depuis la page Programme.`,
    })
    setGenerating(false)
  }

  if (loading) return <p className="text-gray-500">Chargement...</p>

  const nbPublie = parties.filter((p) => p.publie).length
  const nbPlanifie = parties.filter((p) => p.jour).length

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-4">Calendrier automatique</h1>
      <p className="text-sm text-gray-500 mb-6">
        Génère automatiquement les dates et horaires de toutes les parties en respectant les contraintes.
      </p>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        <div className="bg-white rounded-xl shadow p-4 text-center">
          <div className="text-2xl font-bold text-basque-red">{parties.length}</div>
          <div className="text-xs text-gray-500 mt-1">Parties au total</div>
        </div>
        <div className="bg-white rounded-xl shadow p-4 text-center">
          <div className="text-2xl font-bold text-basque-green">{nbPlanifie}</div>
          <div className="text-xs text-gray-500 mt-1">Planifiées</div>
        </div>
        <div className="bg-white rounded-xl shadow p-4 text-center">
          <div className={`text-2xl font-bold ${nbPublie > 0 ? 'text-green-600' : 'text-gray-400'}`}>{nbPublie}</div>
          <div className="text-xs text-gray-500 mt-1">Publiées</div>
        </div>
      </div>

      {/* Bouton générer */}
      <div className="mb-8">
        <button
          onClick={lancerGeneration}
          disabled={generating || parties.length === 0}
          className="bg-basque-green text-white font-bold px-6 py-3 rounded-lg hover:bg-basque-green-dark transition disabled:opacity-50"
        >
          {generating ? '⏳ Génération en cours...' : '🤖 Générer le calendrier automatiquement'}
        </button>
        <p className="text-xs text-gray-500 mt-2">
          Le programme ne sera pas publié automatiquement. Vous pourrez le réviser puis le publier depuis la page Programme.
        </p>
      </div>

      {/* Résultat */}
      {result && (
        <div
          className={`mb-8 p-4 rounded-lg ${
            result.success
              ? 'bg-green-50 border border-green-200 text-green-800'
              : 'bg-red-50 border border-red-200 text-red-800'
          }`}
        >
          <p className="font-medium">{result.success ? '✅ Succès' : '❌ Erreur'}</p>
          <p className="text-sm mt-1">{result.message}</p>
        </div>
      )}

      {/* Récap des contraintes */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-5 text-sm text-blue-900">
        <h2 className="font-bold text-base mb-3">📋 Contraintes appliquées</h2>

        <div className="mb-3">
          <strong>Période :</strong> du 27/04/2026 au 26/06/2026 (lun-ven)
        </div>

        <div className="mb-3">
          <strong>Fronton fermé :</strong> du 28/05 au 10/06 ({FRONTON_FERME.length} jours)
        </div>

        <div className="mb-3">
          <strong>Jours fériés :</strong> {FERIES.join(', ')}
        </div>

        <div className="mb-3">
          <strong>Créneaux :</strong> 18:30 · 19:15 · 20:00
        </div>

        <details className="mb-3">
          <summary className="cursor-pointer font-bold">Indispos par équipe ({INDISPOS.length})</summary>
          <ul className="mt-2 space-y-1 text-xs">
            {INDISPOS.map((i) => (
              <li key={i.nom}>
                <strong>{i.nom}</strong> : {i.dates.join(', ')}
              </li>
            ))}
          </ul>
        </details>

        <details className="mb-3">
          <summary className="cursor-pointer font-bold">Dispo uniquement ({DISPO_UNIQUEMENT.length})</summary>
          <ul className="mt-2 space-y-1 text-xs">
            {DISPO_UNIQUEMENT.map((d) => (
              <li key={d.nom}>
                <strong>{d.nom}</strong> : {d.dates.length} dates
              </li>
            ))}
          </ul>
        </details>

        <details className="mb-3">
          <summary className="cursor-pointer font-bold">Créneaux limités ({SLOT_MAX.length})</summary>
          <ul className="mt-2 space-y-1 text-xs">
            {SLOT_MAX.map((s) => (
              <li key={s.nom}>
                <strong>{s.nom}</strong> : créneau max = {s.maxSlotIdx === 0 ? '18:30' : s.maxSlotIdx === 1 ? '19:15' : '20:00'}
              </li>
            ))}
          </ul>
        </details>

        <details className="mb-3">
          <summary className="cursor-pointer font-bold">Covoiturages ({COVOITURAGES.length})</summary>
          <ul className="mt-2 space-y-1 text-xs">
            {COVOITURAGES.map((c) => (
              <li key={c.nom}>{c.nom}</li>
            ))}
          </ul>
        </details>

        <details>
          <summary className="cursor-pointer font-bold">Contraintes vendredi ({VENDREDI_SLOT_1.length})</summary>
          <ul className="mt-2 space-y-1 text-xs">
            {VENDREDI_SLOT_1.map((v) => (
              <li key={v.nom}>
                <strong>{v.nom}</strong> : slot 1 (18:30) obligatoire si vendredi
              </li>
            ))}
          </ul>
        </details>
      </div>
    </div>
  )
}
