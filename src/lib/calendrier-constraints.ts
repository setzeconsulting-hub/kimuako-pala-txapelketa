// Contraintes du calendrier du tournoi
// À éditer ici pour changer les règles

export const DATE_DEBUT = '2026-04-27'
export const DATE_FIN = '2026-06-26'

// Formatage de date en local (évite les bugs de fuseau horaire)
function toLocalDateString(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${dd}`
}

// Fronton fermé (inclus) du 28/05 au 10/06
function dateRangeArray(start: string, end: string): string[] {
  const dates: string[] = []
  const d = new Date(start + 'T00:00:00')
  const endD = new Date(end + 'T00:00:00')
  while (d <= endD) {
    dates.push(toLocalDateString(d))
    d.setDate(d.getDate() + 1)
  }
  return dates
}

export const FRONTON_FERME = dateRangeArray('2026-05-28', '2026-06-10')

// Jours fériés
export const FERIES = [
  '2026-05-01', // Fête du travail
  '2026-05-08', // Victoire 1945
  '2026-05-14', // Ascension
  '2026-05-25', // Lundi de Pentecôte
]

// Créneaux horaires
export const SLOTS = ['18:30', '19:15', '20:00']

export interface TeamMatcher {
  garcon?: string
  fille?: string
}

// Matche si l'équipe contient ces noms (case-insensitive, dans garcon ou fille)
export function matchTeam(equipe: { garcon: string; fille: string }, matcher: TeamMatcher): boolean {
  const g = equipe.garcon.toLowerCase()
  const f = equipe.fille.toLowerCase()
  const textG = g + ' ' + f
  const checkG = matcher.garcon ? textG.includes(matcher.garcon.toLowerCase()) : true
  const checkF = matcher.fille ? textG.includes(matcher.fille.toLowerCase()) : true
  return checkG && checkF
}

// Équipes avec indispos strictes (dates où elles NE PEUVENT PAS jouer)
export const INDISPOS: Array<{
  matcher: TeamMatcher
  dates: string[]
  nom: string
}> = [
  {
    nom: 'Lur & Oihana',
    matcher: { garcon: 'Lur', fille: 'Oihana' },
    dates: ['2026-04-28', '2026-04-29', '2026-05-14', '2026-05-21'],
  },
  {
    nom: 'Garazi aizpurua & Jon',
    matcher: { garcon: 'Garazi aizpurua', fille: 'Jon' },
    dates: ['2026-04-28', '2026-05-14', '2026-05-21'],
  },
  {
    nom: 'Xabi Etxegarai & Garazi Almandoz',
    matcher: { garcon: 'Xabi Etxegarai', fille: 'Garazi Almandoz' },
    dates: ['2026-04-28', '2026-05-14', '2026-05-21'],
  },
  {
    nom: 'Julie Etchecopar & Christian Mendiboure',
    matcher: { garcon: 'Julie ETCHECOPAR' },
    dates: [
      '2026-04-28', '2026-04-30',
      '2026-05-05', '2026-05-06', '2026-05-07',
      '2026-05-21', '2026-05-22',
      '2026-06-18', '2026-06-19',
    ],
  },
  {
    nom: 'Margaita Luro & Freddy Lajusticia',
    matcher: { garcon: 'Margaita Luro' },
    dates: ['2026-04-28', '2026-04-30'],
  },
]

// Équipes avec disponibilité RESTREINTE à certaines dates uniquement
export const DISPO_UNIQUEMENT: Array<{
  matcher: TeamMatcher
  dates: string[]
  nom: string
}> = [
  {
    nom: 'Ben & Coralie Pinatel',
    matcher: { fille: 'Coralie Pinatel' },
    dates: [
      '2026-04-28', '2026-05-05', '2026-05-07', '2026-05-12', '2026-05-19',
      '2026-06-16', '2026-06-18', '2026-06-23', '2026-06-25', '2026-06-26',
    ],
  },
  {
    nom: 'Julien & Marie Noussitou',
    matcher: { fille: 'Marie Noussitou' },
    dates: [
      '2026-04-28', '2026-04-29',
      '2026-05-04', '2026-05-05', '2026-05-11', '2026-05-12', '2026-05-13', '2026-05-18',
      '2026-06-11', '2026-06-12', '2026-06-16',
      '2026-06-23', '2026-06-24', '2026-06-25',
    ],
  },
]

// Équipes qui DOIVENT jouer en slot 1 (18:30) ou 2 (19:15) max
export const SLOT_MAX: Array<{
  matcher: TeamMatcher
  maxSlotIdx: number
  nom: string
}> = [
  { nom: 'Lur & Oihana', matcher: { garcon: 'Lur', fille: 'Oihana' }, maxSlotIdx: 1 },
  { nom: 'Garazi & Jon', matcher: { garcon: 'Garazi aizpurua', fille: 'Jon' }, maxSlotIdx: 1 },
  { nom: 'Xabi & Garazi Alm.', matcher: { garcon: 'Xabi Etxegarai', fille: 'Garazi Almandoz' }, maxSlotIdx: 1 },
  { nom: 'Amaia & Garai', matcher: { garcon: 'Amaia', fille: 'Garai' }, maxSlotIdx: 1 },
]

// Covoiturage : ces 2 équipes doivent jouer les MÊMES SOIRS
// GJ (3 matchs) doit être sur un sous-ensemble des soirs où LO joue (4 matchs)
export const COVOITURAGES: Array<{
  team1: TeamMatcher
  team2: TeamMatcher
  nom: string
}> = [
  {
    nom: 'Lur/Oihana ↔ Garazi/Jon',
    team1: { garcon: 'Lur', fille: 'Oihana' },
    team2: { garcon: 'Garazi aizpurua', fille: 'Jon' },
  },
]

// Équipes qui, si elles jouent un vendredi, DOIVENT être en slot 1 (18:30)
export const VENDREDI_SLOT_1: Array<{
  matcher: TeamMatcher
  nom: string
}> = [
  { nom: 'Julie Etchecopar', matcher: { garcon: 'Julie ETCHECOPAR' } },
  { nom: 'Lur & Oihana', matcher: { garcon: 'Lur', fille: 'Oihana' } },
]

// Obtenir la liste des dates possibles (lun-ven, hors fronton fermé, hors fériés)
export function getDatesPossibles(): string[] {
  const dates: string[] = []
  const d = new Date(DATE_DEBUT + 'T00:00:00')
  const endD = new Date(DATE_FIN + 'T00:00:00')
  while (d <= endD) {
    const dayOfWeek = d.getDay() // 0=dim, 6=sam
    const dateStr = toLocalDateString(d)
    if (dayOfWeek >= 1 && dayOfWeek <= 5 && !FRONTON_FERME.includes(dateStr) && !FERIES.includes(dateStr)) {
      dates.push(dateStr)
    }
    d.setDate(d.getDate() + 1)
  }
  return dates
}

// Est-ce un vendredi ?
export function estVendredi(dateStr: string): boolean {
  const d = new Date(dateStr + 'T00:00:00')
  return d.getDay() === 5
}
