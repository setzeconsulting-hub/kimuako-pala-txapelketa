import Link from 'next/link'
import Image from 'next/image'

export default function HomePage() {
  return (
    <div>
      {/* Hero */}
      <section className="bg-gradient-to-br from-basque-red to-basque-red-dark text-white py-16 sm:py-24">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <Image
            src="/logo-kimua.png"
            alt="Logo Kimua - Angeluko Ikastola"
            width={150}
            height={150}
            className="mx-auto mb-6 rounded-full bg-white p-1 shadow-lg"
          />
          <h1 className="text-4xl sm:text-5xl font-bold mb-4">
            Kimuako Pala Txapelketa
          </h1>
          <p className="text-xl sm:text-2xl mb-2 opacity-90">
            Tournoi de Pala
          </p>
          <p className="text-lg opacity-80 mb-8">
            Organisé par Kimua - Angeluko Ikastola
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/inscription"
              className="bg-white text-basque-red font-bold px-8 py-3 rounded-lg hover:bg-gray-100 transition text-lg"
            >
              S&apos;inscrire
            </Link>
            <Link
              href="/programme"
              className="border-2 border-white text-white font-bold px-8 py-3 rounded-lg hover:bg-white/10 transition text-lg"
            >
              Voir le programme
            </Link>
            <a
              href="/reglement.pdf"
              target="_blank"
              className="border-2 border-white text-white font-bold px-8 py-3 rounded-lg hover:bg-white/10 transition text-lg"
            >
              Règlement
            </a>
          </div>
        </div>
      </section>

      {/* Infos */}
      <section className="max-w-4xl mx-auto px-4 py-12">
        <div className="grid sm:grid-cols-3 gap-6">
          <div className="bg-white rounded-xl shadow p-6 text-center">
            <div className="text-3xl mb-2">📅</div>
            <h3 className="font-bold text-lg text-gray-800">Date</h3>
            <p className="text-gray-600 mt-1">À venir</p>
          </div>
          <div className="bg-white rounded-xl shadow p-6 text-center">
            <div className="text-3xl mb-2">📍</div>
            <h3 className="font-bold text-lg text-gray-800">Lieu</h3>
            <p className="text-gray-600 mt-1">Fronton Jules Ferry</p>
          </div>
          <div className="bg-white rounded-xl shadow p-6 text-center">
            <div className="text-3xl mb-2">🏆</div>
            <h3 className="font-bold text-lg text-gray-800">Format</h3>
            <p className="text-gray-600 mt-1">Mixte - 2 séries</p>
          </div>
        </div>
      </section>

      {/* Règles rapides */}
      <section className="bg-white py-12">
        <div className="max-w-4xl mx-auto px-4">
          <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">
            Comment ça marche ?
          </h2>
          <div className="grid sm:grid-cols-2 gap-6">
            <div className="flex gap-4">
              <div className="bg-basque-green text-white rounded-full w-10 h-10 flex items-center justify-center font-bold flex-shrink-0">
                1
              </div>
              <div>
                <h3 className="font-semibold text-gray-800">Inscrivez votre équipe</h3>
                <p className="text-gray-600 text-sm mt-1">
                  Inscrivez votre équipe et choisissez votre série (1ère ou 2ème).
                </p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="bg-basque-green text-white rounded-full w-10 h-10 flex items-center justify-center font-bold flex-shrink-0">
                2
              </div>
              <div>
                <h3 className="font-semibold text-gray-800">Validation & paiement</h3>
                <p className="text-gray-600 text-sm mt-1">
                  L&apos;organisation valide votre inscription et vous confirme par email.
                </p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="bg-basque-green text-white rounded-full w-10 h-10 flex items-center justify-center font-bold flex-shrink-0">
                3
              </div>
              <div>
                <h3 className="font-semibold text-gray-800">Phase de poules</h3>
                <p className="text-gray-600 text-sm mt-1">
                  Les équipes sont réparties en poules. Chaque équipe affronte les autres de sa poule.
                </p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="bg-basque-green text-white rounded-full w-10 h-10 flex items-center justify-center font-bold flex-shrink-0">
                4
              </div>
              <div>
                <h3 className="font-semibold text-gray-800">Résultats en direct</h3>
                <p className="text-gray-600 text-sm mt-1">
                  Suivez les scores et classements en temps réel sur cette page.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
