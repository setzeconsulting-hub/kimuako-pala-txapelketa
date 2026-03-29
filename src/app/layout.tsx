import type { Metadata } from 'next'
import './globals.css'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Kimuako Pala Txapelketa',
  description: 'Tournoi de pelote basque organisé par Kimua Angeluko Ikastola',
}

function Navbar() {
  return (
    <header className="bg-basque-red text-white shadow-lg">
      <nav className="max-w-6xl mx-auto px-4 py-3">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-2">
          <Link href="/" className="text-xl font-bold tracking-tight">
            Kimuako Pala Txapelketa
          </Link>
          <div className="flex gap-1 sm:gap-2 flex-wrap justify-center">
            <Link
              href="/"
              className="px-3 py-1.5 rounded hover:bg-basque-red-dark transition text-sm font-medium"
            >
              Accueil
            </Link>
            <Link
              href="/poules"
              className="px-3 py-1.5 rounded hover:bg-basque-red-dark transition text-sm font-medium"
            >
              Poules
            </Link>
            <Link
              href="/programme"
              className="px-3 py-1.5 rounded hover:bg-basque-red-dark transition text-sm font-medium"
            >
              Programme
            </Link>
            <Link
              href="/resultats"
              className="px-3 py-1.5 rounded hover:bg-basque-red-dark transition text-sm font-medium"
            >
              Résultats
            </Link>
          </div>
        </div>
      </nav>
    </header>
  )
}

function Footer() {
  return (
    <footer className="bg-basque-green text-white py-6 mt-auto">
      <div className="max-w-6xl mx-auto px-4 text-center text-sm">
        <p className="font-semibold">Kimua - Angeluko Ikastola</p>
        <p className="mt-1 opacity-80">Kimuako Pala Txapelketa</p>
      </div>
    </footer>
  )
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="eu">
      <body className="min-h-screen flex flex-col bg-gray-50">
        <Navbar />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  )
}
