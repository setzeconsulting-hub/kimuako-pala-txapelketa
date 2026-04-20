'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const router = useRouter()

  // Ne pas afficher la sidebar sur la page de login
  if (pathname === '/admin/login') {
    return <>{children}</>
  }

  const links = [
    { href: '/admin', label: 'Dashboard' },
    { href: '/admin/inscriptions', label: 'Inscriptions' },
    { href: '/admin/poules', label: 'Poules' },
    { href: '/admin/calendrier', label: 'Calendrier auto' },
    { href: '/admin/programme', label: 'Programme' },
    { href: '/admin/scores', label: 'Scores' },
  ]

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/admin/login')
    router.refresh()
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
      <div className="flex flex-col sm:flex-row gap-6">
        {/* Sidebar */}
        <nav className="sm:w-48 flex-shrink-0">
          <div className="bg-white rounded-xl shadow p-4 space-y-1">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider px-3 mb-2">
              Admin
            </p>
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`block px-3 py-2 rounded-lg text-sm font-medium transition ${
                  pathname === link.href
                    ? 'bg-basque-red text-white'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                {link.label}
              </Link>
            ))}
            <button
              onClick={handleLogout}
              className="w-full text-left px-3 py-2 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 transition mt-4"
            >
              Déconnexion
            </button>
          </div>
        </nav>

        {/* Content */}
        <div className="flex-1 min-w-0">{children}</div>
      </div>
    </div>
  )
}
