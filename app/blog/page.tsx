import { SiteHeader } from '@/components/marketing/SiteHeader';
import { SiteFooter } from '@/components/marketing/SiteFooter';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import Link from 'next/link';

const blogPosts = [
  {
    id: 1,
    title: 'Comment créer un devis BTP professionnel en 2 minutes',
    excerpt: 'Découvrez les meilleures pratiques pour créer des devis BTP rapidement tout en maintenant un niveau de professionnalisme élevé.',
    date: '15 janvier 2025',
    category: 'Guide',
  },
  {
    id: 2,
    title: 'L\'IA dans le BTP : révolution ou simple tendance ?',
    excerpt: 'Analyse approfondie de l\'impact de l\'intelligence artificielle sur le secteur du bâtiment et des travaux publics.',
    date: '10 janvier 2025',
    category: 'Tendances',
  },
  {
    id: 3,
    title: '5 erreurs à éviter lors de la création de devis',
    excerpt: 'Les pièges courants qui peuvent vous coûter des clients et comment les éviter facilement.',
    date: '5 janvier 2025',
    category: 'Conseils',
  },
];

export default function BlogPage() {
  return (
    <div className="min-h-screen bg-white">
      <SiteHeader />

      <main>
        <section className="pt-20 pb-12 bg-brand-light">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-6">
              Notre Blog
            </h1>
            <p className="text-xl text-gray-500 max-w-3xl mx-auto">
              Conseils, guides et actualites pour les professionnels du BTP
            </p>
          </div>
        </section>

        <section className="py-20 bg-white">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-5xl">
            <div className="grid md:grid-cols-2 gap-8">
              {blogPosts.map((post) => (
                <Card
                  key={post.id}
                  className="bg-white border-gray-200 hover:border-brand-green/30 hover:shadow-lg transition-all duration-300 hover:-translate-y-1"
                >
                  <CardHeader>
                    <div className="flex items-center gap-4 mb-4">
                      <span className="text-xs font-semibold text-brand-green uppercase tracking-wide">
                        {post.category}
                      </span>
                      <span className="text-xs text-gray-400">{post.date}</span>
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-3">
                        {post.title}
                    </h2>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-500 mb-4">{post.excerpt}</p>
                    <span className="inline-flex items-center text-gray-400 font-medium">
                      Bientot disponible
                    </span>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
