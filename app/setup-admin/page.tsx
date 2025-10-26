'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { FileText, Copy, CheckCircle, AlertCircle } from 'lucide-react';
import { supabase } from '@/lib/supabase';

export default function SetupAdminPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [copied, setCopied] = useState(false);
  const [checking, setChecking] = useState(true);
  const [promoting, setPromoting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    checkUser();
  }, []);

  const checkUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      setChecking(false);
      return;
    }

    setUser(user);

    const { data: adminData } = await supabase
      .from('admin_users')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (adminData) {
      setIsAdmin(true);
    }

    setChecking(false);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const promoteToAdmin = async () => {
    if (!user) return;

    setPromoting(true);
    setError('');
    setSuccess('');

    try {
      const { error: insertError } = await supabase
        .from('admin_users')
        .insert({
          user_id: user.id,
          role: 'super_admin',
          permissions: { full_access: true },
        });

      if (insertError) {
        if (insertError.code === '23505') {
          setError('Vous êtes déjà administrateur !');
        } else {
          throw insertError;
        }
      } else {
        setSuccess('Félicitations ! Vous êtes maintenant super admin.');
        setTimeout(() => {
          window.location.reload();
        }, 1500);
      }
    } catch (err: any) {
      setError(err.message || 'Une erreur est survenue');
    } finally {
      setPromoting(false);
    }
  };

  const sqlCommand = user
    ? `INSERT INTO admin_users (user_id, role, permissions)
VALUES (
  '${user.id}',
  'super_admin',
  '{"full_access": true}'::jsonb
);`
    : `-- Connectez-vous d'abord pour voir votre commande SQL personnalisée`;

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Vérification...</p>
      </div>
    );
  }

  if (isAdmin) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center p-4">
        <Card className="max-w-2xl w-full">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <CheckCircle className="h-16 w-16 text-green-600" />
            </div>
            <CardTitle className="text-2xl">Vous êtes administrateur !</CardTitle>
            <CardDescription>
              Votre compte a déjà les privilèges administrateur
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert className="bg-green-50 border-green-200">
              <AlertCircle className="h-4 w-4 text-green-600" />
              <AlertDescription>
                Email : <strong>{user?.email}</strong>
                <br />
                Vous pouvez maintenant accéder au dashboard administrateur
              </AlertDescription>
            </Alert>

            <div className="flex gap-3">
              <Button onClick={() => router.push('/admin')} className="flex-1">
                Aller au Dashboard Admin
              </Button>
              <Button onClick={() => router.push('/dashboard')} variant="outline" className="flex-1">
                Dashboard Utilisateur
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-gray-100 p-4">
      <div className="container mx-auto max-w-4xl py-8">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-4">
            <FileText className="h-12 w-12 text-blue-600" />
            <span className="text-3xl font-bold text-gray-900">Configuration Admin</span>
          </div>
          <p className="text-gray-600">
            Créez votre premier compte administrateur pour accéder au dashboard
          </p>
        </div>

        <div className="space-y-6">
          {!user ? (
            <Card className="border-yellow-300 bg-yellow-50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertCircle className="h-5 w-5 text-yellow-600" />
                  Étape 1 : Créer un compte
                </CardTitle>
                <CardDescription>
                  Vous devez d'abord créer un compte utilisateur
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <p className="text-sm text-gray-700">
                    1. Créez un compte sur la page d'inscription
                  </p>
                  <p className="text-sm text-gray-700">
                    2. Revenez sur cette page après vous être connecté
                  </p>
                  <div className="flex gap-3 mt-4">
                    <Button onClick={() => router.push('/auth/register')} className="flex-1">
                      Créer un compte
                    </Button>
                    <Button onClick={() => router.push('/auth/login')} variant="outline" className="flex-1">
                      Se connecter
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : (
            <>
              <Card className="border-green-300 bg-green-50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    Compte créé !
                  </CardTitle>
                  <CardDescription>
                    Email : <strong>{user.email}</strong>
                  </CardDescription>
                </CardHeader>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Étape 2 : Promouvoir en administrateur</CardTitle>
                  <CardDescription>
                    Exécutez cette commande SQL dans votre console Supabase
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <p className="text-sm font-medium">Commande SQL</p>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => copyToClipboard(sqlCommand)}
                      >
                        {copied ? (
                          <>
                            <CheckCircle className="h-4 w-4 mr-2" />
                            Copié !
                          </>
                        ) : (
                          <>
                            <Copy className="h-4 w-4 mr-2" />
                            Copier
                          </>
                        )}
                      </Button>
                    </div>
                    <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto text-sm">
                      <code>{sqlCommand}</code>
                    </pre>
                  </div>

                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      <strong>Comment exécuter cette commande :</strong>
                      <ol className="mt-2 space-y-1 text-sm ml-4 list-decimal">
                        <li>Allez sur <a href="https://supabase.com/dashboard" target="_blank" className="text-blue-600 hover:underline">supabase.com/dashboard</a></li>
                        <li>Sélectionnez votre projet</li>
                        <li>Cliquez sur "SQL Editor" dans le menu de gauche</li>
                        <li>Collez la commande ci-dessus</li>
                        <li>Cliquez sur "Run"</li>
                        <li>Rafraîchissez cette page</li>
                      </ol>
                    </AlertDescription>
                  </Alert>

                  <div className="space-y-3">
                    <Button onClick={() => window.location.reload()} className="w-full" variant="outline">
                      Rafraîchir la page après avoir exécuté la commande
                    </Button>

                    <div className="relative">
                      <div className="absolute inset-0 flex items-center">
                        <span className="w-full border-t" />
                      </div>
                      <div className="relative flex justify-center text-xs uppercase">
                        <span className="bg-white px-2 text-gray-500">OU</span>
                      </div>
                    </div>

                    <Button
                      onClick={promoteToAdmin}
                      className="w-full bg-green-600 hover:bg-green-700"
                      disabled={promoting}
                    >
                      {promoting ? 'Promotion en cours...' : '✨ Devenir Super Admin Automatiquement'}
                    </Button>

                    {error && (
                      <Alert className="bg-red-50 border-red-200">
                        <AlertCircle className="h-4 w-4 text-red-600" />
                        <AlertDescription className="text-red-600">
                          {error}
                        </AlertDescription>
                      </Alert>
                    )}

                    {success && (
                      <Alert className="bg-green-50 border-green-200">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        <AlertDescription className="text-green-600">
                          {success}
                        </AlertDescription>
                      </Alert>
                    )}

                    <Alert className="bg-blue-50 border-blue-200">
                      <AlertCircle className="h-4 w-4 text-blue-600" />
                      <AlertDescription className="text-sm">
                        <strong>🎯 Méthode recommandée :</strong> Utilisez le bouton ci-dessus pour devenir super admin en un clic, sans avoir besoin d'aller sur Supabase Dashboard.
                      </AlertDescription>
                    </Alert>
                  </div>
                </CardContent>
              </Card>
            </>
          )}

          <Card>
            <CardHeader>
              <CardTitle>Méthode alternative : SQL par email</CardTitle>
              <CardDescription>
                Si vous préférez utiliser votre email au lieu de l'UUID
              </CardDescription>
            </CardHeader>
            <CardContent>
              <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto text-sm">
                <code>{`INSERT INTO admin_users (user_id, role, permissions)
SELECT
  id,
  'super_admin',
  '{"full_access": true}'::jsonb
FROM auth.users
WHERE email = '${user?.email || 'votre@email.com'}';`}</code>
              </pre>
            </CardContent>
          </Card>

          <Card className="bg-blue-50 border-blue-200">
            <CardHeader>
              <CardTitle className="text-sm">Rôles disponibles</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm">
                <li>
                  <strong>super_admin</strong> : Accès complet (configuration système, modèles, etc.)
                </li>
                <li>
                  <strong>admin</strong> : Gestion des utilisateurs et des données
                </li>
                <li>
                  <strong>support</strong> : Accès en lecture uniquement
                </li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
