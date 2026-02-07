'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { FileText, ArrowLeft, Mail, CheckCircle } from 'lucide-react';
import { supabase } from '@/lib/supabase';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/reset-password`,
      });

      if (error) throw error;
      setSent(true);
    } catch (err: any) {
      if (err.message === 'Failed to fetch') {
        setError('Impossible de se connecter au serveur. Vérifiez votre connexion internet.');
      } else {
        setError(err.message || 'Une erreur est survenue');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-dark flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#1FBF7310_1px,transparent_1px),linear-gradient(to_bottom,#1FBF7310_1px,transparent_1px)] bg-[size:4rem_4rem]" />

      <div className="w-full max-w-md relative z-10">
        <Link href="/auth/login" className="inline-flex items-center gap-2 text-gray-400 hover:text-white mb-8 transition-colors">
          <ArrowLeft className="h-4 w-4" />
          Retour à la connexion
        </Link>

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
              {sent ? 'Email envoyé' : 'Mot de passe oublié'}
            </CardTitle>
            <CardDescription className="text-gray-400">
              {sent
                ? 'Vérifiez votre boîte de réception pour réinitialiser votre mot de passe.'
                : 'Entrez votre adresse email pour recevoir un lien de réinitialisation.'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {sent ? (
              <div className="space-y-6">
                <div className="flex flex-col items-center gap-4 py-4">
                  <div className="p-3 rounded-full bg-brand-green/20">
                    <CheckCircle className="h-8 w-8 text-brand-green" />
                  </div>
                  <div className="text-center space-y-2">
                    <p className="text-gray-300 text-sm">
                      Un email a été envoyé à <span className="text-white font-medium">{email}</span>
                    </p>
                    <p className="text-gray-500 text-xs">
                      Si un compte existe avec cette adresse, vous recevrez un lien de réinitialisation.
                      Pensez à vérifier vos spams.
                    </p>
                  </div>
                </div>
                <Button
                  onClick={() => { setSent(false); setEmail(''); }}
                  variant="outline"
                  className="w-full border-gray-700 text-gray-300 hover:bg-gray-800 hover:text-white"
                >
                  <Mail className="h-4 w-4 mr-2" />
                  Renvoyer avec une autre adresse
                </Button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
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
                  {loading ? 'Envoi en cours...' : 'Envoyer le lien de réinitialisation'}
                </Button>
              </form>
            )}

            <div className="mt-6 text-center">
              <p className="text-sm text-gray-400">
                Vous vous souvenez ?{' '}
                <Link href="/auth/login" className="text-brand-green hover:text-green-400 font-medium transition-colors">
                  Se connecter
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
