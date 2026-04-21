'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { DemandeReport, Equipe, Partie, Poule } from '@/lib/types'

export default function AdminDemandes() {
  const [demandes, setDemandes] = useState<DemandeReport[]>([])
  const [parties, setParties] = useState<Partie[]>([])
  const [equipes, setEquipes] = useState<Equipe[]>([])
  const [poules, setPoules] = useState<Poule[]>([])
  const [loading, setLoading] = useState(true)

  const supabase = createClient()

  async function loadData() {
    const [dRes, paRes, eRes, poRes] = await Promise.all([
      supabase.from('demandes_report').select('*').order('created_at', { ascending: false }),
      supabase.from('parties').select('*'),
      supabase.from('equipes').select('*'),
      supabase.from('poules').select('*'),
    ])
    setDemandes((dRes.data as DemandeReport[]) || [])
    setParties((paRes.data as Partie[]) || [])
    setEquipes((eRes.data as Equipe[]) || [])
    setPoules((poRes.data as Poule[]) || [])
    setLoading(false)
  }

  useEffect(() => {
    loadData()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function validerDemande(d: DemandeReport) {
    if (!d.nouveau_jour || !d.nouveau_heure) {
      alert('Impossible de valider : date ou heure manquante dans la demande.')
      return
    }

    // Vérifier qu'aucune autre partie n'occupe déjà ce créneau
    const autre = parties.find(
      (p) =>
        p.id !== d.partie_id &&
        p.jour === d.nouveau_jour &&
        p.heure &&
        p.heure.substring(0, 5) === d.nouveau_heure
    )
    if (autre) {
      const eqA = equipes.find((e) => e.id === autre.equipe1_id)
      const eqB = equipes.find((e) => e.id === autre.equipe2_id)
      if (
        !confirm(
          `⚠️ Ce créneau est déjà occupé par ${eqA?.garcon} & ${eqA?.fille} vs ${eqB?.garcon} & ${eqB?.fille}.\nValider quand même ? (il y aura un conflit à résoudre)`
        )
      ) {
        return
      }
    }

    // Mettre à jour la partie (nouvelle date/heure) — on DÉPUBLIE pour éviter affichage de travers
    await supabase
      .from('parties')
      .update({ jour: d.nouveau_jour, heure: d.nouveau_heure, publie: false })
      .eq('id', d.partie_id)

    // Marquer la demande validée
    await supabase.from('demandes_report').update({ statut: 'validee' }).eq('id', d.id)

    await loadData()
  }

  async function refuserDemande(d: DemandeReport) {
    if (!confirm('Refuser cette demande ?')) return
    await supabase.from('demandes_report').update({ statut: 'refusee' }).eq('id', d.id)
    await loadData()
  }

  async function supprimerDemande(d: DemandeReport) {
    if (!confirm('Supprimer cette demande définitivement ?')) return
    await supabase.from('demandes_report').delete().eq('id', d.id)
    await loadData()
  }

  if (loading) return <p className="text-gray-500">Chargement...</p>

  const equipesMap = new Map(equipes.map((e) => [e.id, e]))
  const poulesMap = new Map(poules.map((p) => [p.id, p]))
  const partiesMap = new Map(parties.map((p) => [p.id, p]))

  const enAttente = demandes.filter((d) => d.statut === 'en_attente')
  const traitees = demandes.filter((d) => d.statut !== 'en_attente')

  // Détection de conflits : 2+ demandes en attente pour le même créneau
  const conflits = new Map<string, DemandeReport[]>()
  enAttente.forEach((d) => {
    if (!d.nouveau_jour || !d.nouveau_heure) return
    const k = `${d.nouveau_jour}_${d.nouveau_heure}`
    if (!conflits.has(k)) conflits.set(k, [])
    conflits.get(k)!.push(d)
  })
  const creneauxEnConflit = new Set<string>()
  Array.from(conflits.entries()).forEach(([k, ds]) => {
    if (ds.length > 1) creneauxEnConflit.add(k)
  })

  function renderDemande(d: DemandeReport) {
    const partie = partiesMap.get(d.partie_id)
    const eq1 = partie ? equipesMap.get(partie.equipe1_id) : null
    const eq2 = partie ? equipesMap.get(partie.equipe2_id) : null
    const poule = partie ? poulesMap.get(partie.poule_id) : null
    const creneauKey = `${d.nouveau_jour}_${d.nouveau_heure}`
    const enConflit = creneauxEnConflit.has(creneauKey)

    return (
      <div
        key={d.id}
        className={`bg-white rounded-xl shadow p-4 ${
          enConflit ? 'border-2 border-yellow-400' : ''
        }`}
      >
        {enConflit && (
          <p className="text-yellow-700 text-xs font-bold mb-2">
            ⚠️ Conflit : plusieurs équipes demandent ce créneau
          </p>
        )}
        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          <div className="flex-1">
            <p className="text-xs text-basque-red font-medium">{poule?.nom}</p>
            <p className="font-semibold text-gray-800 text-sm">
              {eq1 ? `${eq1.garcon} & ${eq1.fille}` : '?'}
              <span className="text-gray-400 mx-2">vs</span>
              {eq2 ? `${eq2.garcon} & ${eq2.fille}` : '?'}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              Actuel :{' '}
              {partie?.jour
                ? `${new Date(partie.jour + 'T00:00:00').toLocaleDateString('fr-FR', {
                    weekday: 'short',
                    day: 'numeric',
                    month: 'short',
                  })} à ${partie.heure?.substring(0, 5) || '?'}`
                : 'non planifié'}
            </p>
            <p className="text-sm text-basque-green font-medium mt-1">
              → Proposé :{' '}
              {d.nouveau_jour
                ? `${new Date(d.nouveau_jour + 'T00:00:00').toLocaleDateString('fr-FR', {
                    weekday: 'long',
                    day: 'numeric',
                    month: 'long',
                  })} à ${d.nouveau_heure}`
                : '—'}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              De : <span className="font-medium">{d.email_demandeur}</span>
            </p>
            {d.message && (
              <p className="text-sm text-gray-600 mt-2 italic bg-gray-50 rounded p-2">
                &ldquo;{d.message}&rdquo;
              </p>
            )}
            <p className="text-xs text-gray-400 mt-1">
              Reçue le {new Date(d.created_at).toLocaleString('fr-FR')}
            </p>
          </div>

          {d.statut === 'en_attente' ? (
            <div className="flex gap-2 flex-shrink-0">
              <button
                onClick={() => validerDemande(d)}
                className="bg-basque-green text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-basque-green-dark transition"
              >
                ✓ Valider
              </button>
              <button
                onClick={() => refuserDemande(d)}
                className="bg-red-600 text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-red-700 transition"
              >
                ✗ Refuser
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2 flex-shrink-0">
              <span
                className={`text-xs font-medium px-3 py-1 rounded-full ${
                  d.statut === 'validee' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
                }`}
              >
                {d.statut === 'validee' ? '✓ Validée' : '✗ Refusée'}
              </span>
              <button
                onClick={() => supprimerDemande(d)}
                className="text-xs text-gray-400 hover:text-red-600"
              >
                🗑️
              </button>
            </div>
          )}
        </div>
      </div>
    )
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-4">Demandes de report</h1>
      <p className="text-sm text-gray-500 mb-6">
        Demandes de changement de créneau envoyées par les participants.
      </p>

      {enAttente.length > 0 && (
        <div className="mb-8">
          <h2 className="text-lg font-bold text-gray-700 mb-3">
            En attente ({enAttente.length})
          </h2>
          <div className="space-y-3">
            {enAttente.map(renderDemande)}
          </div>
        </div>
      )}

      {enAttente.length === 0 && traitees.length === 0 && (
        <div className="bg-gray-50 rounded-xl p-8 text-center text-gray-500">
          Aucune demande de report pour le moment.
        </div>
      )}

      {traitees.length > 0 && (
        <div>
          <h2 className="text-lg font-bold text-gray-700 mb-3">
            Traitées ({traitees.length})
          </h2>
          <div className="space-y-3">
            {traitees.map(renderDemande)}
          </div>
        </div>
      )}
    </div>
  )
}
