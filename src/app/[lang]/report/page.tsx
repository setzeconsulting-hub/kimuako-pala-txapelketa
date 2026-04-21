import { createServerSupabaseClient } from '@/lib/supabase-server'
import { Equipe, Partie, Poule } from '@/lib/types'
import { Lang } from '@/lib/dictionaries'
import ReportForm from './ReportForm'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

export default async function ReportPage({
  params,
  searchParams,
}: {
  params: { lang: Lang }
  searchParams: { partie?: string }
}) {
  const lang = params.lang === 'eu' ? 'eu' : 'fr'
  const partieId = searchParams.partie

  if (!partieId) {
    return (
      <div className="max-w-lg mx-auto px-4 py-12 text-center">
        <p className="text-red-600">Aucune partie spécifiée.</p>
        <Link href={`/${lang}/programme`} className="text-basque-red underline">
          Retour au programme
        </Link>
      </div>
    )
  }

  const supabase = await createServerSupabaseClient()
  const { data: partie } = await supabase.from('parties').select('*').eq('id', partieId).single()
  const { data: equipes } = await supabase.from('equipes').select('*')
  const { data: poules } = await supabase.from('poules').select('*')

  if (!partie) {
    return (
      <div className="max-w-lg mx-auto px-4 py-12 text-center">
        <p className="text-red-600">Partie introuvable.</p>
      </div>
    )
  }

  const equipesMap = new Map((equipes as Equipe[])?.map((e) => [e.id, e]) || [])
  const poulesMap = new Map((poules as Poule[])?.map((p) => [p.id, p]) || [])
  const eq1 = equipesMap.get(partie.equipe1_id)
  const eq2 = equipesMap.get(partie.equipe2_id)
  const poule = poulesMap.get(partie.poule_id)

  return (
    <div className="max-w-2xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold text-gray-800 mb-2">
        {lang === 'eu' ? 'Partidaren aldaketa eskatu' : 'Demander un report de partie'}
      </h1>
      <p className="text-gray-600 mb-6">
        {lang === 'eu'
          ? 'Partida bat ezin baduzu jokatu aurreikusitako egunean, beste ordutegi bat proposa dezakezu hemen. Antolaketak baieztatuko du.'
          : "Si vous ne pouvez pas jouer à la date prévue, vous pouvez proposer un nouveau créneau ci-dessous. L'organisation validera."}
      </p>

      {/* Partie concernée */}
      <div className="bg-white rounded-xl shadow p-5 mb-6">
        <p className="text-xs text-basque-red font-medium mb-1">{poule?.nom}</p>
        <p className="text-lg font-semibold text-gray-800">
          {eq1 ? `${eq1.garcon} & ${eq1.fille}` : '?'}
          <span className="text-gray-400 mx-2">vs</span>
          {eq2 ? `${eq2.garcon} & ${eq2.fille}` : '?'}
        </p>
        {partie.jour && partie.heure && (
          <p className="text-sm text-gray-600 mt-2">
            {lang === 'eu' ? 'Uneko data' : 'Date actuelle'} :{' '}
            <span className="font-medium">
              {new Date(partie.jour + 'T00:00:00').toLocaleDateString(
                lang === 'eu' ? 'eu' : 'fr-FR',
                { weekday: 'long', day: 'numeric', month: 'long' }
              )}{' '}
              à {partie.heure.substring(0, 5)}
            </span>
          </p>
        )}
      </div>

      <ReportForm partieId={partie.id} lang={lang} />

      <div className="mt-6 text-center">
        <Link href={`/${lang}/programme`} className="text-sm text-gray-500 underline">
          {lang === 'eu' ? 'Itzuli programara' : 'Retour au programme'}
        </Link>
      </div>
    </div>
  )
}
