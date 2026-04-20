// Algorithme de génération automatique du calendrier
// Utilise un backtracking avec heuristiques

import { Equipe, Partie } from './types'
import {
  SLOTS,
  INDISPOS,
  DISPO_UNIQUEMENT,
  SLOT_MAX,
  COVOITURAGES,
  VENDREDI_SLOT_1,
  matchTeam,
  getDatesPossibles,
  estVendredi,
} from './calendrier-constraints'

export interface Assignment {
  partie_id: string
  jour: string
  heure: string
}

interface Candidate {
  jour: string
  slotIdx: number
}

interface TeamMeta {
  indispos: Set<string>
  dispoUniquement: Set<string> | null // null = pas de restriction
  maxSlotIdx: number // 2 par défaut (pas de restriction)
  vendrediSlot1: boolean
}

function getTeamMeta(equipe: Equipe): TeamMeta {
  const meta: TeamMeta = {
    indispos: new Set(),
    dispoUniquement: null,
    maxSlotIdx: 2,
    vendrediSlot1: false,
  }
  for (const ind of INDISPOS) {
    if (matchTeam(equipe, ind.matcher)) {
      ind.dates.forEach((d) => meta.indispos.add(d))
    }
  }
  for (const du of DISPO_UNIQUEMENT) {
    if (matchTeam(equipe, du.matcher)) {
      meta.dispoUniquement = new Set(du.dates)
    }
  }
  for (const sm of SLOT_MAX) {
    if (matchTeam(equipe, sm.matcher)) {
      meta.maxSlotIdx = Math.min(meta.maxSlotIdx, sm.maxSlotIdx)
    }
  }
  for (const vs of VENDREDI_SLOT_1) {
    if (matchTeam(equipe, vs.matcher)) {
      meta.vendrediSlot1 = true
    }
  }
  return meta
}

function isSlotValidForTeam(meta: TeamMeta, jour: string, slotIdx: number): boolean {
  if (meta.indispos.has(jour)) return false
  if (meta.dispoUniquement && !meta.dispoUniquement.has(jour)) return false
  if (slotIdx > meta.maxSlotIdx) return false
  if (meta.vendrediSlot1 && estVendredi(jour) && slotIdx !== 0) return false
  return true
}

// Tri aléatoire (utile pour diversifier les générations)
function shuffleArray<T>(arr: T[]): T[] {
  const copy = [...arr]
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[copy[i], copy[j]] = [copy[j], copy[i]]
  }
  return copy
}

// Évalue la qualité d'un calendrier (plus bas = meilleur)
function evaluerCalendrier(assignments: Assignment[]): number {
  let cost = 0
  const slotsByDate = new Map<string, Set<string>>() // jour → set des heures utilisées
  assignments.forEach((a) => {
    if (!slotsByDate.has(a.jour)) slotsByDate.set(a.jour, new Set())
    slotsByDate.get(a.jour)!.add(a.heure)
    // Pénalité créneau 20:00
    if (a.heure === '20:00') cost += 10
  })
  Array.from(slotsByDate.entries()).forEach(([, slots]) => {
    const count = slots.size
    const has1830 = slots.has('18:30')
    // Pénalité soirée à 1 match (on veut éviter)
    if (count === 1) cost += 30
    // Pénalité soirée 3 matchs (on préfère 2)
    if (count === 3) cost += 8
    // Pénalité TRÈS forte si la soirée est utilisée mais pas le créneau 18:30
    if (!has1830) cost += 100
  })
  return cost
}

// Lance plusieurs tentatives et garde la meilleure
export function genererCalendrierOptimise(
  parties: Partie[],
  equipes: Equipe[],
  nbTentatives = 15
): { success: boolean; assignments: Assignment[]; error?: string; stats?: { tentatives: number; cost?: number } } {
  let best: { success: boolean; assignments: Assignment[]; error?: string; stats?: { tentatives: number } } | null = null
  let bestCost = Infinity
  let lastError: string | undefined
  for (let i = 0; i < nbTentatives; i++) {
    const res = genererCalendrier(parties, equipes)
    if (!res.success) {
      lastError = res.error
      continue
    }
    const cost = evaluerCalendrier(res.assignments)
    if (cost < bestCost) {
      bestCost = cost
      best = res
    }
  }
  if (!best) {
    return { success: false, assignments: [], error: lastError || 'Aucune solution trouvée' }
  }
  return { ...best, stats: { tentatives: best.stats?.tentatives || 0, cost: bestCost } }
}

