'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { AlertCircle, ArrowLeft, CheckCircle2, FileText, Loader2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  clearRecoverySession,
  createSubmissionGuard,
  establishRecoverySession,
  updateRecoveryPassword,
  validateNewPassword,
} from '@/lib/auth/password-recovery';
import { getSupabaseClient, SupabaseConfigurationError } from '@/lib/supabase';

type RecoveryState =
  | 'checking'
  | 'ready'
  | 'expired'
  | 'invalid'
  | 'error'
  | 'cleanup-error'
  | 'success';

const UPDATE_ERROR =
  'Impossible de modifier votre mot de passe pour le moment. Demandez un nouveau lien puis réessayez.';

export default function ResetPasswordPage() {
  const submissionGuard = useRef(createSubmissionGuard()).current;
  const initialHref = useRef(
    typeof window === 'undefined' ? '' : window.location.href
  );
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [loading, setLoading] = useState(false);
  const [cleanupLoading, setCleanupLoading] = useState(false);
  const [fieldError, setFieldError] = useState('');
  const [error, setError] = useState('');
  const [diagnostic, setDiagnostic] = useState('');
  const [recoveryState, setRecoveryState] = useState<RecoveryState>('checking');

  useEffect(() => {
    let active = true;
    let settled = false;
    let timedOut = false;
    let recoveryReady = false;
    let cleanupStarted = false;
    let timeoutId: number | undefined;
    let clearLateSession: (() => void) | undefined;

    const finish = (state: RecoveryState) => {
      if (!active || settled) return;
      settled = true;
      recoveryReady = state === 'ready';
      if (timeoutId) window.clearTimeout(timeoutId);
      setRecoveryState(state);
      window.history.replaceState({}, document.title, window.location.pathname);
    };

    let subscription: { unsubscribe: () => void } | undefined;

    try {
      const client = getSupabaseClient();
      clearLateSession = () => {
        if (cleanupStarted) return;
        cleanupStarted = true;
        void clearRecoverySession(client.auth).then((cleared) => {
          if (!cleared) {
            console.error('Password recovery cleanup failed: late session remains active');
          }
        });
      };
      const authListener = client.auth.onAuthStateChange((event, session) => {
        if (event !== 'PASSWORD_RECOVERY' || !session) return;
        if (timedOut || !active || (settled && !recoveryReady)) {
          clearLateSession?.();
          return;
        }
        finish('ready');
      });
      subscription = authListener.data.subscription;

      timeoutId = window.setTimeout(() => {
        timedOut = true;
        finish('invalid');
      }, 8000);

      void establishRecoverySession(client.auth, initialHref.current).then((result) => {
        if (
          result.status === 'ready' &&
          (timedOut || !active || (settled && !recoveryReady))
        ) {
          clearLateSession?.();
          return;
        }
        if (result.status === 'service-error') {
          console.error('Password recovery link verification failed: Supabase service error');
          finish('error');
          return;
        }
        finish(result.status);
      });
    } catch (configurationError) {
      console.error('Password recovery link verification failed: invalid Supabase configuration');
      if (configurationError instanceof SupabaseConfigurationError && process.env.NODE_ENV === 'development') {
        setDiagnostic('Supabase configuration missing or invalid.');
      }
      finish('error');
    }

    return () => {
      active = false;
      if (timeoutId) window.clearTimeout(timeoutId);
      subscription?.unsubscribe();
      if (recoveryReady) clearLateSession?.();
    };
  }, []);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    const validationError = validateNewPassword(password, confirmation);
    if (validationError) {
      setFieldError(
        validationError === 'required'
          ? 'Renseignez et confirmez votre nouveau mot de passe.'
          : validationError === 'too-short'
            ? 'Le mot de passe doit contenir au moins 6 caractères.'
            : 'Les mots de passe ne correspondent pas.'
      );
      return;
    }

    setFieldError('');
    setError('');

    const guardedResult = await submissionGuard.run(async () => {
      setLoading(true);
      try {
        const client = getSupabaseClient();
        return await updateRecoveryPassword(client.auth, password);
      } catch {
        return { status: 'service-error' as const };
      } finally {
        setLoading(false);
      }
    });

    if (!guardedResult.started) return;

    if (
      guardedResult.value.status === 'updated'
    ) {
      setPassword('');
      setConfirmation('');
      setRecoveryState('success');
      return;
    }

    if (guardedResult.value.status === 'updated-session-active') {
      console.error('Password recovery completed: local session cleanup failed');
      setPassword('');
      setConfirmation('');
      setRecoveryState('cleanup-error');
      return;
    }

    console.error('Password recovery update failed: Supabase service error');
    setError(UPDATE_ERROR);
  };

  const stateCopy = {
    checking: {
      title: 'Vérification du lien',
      description: 'Nous vérifions que ce lien de récupération est encore valide.',
    },
    ready: {
      title: 'Choisir un nouveau mot de passe',
      description: 'Utilisez au moins 6 caractères, puis confirmez votre choix.',
    },
    expired: {
      title: 'Ce lien a expiré',
      description: 'Pour protéger votre compte, les liens de récupération sont temporaires.',
    },
    invalid: {
      title: 'Ce lien n’est pas valide',
      description: 'Il a peut-être déjà été utilisé ou son adresse est incomplète.',
    },
    error: {
      title: 'Vérification impossible',
      description: 'Nous ne pouvons pas vérifier ce lien pour le moment.',
    },
    'cleanup-error': {
      title: 'Mot de passe modifié',
      description: 'La session de récupération doit encore être fermée avant de continuer.',
    },
    success: {
      title: 'Mot de passe modifié',
      description: 'Votre nouveau mot de passe est prêt. Vous pouvez maintenant vous reconnecter.',
    },
  } as const;

  const copy = stateCopy[recoveryState];

  const retrySessionCleanup = async () => {
    setCleanupLoading(true);
    try {
      const client = getSupabaseClient();
      if (await clearRecoverySession(client.auth)) {
        setRecoveryState('success');
        return;
      }
      console.error('Password recovery cleanup retry failed: local session remains active');
    } catch {
      console.error('Password recovery cleanup retry failed: invalid Supabase configuration');
    } finally {
      setCleanupLoading(false);
    }
  };

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-gradient-dark px-4 py-8 sm:py-12">
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-[linear-gradient(to_right,#1FBF7310_1px,transparent_1px),linear-gradient(to_bottom,#1FBF7310_1px,transparent_1px)] bg-[size:4rem_4rem]"
      />

      <div className="relative z-10 w-full max-w-md">
        <Link
          href="/auth/login"
          className="mb-6 inline-flex min-h-11 items-center gap-2 rounded-md text-sm text-gray-400 transition-colors hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-green sm:mb-8"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          Retour à la connexion
        </Link>

        <div className="mb-6 text-center sm:mb-8">
          <Link
            href="/"
            aria-label="Accueil Devisia"
            className="inline-flex items-center justify-center gap-2 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-green"
          >
            <span className="rounded-lg bg-brand-green p-2">
              <FileText className="h-7 w-7 text-white sm:h-8 sm:w-8" aria-hidden="true" />
            </span>
            <span className="text-2xl font-bold text-white sm:text-3xl">Devisia</span>
          </Link>
        </div>

        <Card className="border-gray-800 bg-brand-darkCard shadow-2xl">
          <CardHeader className="space-y-2">
            <CardTitle className="text-2xl text-white">{copy.title}</CardTitle>
            <CardDescription className="text-gray-400">{copy.description}</CardDescription>
          </CardHeader>

          <CardContent aria-live="polite" aria-busy={recoveryState === 'checking'}>
            {recoveryState === 'checking' ? (
              <div className="flex flex-col items-center gap-4 py-6 text-center">
                <span className="rounded-full bg-brand-green/15 p-3">
                  <Loader2 className="h-8 w-8 animate-spin text-brand-green" aria-hidden="true" />
                </span>
                <p className="text-sm text-gray-300">Vérification sécurisée en cours…</p>
              </div>
            ) : null}

            {recoveryState === 'ready' ? (
              <form onSubmit={handleSubmit} className="space-y-5" noValidate>
                <div className="space-y-2">
                  <Label htmlFor="password" className="text-gray-300">
                    Nouveau mot de passe
                  </Label>
                  <Input
                    id="password"
                    name="password"
                    type="password"
                    autoComplete="new-password"
                    value={password}
                    onChange={(event) => {
                      setPassword(event.target.value);
                      if (fieldError) setFieldError('');
                    }}
                    aria-invalid={Boolean(fieldError)}
                    aria-describedby={
                      fieldError ? 'password-help password-error' : 'password-help'
                    }
                    disabled={loading}
                    className="min-h-12 border-gray-700 bg-brand-darkLight text-white placeholder:text-gray-500 focus:border-brand-green focus:ring-brand-green"
                  />
                  <p id="password-help" className="text-xs text-gray-500">
                    Minimum 6 caractères.
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirm-password" className="text-gray-300">
                    Confirmer le mot de passe
                  </Label>
                  <Input
                    id="confirm-password"
                    name="confirm-password"
                    type="password"
                    autoComplete="new-password"
                    value={confirmation}
                    onChange={(event) => {
                      setConfirmation(event.target.value);
                      if (fieldError) setFieldError('');
                    }}
                    aria-invalid={Boolean(fieldError)}
                    aria-describedby={fieldError ? 'password-error' : undefined}
                    disabled={loading}
                    className="min-h-12 border-gray-700 bg-brand-darkLight text-white placeholder:text-gray-500 focus:border-brand-green focus:ring-brand-green"
                  />
                </div>

                {fieldError ? (
                  <p id="password-error" role="alert" className="text-sm text-red-400">
                    {fieldError}
                  </p>
                ) : null}

                {error ? (
                  <div
                    role="alert"
                    className="rounded-md border border-red-500/50 bg-red-500/10 p-3 text-sm leading-5 text-red-300"
                  >
                    {error}
                  </div>
                ) : null}

                <Button
                  type="submit"
                  disabled={loading}
                  aria-busy={loading}
                  size="lg"
                  className="w-full bg-brand-green text-white hover:bg-green-600"
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                      Modification en cours…
                    </>
                  ) : (
                    'Enregistrer le nouveau mot de passe'
                  )}
                </Button>
              </form>
            ) : null}

            {recoveryState === 'success' ? (
              <div className="flex flex-col items-center gap-5 py-3 text-center">
                <span className="rounded-full bg-brand-green/20 p-3">
                  <CheckCircle2 className="h-8 w-8 text-brand-green" aria-hidden="true" />
                </span>
                <p className="text-sm leading-6 text-gray-300">
                  Utilisez désormais votre nouveau mot de passe pour accéder à Devisia.
                </p>
                <Button asChild size="lg" className="w-full bg-brand-green text-white hover:bg-green-600">
                  <Link href="/auth/login">Se reconnecter</Link>
                </Button>
              </div>
            ) : null}

            {recoveryState === 'cleanup-error' ? (
              <div className="flex flex-col items-center gap-5 py-3 text-center">
                <span className="rounded-full bg-amber-500/15 p-3">
                  <AlertCircle className="h-8 w-8 text-amber-400" aria-hidden="true" />
                </span>
                <p className="text-sm leading-6 text-gray-300">
                  Votre mot de passe a bien été modifié, mais la session sécurisée est encore
                  active. Réessayez de la fermer avant de vous reconnecter.
                </p>
                <Button
                  type="button"
                  onClick={retrySessionCleanup}
                  disabled={cleanupLoading}
                  aria-busy={cleanupLoading}
                  size="lg"
                  className="w-full bg-brand-green text-white hover:bg-green-600"
                >
                  {cleanupLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                      Fermeture en cours…
                    </>
                  ) : (
                    'Fermer la session sécurisée'
                  )}
                </Button>
              </div>
            ) : null}

            {['expired', 'invalid', 'error'].includes(recoveryState) ? (
              <div className="flex flex-col items-center gap-5 py-3 text-center">
                <span className="rounded-full bg-amber-500/15 p-3">
                  <AlertCircle className="h-8 w-8 text-amber-400" aria-hidden="true" />
                </span>
                <div className="space-y-2">
                  <p className="text-sm leading-6 text-gray-300">
                    Demandez un nouveau lien pour reprendre la réinitialisation en toute sécurité.
                  </p>
                  {diagnostic ? <p className="text-xs text-amber-200">{diagnostic}</p> : null}
                </div>
                <Button asChild size="lg" className="w-full bg-brand-green text-white hover:bg-green-600">
                  <Link href="/auth/forgot-password">Demander un nouveau lien</Link>
                </Button>
              </div>
            ) : null}
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
