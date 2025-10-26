import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Mic, FileText, Zap, DollarSign, Clock, CheckCircle } from 'lucide-react';

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <FileText className="h-8 w-8 text-blue-600" />
            <span className="text-2xl font-bold text-gray-900">Aide Devis IA</span>
          </div>
          <nav className="flex gap-4 items-center">
            <Link href="#fonctionnalites" className="text-gray-600 hover:text-blue-600 transition-colors">
              Fonctionnalités
            </Link>
            <Link href="#tarifs" className="text-gray-600 hover:text-blue-600 transition-colors">
              Tarifs
            </Link>
            <Link href="/auth/login">
              <Button variant="ghost">Connexion</Button>
            </Link>
            <Link href="/auth/register">
              <Button>Commencer</Button>
            </Link>
          </nav>
        </div>
      </header>

      <main>
        <section className="container mx-auto px-4 py-20 text-center">
          <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6">
            Créez vos devis de chantier
            <br />
            <span className="text-blue-600">en quelques minutes</span>
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            Décrivez votre projet à la voix ou par écrit. Notre IA génère automatiquement un devis détaillé
            avec plusieurs scénarios tarifaires.
          </p>
          <div className="flex gap-4 justify-center">
            <Link href="/auth/register">
              <Button size="lg" className="text-lg px-8 py-6">
                Essayer gratuitement
              </Button>
            </Link>
            <Link href="#fonctionnalites">
              <Button size="lg" variant="outline" className="text-lg px-8 py-6">
                En savoir plus
              </Button>
            </Link>
          </div>
        </section>

        <section id="fonctionnalites" className="bg-white py-20">
          <div className="container mx-auto px-4">
            <h2 className="text-4xl font-bold text-center mb-12 text-gray-900">
              Comment ça marche ?
            </h2>
            <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
              <Card className="border-2 hover:border-blue-500 transition-all">
                <CardHeader>
                  <Mic className="h-12 w-12 text-blue-600 mb-4" />
                  <CardTitle>1. Décrivez votre projet</CardTitle>
                  <CardDescription>
                    Utilisez votre voix ou tapez pour décrire le chantier, les travaux nécessaires et vos contraintes.
                  </CardDescription>
                </CardHeader>
              </Card>

              <Card className="border-2 hover:border-blue-500 transition-all">
                <CardHeader>
                  <Zap className="h-12 w-12 text-blue-600 mb-4" />
                  <CardTitle>2. L'IA analyse</CardTitle>
                  <CardDescription>
                    Notre intelligence artificielle analyse votre demande et structure automatiquement tous les postes de travaux.
                  </CardDescription>
                </CardHeader>
              </Card>

              <Card className="border-2 hover:border-blue-500 transition-all">
                <CardHeader>
                  <FileText className="h-12 w-12 text-blue-600 mb-4" />
                  <CardTitle>3. Recevez vos devis</CardTitle>
                  <CardDescription>
                    Obtenez 3 scénarios (Éco, Standard, Premium) avec détails complets et export PDF instantané.
                  </CardDescription>
                </CardHeader>
              </Card>
            </div>
          </div>
        </section>

        <section className="py-20 bg-blue-50">
          <div className="container mx-auto px-4">
            <h2 className="text-4xl font-bold text-center mb-12 text-gray-900">
              Pourquoi choisir Aide Devis IA ?
            </h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
              <div className="flex gap-4">
                <Clock className="h-8 w-8 text-blue-600 flex-shrink-0" />
                <div>
                  <h3 className="font-semibold text-lg mb-2">Gain de temps</h3>
                  <p className="text-gray-600">
                    Plus besoin de passer des heures sur Excel. Générez un devis en 5 minutes.
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <DollarSign className="h-8 w-8 text-blue-600 flex-shrink-0" />
                <div>
                  <h3 className="font-semibold text-lg mb-2">Plusieurs scénarios</h3>
                  <p className="text-gray-600">
                    Proposez 3 niveaux de prestation à vos clients pour maximiser vos chances.
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <CheckCircle className="h-8 w-8 text-blue-600 flex-shrink-0" />
                <div>
                  <h3 className="font-semibold text-lg mb-2">Professionnel</h3>
                  <p className="text-gray-600">
                    Des devis détaillés et structurés qui inspirent confiance à vos clients.
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <Mic className="h-8 w-8 text-blue-600 flex-shrink-0" />
                <div>
                  <h3 className="font-semibold text-lg mb-2">Dictée vocale</h3>
                  <p className="text-gray-600">
                    Décrivez votre projet à la voix, même sur chantier, l'IA s'occupe du reste.
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <FileText className="h-8 w-8 text-blue-600 flex-shrink-0" />
                <div>
                  <h3 className="font-semibold text-lg mb-2">Export PDF</h3>
                  <p className="text-gray-600">
                    Téléchargez vos devis au format PDF prêts à envoyer à vos clients.
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <Zap className="h-8 w-8 text-blue-600 flex-shrink-0" />
                <div>
                  <h3 className="font-semibold text-lg mb-2">IA avancée</h3>
                  <p className="text-gray-600">
                    Utilisez GPT-4 ou Claude pour des estimations précises et réalistes.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="tarifs" className="py-20 bg-white">
          <div className="container mx-auto px-4">
            <h2 className="text-4xl font-bold text-center mb-4 text-gray-900">
              Tarification simple
            </h2>
            <p className="text-center text-gray-600 mb-12">
              Utilisez votre propre clé API OpenAI ou Anthropic
            </p>
            <Card className="max-w-md mx-auto border-2 border-blue-500">
              <CardHeader className="text-center">
                <CardTitle className="text-3xl">Gratuit</CardTitle>
                <CardDescription className="text-lg">
                  Apportez votre clé API
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  <li className="flex gap-2">
                    <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                    <span>Devis illimités</span>
                  </li>
                  <li className="flex gap-2">
                    <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                    <span>Dictée vocale</span>
                  </li>
                  <li className="flex gap-2">
                    <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                    <span>3 scénarios par projet</span>
                  </li>
                  <li className="flex gap-2">
                    <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                    <span>Export PDF</span>
                  </li>
                  <li className="flex gap-2">
                    <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                    <span>Historique des projets</span>
                  </li>
                </ul>
                <Link href="/auth/register" className="block mt-6">
                  <Button className="w-full" size="lg">
                    Commencer maintenant
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </section>

        <section className="py-20 bg-blue-600 text-white">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-4xl font-bold mb-6">
              Prêt à gagner du temps sur vos devis ?
            </h2>
            <p className="text-xl mb-8 max-w-2xl mx-auto opacity-90">
              Rejoignez les professionnels du bâtiment qui utilisent l'IA pour créer leurs devis plus rapidement.
            </p>
            <Link href="/auth/register">
              <Button size="lg" variant="secondary" className="text-lg px-8 py-6">
                Créer mon compte gratuitement
              </Button>
            </Link>
          </div>
        </section>
      </main>

      <footer className="bg-gray-900 text-gray-400 py-12">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-2">
              <FileText className="h-6 w-6 text-blue-400" />
              <span className="text-lg font-semibold text-white">Aide Devis IA</span>
            </div>
            <div className="flex gap-6">
              <Link href="#" className="hover:text-white transition-colors">
                Mentions légales
              </Link>
              <Link href="#" className="hover:text-white transition-colors">
                CGU
              </Link>
              <Link href="#" className="hover:text-white transition-colors">
                Contact
              </Link>
            </div>
          </div>
          <div className="text-center mt-8 text-sm">
            © 2025 Aide Devis IA. Tous droits réservés.
          </div>
        </div>
      </footer>
    </div>
  );
}
