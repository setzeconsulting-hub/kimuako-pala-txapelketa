'use client'

import { useState } from 'react'
import { useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { Lang, getDictionary } from '@/lib/dictionaries'

export default function InscriptionPage() {
  const params = useParams()
  const lang = (params.lang === 'eu' ? 'eu' : 'fr') as Lang
  const t = getDictionary(lang)

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
      setError(t.inscription.errorRules)
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
      setError(t.inscription.errorGeneric)
      return
    }

    setSuccess(true)
  }

  if (success) {
    return (
      <div className="max-w-lg mx-auto px-4 py-16 text-center">
        <div className="bg-green-50 border border-green-200 rounded-xl p-8">
          <div className="text-4xl mb-4">✅</div>
          <h2 className="text-2xl font-bold text-green-800 mb-2">{t.inscription.successTitle}</h2>
          <p className="text-green-700">{t.inscription.successMsg}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-lg mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold text-gray-800 mb-8 text-center">
        {t.inscription.title}
      </h1>

      <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow p-6 space-y-5">
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">
            {t.inscription.player1}
          </label>
          <input
            type="text"
            required
            value={garcon}
            onChange={(e) => setGarcon(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-basque-red focus:border-transparent outline-none"
            placeholder={t.inscription.placeholder}
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">
            {t.inscription.player2}
          </label>
          <input
            type="text"
            required
            value={fille}
            onChange={(e) => setFille(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-basque-red focus:border-transparent outline-none"
            placeholder={t.inscription.placeholder}
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">
            {t.inscription.email}
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
            {t.inscription.serie}
          </label>
          <select
            value={serie}
            onChange={(e) => setSerie(e.target.value as '1ere' | '2eme')}
            className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-basque-red focus:border-transparent outline-none bg-white"
          >
            <option value="1ere">{t.inscription.serie1}</option>
            <option value="2eme">{t.inscription.serie2}</option>
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
            {t.inscription.rules.split(t.inscription.rulesLink)[0]}
            <a
              href="/reglement.pdf"
              target="_blank"
              className="text-basque-red underline hover:text-basque-red-dark"
            >
              {t.inscription.rulesLink}
            </a>
            {t.inscription.rules.split(t.inscription.rulesLink)[1]}
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
          {loading ? t.inscription.submitting : t.inscription.submit}
        </button>
      </form>
    </div>
  )
}
