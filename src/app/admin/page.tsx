'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'

interface Stats {
  total: number
  validees: number
  payees: number
  enAttente: number
  partiesTotal: number
  partiesJouees: number
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats | null>(null)

  useEffect(() => {
    async function load() {
      const supabase = createClient()

      const { data: equipes } = await supabase.from('equipes').select('*')
      const { data: parties } = await supabase.from('parties').select('*')

      const eq = equipes || []
      const pa = parties || []

      setStats({
        total: eq.length,
        validees: eq.filter((e) => e.statut === 'validee').length,
        payees: eq.filter((e) => e.paye).length,
        enAttente: eq.filter((e) => e.statut === 'en_attente').length,
        partiesTotal: pa.length,
        partiesJouees: pa.filter((p) => p.jouee).length,
      })
    }
    load()
  }, [])

  if (!stats) {
    return <p className="text-gray-500">Chargement...</p>
  }

  const cards = [
    { label: 'Équipes inscrites', value: stats.total, color: 'bg-blue-500' },
    { label: 'En attente', value: stats.enAttente, color: 'bg-yellow-500' },
    { label: 'Validées', value: stats.validees, color: 'bg-green-500' },
    { label: 'Payées', value: stats.payees, color: 'bg-basque-green' },
    { label: 'Parties totales', value: stats.partiesTotal, color: 'bg-basque-red' },
    { label: 'Parties jouées', value: stats.partiesJouees, color: 'bg-purple-500' },
  ]

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Tableau de bord</h1>
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        {cards.map((card) => (
          <div key={card.label} className="bg-white rounded-xl shadow p-5">
            <p className="text-sm text-gray-500">{card.label}</p>
            <p className={`text-3xl font-bold mt-1 text-gray-800`}>{card.value}</p>
            <div className={`h-1 ${card.color} rounded mt-3`} />
          </div>
        ))}
      </div>
    </div>
  )
}
