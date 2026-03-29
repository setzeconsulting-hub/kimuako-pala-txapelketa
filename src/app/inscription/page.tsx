'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase'

export default function InscriptionPage() {
  const [garcon, setGarcon] = useState('')
  const [fille, setFille] = useState('')
  const [email, setEmail] = useState('')
  const [serie, setSerie] = useState<'1ere' | '2eme'>('1ere')
  const [reglement, setReglement] = useState(false)
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!reglement) {
      setError('Vous devez accepter le règlement.')
      return
    }
    setLoading(true)
    setError('')

    const supabase = createClient()
    const { error: dbError } = await supabase.from('equipes').insert({
      garcon,
      fille,
      email,
      serie,
      statut: 'en_attente',
      paye: false,
    })

    setLoading(false)

    if (dbError) {
      setError('Erreur lors de l\'inscription. Veuillez réessayer.')
      return
    }

    setSuccess(true)
  }

  if (success) {
    return (
      <div className="max-w-lg mx-auto px-4 py-16 text-center">
        <div className="bg-green-50 border border-green-200 rounded-xl p-8">
          <div className="text-4xl mb-4">✅</div>
          <h2 className="text-2xl font-bold text-green-800 mb-2">Inscription envoyée !</h2>
          <p className="text-green-700">
            Votre inscription est en attente de validation par l&apos;organisation.
            Vous recevrez une confirmation par email.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-lg mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold text-gray-800 mb-8 text-center">
        Inscription au tournoi
      </h1>

      <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow p-6 space-y-5">
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">
            Joueur.se 1
          </label>
          <input
            type="text"
            required
            value={garcon}
            onChange={(e) => setGarcon(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-basque-red focus:border-transparent outline-none"
            placeholder="Prénom Nom"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">
            Joueur.se 2
          </label>
          <input
            type="text"
            required
            value={fille}
            onChange={(e) => setFille(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-basque-red focus:border-transparent outline-none"
            placeholder="Prénom Nom"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">
            Email de contact
          </label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-basque-red focus:border-transparent outline-none"
            placeholder="votre@email.com"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">
            Série souhaitée
          </label>
          <select
            value={serie}
            onChange={(e) => setSerie(e.target.value as '1ere' | '2eme')}
            className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-basque-red focus:border-transparent outline-none bg-white"
          >
            <option value="1ere">1ère série</option>
            <option value="2eme">2ème série</option>
          </select>
        </div>

        <div className="flex items-start gap-3">
          <input
            type="checkbox"
            id="reglement"
            checked={reglement}
            onChange={(e) => setReglement(e.target.checked)}
            className="mt-1 w-4 h-4 accent-basque-red"
          />
          <label htmlFor="reglement" className="text-sm text-gray-600">
            J&apos;accepte le{' '}
            <a
              href="/reglement.pdf"
              target="_blank"
              className="text-basque-red underline hover:text-basque-red-dark"
            >
              règlement
            </a>
            {' '}et m&apos;engage à respecter la bonne organisation du tournoi.
          </label>
        </div>

        {error && (
          <div className="bg-red-50 text-red-700 px-4 py-2 rounded-lg text-sm">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-basque-red text-white font-bold py-3 rounded-lg hover:bg-basque-red-dark transition disabled:opacity-50"
        >
          {loading ? 'Inscription en cours...' : 'S\'inscrire'}
        </button>
      </form>
    </div>
  )
}
