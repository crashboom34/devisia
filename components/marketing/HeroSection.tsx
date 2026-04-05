'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowRight, Download, Mic, FileText } from 'lucide-react';

export function HeroSection() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-brand-light to-white pt-16 pb-20 sm:pt-24 sm:pb-28">
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#1FBF7308_1px,transparent_1px),linear-gradient(to_bottom,#1FBF7308_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_80%_60%_at_50%_0%,#000_50%,transparent_110%)]" />

      <div className="container relative mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl text-center">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-brand-green/5 border border-brand-green/20 px-4 py-2 text-sm text-brand-green font-medium">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-brand-green opacity-75"></span>
              <span className="relative inline-flex h-2 w-2 rounded-full bg-brand-green"></span>
            </span>
            Essai gratuit 14 jours -- sans carte bancaire
          </div>

          <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl lg:text-6xl mb-6 animate-fade-in">
            Generez vos devis BTP
            <span className="text-brand-green"> en 2 minutes</span>
          </h1>

          <p className="text-lg sm:text-xl text-gray-600 mb-8 max-w-2xl mx-auto leading-relaxed opacity-0 animate-fade-in" style={{ animationDelay: '0.1s' }}>
            Decrivez votre chantier a la voix ou par ecrit. L&apos;IA cree un devis complet avec 3 scenarios de prix. Ajustez, exportez en PDF, envoyez.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center items-center opacity-0 animate-fade-in" style={{ animationDelay: '0.2s' }}>
            <Link href="/auth/register">
              <Button size="lg" className="bg-brand-green hover:bg-brand-greenDark text-white text-base px-8 py-6 h-auto shadow-lg shadow-brand-green/25 transition-all hover:shadow-xl hover:shadow-brand-green/30">
                Creer mon premier devis gratuit
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Link href="#comment-ca-marche">
              <Button size="lg" variant="outline" className="text-gray-700 border-gray-300 hover:bg-gray-50 text-base px-8 py-6 h-auto">
                Voir comment ca marche
              </Button>
            </Link>
          </div>

          <p className="text-sm text-gray-500 mt-4 opacity-0 animate-fade-in" style={{ animationDelay: '0.3s' }}>
            14 jours gratuits. Sans carte bancaire. Sans engagement.
          </p>
        </div>

        <div className="mt-16 max-w-5xl mx-auto opacity-0 animate-fade-in-up" style={{ animationDelay: '0.4s' }}>
          <div className="relative rounded-2xl border border-gray-200 bg-white shadow-2xl shadow-gray-200/50 overflow-hidden">
            <div className="flex items-center gap-2 px-4 py-3 border-b border-gray-100 bg-gray-50/80">
              <div className="flex gap-1.5">
                <div className="w-3 h-3 rounded-full bg-red-400" />
                <div className="w-3 h-3 rounded-full bg-amber-400" />
                <div className="w-3 h-3 rounded-full bg-green-400" />
              </div>
              <div className="flex-1 flex justify-center">
                <div className="px-4 py-1 rounded-md bg-white border border-gray-200 text-xs text-gray-400">
                  app.devisia.fr/dashboard
                </div>
              </div>
            </div>

            <div className="p-6 sm:p-8">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-4">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 rounded-lg bg-brand-green/10">
                      <FileText className="h-5 w-5 text-brand-green" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 text-sm">Renovation salle de bain -- M. Dupont</h3>
                      <p className="text-xs text-gray-500">Genere il y a 2 minutes</p>
                    </div>
                  </div>

                  <div className="rounded-xl border border-gray-100 overflow-hidden">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-gray-50 text-left">
                          <th className="px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Designation</th>
                          <th className="px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right hidden sm:table-cell">Qte</th>
                          <th className="px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right hidden sm:table-cell">PU HT</th>
                          <th className="px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">Total HT</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50">
                        <tr>
                          <td className="px-4 py-2.5 text-gray-700">Depose sanitaires existants</td>
                          <td className="px-4 py-2.5 text-gray-600 text-right hidden sm:table-cell">1</td>
                          <td className="px-4 py-2.5 text-gray-600 text-right hidden sm:table-cell">450,00</td>
                          <td className="px-4 py-2.5 text-gray-900 font-medium text-right">450,00</td>
                        </tr>
                        <tr>
                          <td className="px-4 py-2.5 text-gray-700">Fourniture + pose receveur douche</td>
                          <td className="px-4 py-2.5 text-gray-600 text-right hidden sm:table-cell">1</td>
                          <td className="px-4 py-2.5 text-gray-600 text-right hidden sm:table-cell">1 280,00</td>
                          <td className="px-4 py-2.5 text-gray-900 font-medium text-right">1 280,00</td>
                        </tr>
                        <tr>
                          <td className="px-4 py-2.5 text-gray-700">Faience murale (12 m2)</td>
                          <td className="px-4 py-2.5 text-gray-600 text-right hidden sm:table-cell">12</td>
                          <td className="px-4 py-2.5 text-gray-600 text-right hidden sm:table-cell">85,00</td>
                          <td className="px-4 py-2.5 text-gray-900 font-medium text-right">1 020,00</td>
                        </tr>
                        <tr>
                          <td className="px-4 py-2.5 text-gray-700">Plomberie (raccordements)</td>
                          <td className="px-4 py-2.5 text-gray-600 text-right hidden sm:table-cell">1</td>
                          <td className="px-4 py-2.5 text-gray-600 text-right hidden sm:table-cell">680,00</td>
                          <td className="px-4 py-2.5 text-gray-900 font-medium text-right">680,00</td>
                        </tr>
                      </tbody>
                      <tfoot>
                        <tr className="bg-brand-green/5">
                          <td colSpan={3} className="px-4 py-3 font-semibold text-gray-900 text-right hidden sm:table-cell">Total HT</td>
                          <td className="px-4 py-3 font-semibold text-gray-900 text-right sm:hidden">Total HT</td>
                          <td className="px-4 py-3 font-bold text-brand-green text-right text-base">3 430,00 &euro;</td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="rounded-xl border border-gray-100 p-4 bg-gray-50/50">
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">3 scenarios</p>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between p-2.5 rounded-lg bg-white border border-gray-100">
                        <span className="text-sm text-gray-600">Eco</span>
                        <span className="text-sm font-semibold text-gray-900">2 850 &euro;</span>
                      </div>
                      <div className="flex items-center justify-between p-2.5 rounded-lg bg-brand-green/5 border border-brand-green/20">
                        <span className="text-sm font-medium text-brand-green">Standard</span>
                        <span className="text-sm font-bold text-brand-green">3 430 &euro;</span>
                      </div>
                      <div className="flex items-center justify-between p-2.5 rounded-lg bg-white border border-gray-100">
                        <span className="text-sm text-gray-600">Premium</span>
                        <span className="text-sm font-semibold text-gray-900">4 120 &euro;</span>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-xl border border-gray-100 p-4 bg-gray-50/50">
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Actions rapides</p>
                    <div className="space-y-2">
                      <div className="w-full flex items-center gap-2 p-2.5 rounded-lg bg-brand-green text-white text-sm font-medium">
                        <Download className="h-4 w-4" />
                        Exporter PDF
                      </div>
                      <div className="w-full flex items-center gap-2 p-2.5 rounded-lg bg-white border border-gray-200 text-gray-700 text-sm font-medium">
                        <Mic className="h-4 w-4 text-brand-green" />
                        Dicter des modifications
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
