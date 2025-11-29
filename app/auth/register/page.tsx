'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { FileText, ArrowLeft } from 'lucide-react';
import { supabase } from '@/lib/supabase';

export default function RegisterPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
      });

      if (error) throw error;
      router.push('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Une erreur est survenue');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-dark flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#1FBF7310_1px,transparent_1px),linear-gradient(to_bottom,#1FBF7310_1px,transparent_1px)] bg-[size:4rem_4rem]" />

      <div className="w-full max-w-md relative z-10">
        <Link href="/" className="inline-flex items-center gap-2 text-gray-400 hover:text-white mb-8 transition-colors">
          <ArrowLeft className="h-4 w-4" />
          Retour à l&apos;accueil
        </Link>

        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center justify-center gap-2 mb-4">
            <div className="p-2 rounded-lg bg-brand-green">
              <FileText className="h-8 w-8 text-white" />
            </div>
            <span className="text-3xl font-bold text-white">Devisia</span>
          </Link>
          <p className="text-gray-400">Commencez à créer des devis professionnels</p>
        </div>

        <Card className="bg-brand-darkCard border-gray-800 shadow-2xl">
          <CardHeader>
            <CardTitle className="text-2xl text-white">Créer un compte</CardTitle>
            <CardDescription className="text-gray-400">
              Gratuit, sans engagement. Commencez en 30 secondes.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleRegister} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-gray-300">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="vous@exemple.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="bg-brand-darkLight border-gray-700 text-white placeholder:text-gray-500 focus:border-brand-green focus:ring-brand-green"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-gray-300">Mot de passe</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                  className="bg-brand-darkLight border-gray-700 text-white placeholder:text-gray-500 focus:border-brand-green focus:ring-brand-green"
                />
                <p className="text-xs text-gray-500">Minimum 6 caractères</p>
              </div>

              {error && (
                <div className="bg-red-500/10 border border-red-500/50 text-red-400 p-3 rounded-md text-sm">
                  {error}
                </div>
              )}

              <Button
                type="submit"
                disabled={loading}
                className="w-full bg-brand-green hover:bg-green-600 text-white"
              >
                {loading ? 'Inscription...' : 'Créer mon compte'}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-sm text-gray-400">
                Déjà un compte ?{' '}
                <Link href="/auth/login" className="text-brand-green hover:text-green-400 font-medium transition-colors">
                  Se connecter
                </Link>
              </p>
            </div>

            <div className="mt-6 pt-6 border-t border-gray-800">
              <p className="text-xs text-gray-500 text-center">
                En créant un compte, vous acceptez nos{' '}
                <Link href="/terms" className="text-gray-400 hover:text-brand-green underline">
                  Conditions d&apos;utilisation
                </Link>{' '}
                et notre{' '}
                <Link href="/privacy" className="text-gray-400 hover:text-brand-green underline">
                  Politique de confidentialité
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