export function genererCalendrier(
  parties: Partie[],
  equipes: Equipe[]
): { success: boolean; assignments: Assignment[]; error?: string; stats?: { tentatives: number } } {
  const equipesMap = new Map(equipes.map((e) => [e.id, e]))
  const dates = getDatesPossibles()

  // Pré-calculer les metadata par équipe
  const teamMetaMap = new Map<string, TeamMeta>()
  for (const eq of equipes) {
    teamMetaMap.set(eq.id, getTeamMeta(eq))
  }

  // Identifier les équipes du covoiturage
  const covoituragesData = COVOITURAGES.map((c) => {
    const eqs1 = equipes.filter((e) => matchTeam(e, c.team1))
    const eqs2 = equipes.filter((e) => matchTeam(e, c.team2))
    return {
      nom: c.nom,
      team1Ids: new Set(eqs1.map((e) => e.id)),
      team2Ids: new Set(eqs2.map((e) => e.id)),
    }
  })

  function matchInvolvesTeam(p: Partie, teamIds: Set<string>): boolean {
    return teamIds.has(p.equipe1_id) || teamIds.has(p.equipe2_id)
  }

  // Pré-calculer les candidats (jour, slot) pour chaque partie
  const candidatesMap = new Map<string, Candidate[]>()
  for (const partie of parties) {
    const eq1 = equipesMap.get(partie.equipe1_id)
    const eq2 = equipesMap.get(partie.equipe2_id)
    if (!eq1 || !eq2) {
      return { success: false, assignments: [], error: `Partie ${partie.id}: équipes introuvables` }
    }
    const meta1 = teamMetaMap.get(eq1.id)!
    const meta2 = teamMetaMap.get(eq2.id)!
    const cands: Candidate[] = []
    for (const jour of dates) {
      for (let slotIdx = 0; slotIdx < SLOTS.length; slotIdx++) {
        if (isSlotValidForTeam(meta1, jour, slotIdx) && isSlotValidForTeam(meta2, jour, slotIdx)) {
          cands.push({ jour, slotIdx })
        }
      }
    }
    if (cands.length === 0) {
      return {
        success: false,
        assignments: [],
        error: `Aucun créneau possible pour ${eq1.garcon} & ${eq1.fille} vs ${eq2.garcon} & ${eq2.fille}`,
      }
    }
    // Prioriser STRICTEMENT : slot 0 (18:30) > slot 1 (19:15) > slot 2 (20:00)
    // À l'intérieur d'un slot, on mélange les jours (pour diversifier et bien utiliser vendredis)
    const slot0 = cands.filter((c) => c.slotIdx === 0)
    const slot1 = cands.filter((c) => c.slotIdx === 1)
    const slot2 = cands.filter((c) => c.slotIdx === 2)
    candidatesMap.set(partie.id, [
      ...shuffleArray(slot0),
      ...shuffleArray(slot1),
      ...shuffleArray(slot2),
    ])
  }

  // Ordre de traitement : les plus contraints d'abord
  // Priorité : (1) matchs covoiturage team1 (LO), (2) team2 (GJ), (3) les + contraints par nb candidats
  const ordered = [...parties].sort((a, b) => {
    const aIsCov1 = covoituragesData.some((c) => matchInvolvesTeam(a, c.team1Ids))
    const bIsCov1 = covoituragesData.some((c) => matchInvolvesTeam(b, c.team1Ids))
    const aIsCov2 = covoituragesData.some((c) => matchInvolvesTeam(a, c.team2Ids))
    const bIsCov2 = covoituragesData.some((c) => matchInvolvesTeam(b, c.team2Ids))
    if (aIsCov1 && !bIsCov1) return -1
    if (!aIsCov1 && bIsCov1) return 1
    if (aIsCov2 && !bIsCov2) return -1
    if (!aIsCov2 && bIsCov2) return 1
    return candidatesMap.get(a.id)!.length - candidatesMap.get(b.id)!.length
  })

  // Backtracking
  const assignments = new Map<string, Candidate>()
  const usedSlots = new Set<string>() // "jour_slotIdx"
  const teamDay = new Set<string>() // "equipeId_jour"
  let tentatives = 0
  const MAX_TENTATIVES = 500000

  function tryAssign(idx: number): boolean {
    tentatives++
    if (tentatives > MAX_TENTATIVES) return false
    if (idx === ordered.length) return true

    const partie = ordered[idx]
    const isCov2 = covoituragesData.some((c) => matchInvolvesTeam(partie, c.team2Ids))

    // Calculer les jours déjà utilisés par les équipes team1 du covoiturage (LO)
    let cov1Dates: Set<string> | null = null
    if (isCov2) {
      cov1Dates = new Set()
      Array.from(assignments.entries()).forEach(([pid, cand]) => {
        const p = parties.find((pp) => pp.id === pid)!
        for (const cov of covoituragesData) {
          if (matchInvolvesTeam(p, cov.team1Ids)) {
            cov1Dates!.add(cand.jour)
          }
        }
      })
    }

    for (const cand of candidatesMap.get(partie.id)!) {
      // Contrainte covoiturage : team2 (GJ) doit jouer un soir où team1 (LO) joue aussi
      if (isCov2 && cov1Dates && cov1Dates.size > 0 && !cov1Dates.has(cand.jour)) continue

      const slotKey = `${cand.jour}_${cand.slotIdx}`
      if (usedSlots.has(slotKey)) continue

      const t1DayKey = `${partie.equipe1_id}_${cand.jour}`
      const t2DayKey = `${partie.equipe2_id}_${cand.jour}`
      if (teamDay.has(t1DayKey) || teamDay.has(t2DayKey)) continue

      // Affecter
      assignments.set(partie.id, cand)
      usedSlots.add(slotKey)
      teamDay.add(t1DayKey)
      teamDay.add(t2DayKey)

      if (tryAssign(idx + 1)) return true

      // Backtrack
      assignments.delete(partie.id)
      usedSlots.delete(slotKey)
      teamDay.delete(t1DayKey)
      teamDay.delete(t2DayKey)
    }
    return false
  }

  const success = tryAssign(0)

  if (!success) {
    return {
      success: false,
      assignments: [],
      error: `Impossible de générer un calendrier respectant toutes les contraintes (${tentatives} tentatives).`,
      stats: { tentatives },
    }
  }

  // Vérifier la contrainte covoiturage une dernière fois
  for (const cov of covoituragesData) {
    const t1Dates = new Set<string>()
    const t2Dates = new Set<string>()
    Array.from(assignments.entries()).forEach(([pid, cand]) => {
      const p = parties.find((pp) => pp.id === pid)!
      if (matchInvolvesTeam(p, cov.team1Ids)) t1Dates.add(cand.jour)
      if (matchInvolvesTeam(p, cov.team2Ids)) t2Dates.add(cand.jour)
    })
    const t2DatesArr = Array.from(t2Dates)
    for (const d of t2DatesArr) {
      if (!t1Dates.has(d)) {
        return {
          success: false,
          assignments: [],
          error: `Covoiturage ${cov.nom} non respecté : le ${d}, team2 joue mais pas team1.`,
          stats: { tentatives },
        }
      }
    }
  }

  const result: Assignment[] = []
  Array.from(assignments.entries()).forEach(([pid, cand]) => {
    result.push({
      partie_id: pid,
      jour: cand.jour,
      heure: SLOTS[cand.slotIdx],
    })
  })
  return { success: true, assignments: result, stats: { tentatives } }
}
