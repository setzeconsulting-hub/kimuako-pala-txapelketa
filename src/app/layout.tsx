import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Kimuako Pala Txapelketa',
  description: 'Tournoi de pelote basque organisé par Kimua Angeluko Ikastola',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="eu">
      <body className="min-h-screen flex flex-col bg-gray-50">
        {children}
      </body>
    </html>
  )
}
