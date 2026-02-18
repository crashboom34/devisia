'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { FileText, CheckCircle, AlertCircle } from 'lucide-react';
import { supabase } from '@/lib/supabase';

export default function ResetPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [sessionReady, setSessionReady] = useState(false);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') {
        setSessionReady(true);
      }
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        setSessionReady(true);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Les mots de passe ne correspondent pas.');
      return;
    }

    if (password.length < 6) {
      setError('Le mot de passe doit contenir au moins 6 caractères.');
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase.auth.updateUser({ password });

      if (error) throw error;
      setSuccess(true);
      setTimeout(() => router.push('/dashboard'), 3000);
    } catch (err: any) {
      setError(err.message || 'Une erreur est survenue');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-dark flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#1FBF7310_1px,transparent_1px),linear-gradient(to_bottom,#1FBF7310_1px,transparent_1px)] bg-[size:4rem_4rem]" />

      <div className="w-full max-w-md relative z-10">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center justify-center gap-2 mb-4">
            <div className="p-2 rounded-lg bg-brand-green">
              <FileText className="h-8 w-8 text-white" />
            </div>
            <span className="text-3xl font-bold text-white">Devisia</span>
          </Link>
        </div>

        <Card className="bg-brand-darkCard border-gray-800 shadow-2xl">
          <CardHeader>
            <CardTitle className="text-2xl text-white">
              {success ? 'Mot de passe modifié' : 'Nouveau mot de passe'}
            </CardTitle>
            <CardDescription className="text-gray-400">
              {success
                ? 'Redirection vers votre tableau de bord...'
                : 'Choisissez un nouveau mot de passe pour votre compte.'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {success ? (
              <div className="flex flex-col items-center gap-4 py-4">
                <div className="p-3 rounded-full bg-brand-green/20">
                  <CheckCircle className="h-8 w-8 text-brand-green" />
                </div>
                <p className="text-gray-300 text-sm text-center">
                  Votre mot de passe a été mis à jour avec succès.
                </p>
              </div>
            ) : !sessionReady ? (
              <div className="flex flex-col items-center gap-4 py-4">
                <div className="p-3 rounded-full bg-yellow-500/20">
                  <AlertCircle className="h-8 w-8 text-yellow-500" />
                </div>
                <div className="text-center space-y-2">
                  <p className="text-gray-300 text-sm">
                    Lien invalide ou expiré.
                  </p>
                  <p className="text-gray-500 text-xs">
                    Veuillez demander un nouveau lien de réinitialisation.
                  </p>
                </div>
                <Link href="/auth/forgot-password">
                  <Button className="bg-brand-green hover:bg-green-600 text-white">
                    Demander un nouveau lien
                  </Button>
                </Link>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="password" className="text-gray-300">Nouveau mot de passe</Label>
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

                <div className="space-y-2">
                  <Label htmlFor="confirm-password" className="text-gray-300">Confirmer le mot de passe</Label>
                  <Input
                    id="confirm-password"
                    type="password"
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    minLength={6}
                    className="bg-brand-darkLight border-gray-700 text-white placeholder:text-gray-500 focus:border-brand-green focus:ring-brand-green"
                  />
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
                  {loading ? 'Modification...' : 'Modifier le mot de passe'}
                </Button>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
