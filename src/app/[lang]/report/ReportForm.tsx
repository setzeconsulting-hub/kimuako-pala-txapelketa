'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase'

export default function ReportForm({ partieId, lang }: { partieId: string; lang: 'fr' | 'eu' }) {
  const [nouveauJour, setNouveauJour] = useState('')
  const [nouveauHeure, setNouveauHeure] = useState('')
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!email) return
    setSubmitting(true)
    setError('')
    const supabase = createClient()
    const { error: err } = await supabase.from('demandes_report').insert({
      partie_id: partieId,
      nouveau_jour: nouveauJour || null,
      nouveau_heure: nouveauHeure || null,
      email_demandeur: email,
      message: message || null,
      statut: 'en_attente',
    })
    setSubmitting(false)
    if (err) {
      setError(err.message)
      return
    }
    setSubmitted(true)
  }

  if (submitted) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-xl p-6 text-center">
        <p className="text-green-800 font-semibold mb-2">
          {lang === 'eu' ? '✅ Eskaera bidalia!' : '✅ Demande envoyée !'}
        </p>
        <p className="text-green-700 text-sm">
          {lang === 'eu'
            ? 'Antolaketak aztertuko du eta emailez erantzungo dizu.'
            : "L'organisation va examiner votre demande et vous répondra par email."}
        </p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow p-6 space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {lang === 'eu' ? 'Eskatutako data berria' : 'Date souhaitée'}
        </label>
        <input
          type="date"
          value={nouveauJour}
          onChange={(e) => setNouveauJour(e.target.value)}
          className="w-full border border-gray-300 rounded-lg px-3 py-2"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {lang === 'eu' ? 'Ordutegia' : 'Créneau souhaité'}
        </label>
        <select
          value={nouveauHeure}
          onChange={(e) => setNouveauHeure(e.target.value)}
          className="w-full border border-gray-300 rounded-lg px-3 py-2"
          required
        >
          <option value="">— {lang === 'eu' ? 'Aukeratu' : 'Choisir'} —</option>
          <option value="18:30">18:30</option>
          <option value="19:15">19:15</option>
          <option value="20:00">20:00</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {lang === 'eu' ? 'Zure emaila' : 'Votre email'} *
        </label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="vous@example.com"
          className="w-full border border-gray-300 rounded-lg px-3 py-2"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {lang === 'eu' ? 'Mezua (aukerakoa)' : 'Message (optionnel)'}
        </label>
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          rows={3}
          placeholder={
            lang === 'eu'
              ? 'Arrazoia, gaineratiko xehetasunak...'
              : 'Raison du report, précisions...'
          }
          className="w-full border border-gray-300 rounded-lg px-3 py-2"
        />
      </div>

      {error && <p className="text-red-600 text-sm">{error}</p>}

      <button
        type="submit"
        disabled={submitting}
        className="w-full bg-basque-red text-white font-bold px-6 py-2.5 rounded-lg hover:bg-basque-red-dark transition disabled:opacity-50"
      >
        {submitting
          ? lang === 'eu'
            ? 'Bidaltzen...'
            : 'Envoi en cours...'
          : lang === 'eu'
          ? 'Eskaera bidali'
          : 'Envoyer la demande'}
      </button>
    </form>
  )
}
