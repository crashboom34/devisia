'use client';

import { useRef, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, CheckCircle2, FileText, Loader2, Mail } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  createSubmissionGuard,
  requestPasswordReset,
  validateRecoveryEmail,
} from '@/lib/auth/password-recovery';
import { getSupabaseClient, SupabaseConfigurationError } from '@/lib/supabase';

const REQUEST_ERROR =
  'Impossible d\u2019envoyer la demande pour le moment. Réessayez dans quelques instants.';

export default function ForgotPasswordPage() {
  const submissionGuard = useRef(createSubmissionGuard()).current;
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [fieldError, setFieldError] = useState('');
  const [error, setError] = useState('');
  const [diagnostic, setDiagnostic] = useState('');
  const [sent, setSent] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    const validationError = validateRecoveryEmail(email);
    if (validationError) {
      setFieldError(
        validationError === 'required'
          ? 'Indiquez votre adresse e-mail.'
          : 'Saisissez une adresse e-mail valide.'
      );
      return;
    }

    setFieldError('');
    setError('');
    setDiagnostic('');

    const guardedResult = await submissionGuard.run(async () => {
      setLoading(true);
      try {
        const client = getSupabaseClient();
        return await requestPasswordReset(client.auth, email, window.location.origin);
      } catch (requestError) {
        if (requestError instanceof SupabaseConfigurationError) {
          return { status: 'invalid-configuration' as const };
        }
        return { status: 'service-error' as const };
      } finally {
        setLoading(false);
      }
    });

    if (!guardedResult.started) return;

    const { status } = guardedResult.value;
    if (status === 'accepted') {
      setSent(true);
      return;
    }

    setError(REQUEST_ERROR);
    if (status === 'invalid-configuration') {
      console.error('Password recovery request failed: invalid Supabase configuration');
      if (process.env.NODE_ENV === 'development') {
        setDiagnostic('Supabase configuration missing or invalid.');
      }
    } else if (status === 'network-error') {
      console.error('Password recovery request failed: network error');
    } else {
      console.error('Password recovery request failed: Supabase service error');
    }
  };

  const startOver = () => {
    setSent(false);
    setEmail('');
    setError('');
    setDiagnostic('');
    setFieldError('');
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
            <CardTitle className="text-2xl text-white">
              {sent ? 'Vérifiez votre boîte mail' : 'Réinitialiser votre mot de passe'}
            </CardTitle>
            <CardDescription className="text-gray-400">
              {sent
                ? 'La demande a bien été transmise.'
                : 'Indiquez l\u2019adresse e-mail associée à votre compte. Nous vous enverrons un lien pour choisir un nouveau mot de passe.'}
            </CardDescription>
          </CardHeader>

          <CardContent>
            {sent ? (
              <section className="space-y-6" aria-live="polite">
                <div className="flex flex-col items-center gap-4 py-2 text-center sm:py-4">
                  <span className="rounded-full bg-brand-green/20 p-3">
                    <CheckCircle2 className="h-8 w-8 text-brand-green" aria-hidden="true" />
                  </span>
                  <div className="space-y-2">
                    <p className="text-sm leading-6 text-gray-300">
                      Si un compte correspond à cette adresse, vous recevrez un lien de
                      réinitialisation dans quelques instants.
                    </p>
                    <p className="text-xs leading-5 text-gray-500">
                      Pensez à vérifier vos courriers indésirables. Le lien est temporaire.
                    </p>
                  </div>
                </div>

                <Button
                  type="button"
                  onClick={startOver}
                  variant="secondary"
                  size="lg"
                  className="w-full"
                >
                  <Mail className="h-4 w-4" aria-hidden="true" />
                  Utiliser une autre adresse
                </Button>
              </section>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5" noValidate>
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-gray-300">
                    Adresse e-mail
                  </Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    inputMode="email"
                    autoComplete="email"
                    placeholder="vous@exemple.com"
                    value={email}
                    onChange={(event) => {
                      setEmail(event.target.value);
                      if (fieldError) setFieldError('');
                    }}
                    aria-invalid={Boolean(fieldError)}
                    aria-describedby={fieldError ? 'email-error' : undefined}
                    disabled={loading}
                    className="min-h-12 border-gray-700 bg-brand-darkLight text-white placeholder:text-gray-500 focus:border-brand-green focus:ring-brand-green"
                  />
                  {fieldError ? (
                    <p id="email-error" className="text-sm text-red-400">
                      {fieldError}
                    </p>
                  ) : null}
                </div>

                <div aria-live="polite" aria-atomic="true">
                  {error ? (
                    <div
                      role="alert"
                      className="rounded-md border border-red-500/50 bg-red-500/10 p-3 text-sm leading-5 text-red-300"
                    >
                      <p>{error}</p>
                      {diagnostic ? <p className="mt-1 text-xs text-red-200">{diagnostic}</p> : null}
                    </div>
                  ) : null}
                </div>

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
                      Envoi en cours…
                    </>
                  ) : (
                    'Envoyer le lien'
                  )}
                </Button>
              </form>
            )}

            <div className="mt-6 text-center">
              <Link
                href="/auth/login"
                className="inline-flex min-h-11 items-center justify-center rounded-md px-2 text-sm font-medium text-brand-green transition-colors hover:text-green-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-green"
              >
                Retour à la connexion
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
