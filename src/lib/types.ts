export type Serie = '1ere' | '2eme'
export type StatutEquipe = 'en_attente' | 'validee' | 'refusee'

export interface Equipe {
  id: string
  garcon: string
  fille: string
  email: string
  serie: Serie
  statut: StatutEquipe
  paye: boolean
  created_at: string
}

export interface Poule {
  id: string
  nom: string
  serie: Serie
  created_at: string
}

export interface EquipePoule {
  id: string
  equipe_id: string
  poule_id: string
}

export interface Partie {
  id: string
  poule_id: string
  equipe1_id: string
  equipe2_id: string
  score1: number | null
  score2: number | null
  jour: string | null
  heure: string | null
  terrain: string | null
  jouee: boolean
  publie: boolean
  created_at: string
}

export type StatutDemande = 'en_attente' | 'validee' | 'refusee'

export interface DemandeReport {
  id: string
  partie_id: string
  nouveau_jour: string | null
  nouveau_heure: string | null
  email_demandeur: string
  message: string | null
  statut: StatutDemande
  created_at: string
}

export interface ClassementEquipe {
  equipe: Equipe
  points: number
  victoires: number
  defaites: number
  nuls: number
  pointsMarques: number
  pointsEncaisses: number
  diff: number
  joues: number
  ratio: number
}
