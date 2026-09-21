export type RecoveryEmailError = 'required' | 'invalid' | null;
export type NewPasswordError = 'required' | 'too-short' | 'mismatch' | null;
export type RecoveryRequestStatus =
  | 'accepted'
  | 'network-error'
  | 'service-error';

type ResetPasswordAuth = {
  resetPasswordForEmail(
    email: string,
    options: { redirectTo: string }
  ): Promise<{ error: unknown | null }>;
};

type RecoverySessionAuth = {
  exchangeCodeForSession(code: string): Promise<{
    data?: { session?: unknown | null };
    error: unknown | null;
  }>;
  setSession(tokens: {
    access_token: string;
    refresh_token: string;
  }): Promise<{ error: unknown | null }>;
  getSession(): Promise<{
    data: { session: unknown | null };
    error: unknown | null;
  }>;
};

type UpdatePasswordAuth = {
  updateUser(attributes: { password: string }): Promise<{ error: unknown | null }>;
  signOut(options: { scope: 'local' }): Promise<{ error: unknown | null }>;
};

type RecoverySignOutAuth = Pick<UpdatePasswordAuth, 'signOut'>;

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateRecoveryEmail(email: string): RecoveryEmailError {
  const normalized = email.trim();
  if (!normalized) return 'required';
  return EMAIL_PATTERN.test(normalized) ? null : 'invalid';
}

export function validateNewPassword(
  password: string,
  confirmation: string
): NewPasswordError {
  if (!password || !confirmation) return 'required';
  if (password.length < 6) return 'too-short';
  if (password !== confirmation) return 'mismatch';
  return null;
}

export function getRecoveryRedirectUrl(origin: string): string {
  const parsedOrigin = new URL(origin);
  if (
    !['http:', 'https:'].includes(parsedOrigin.protocol) ||
    parsedOrigin.origin !== origin.replace(/\/$/, '')
  ) {
    throw new Error('Invalid recovery origin');
  }

  return new URL('/auth/reset-password', parsedOrigin.origin).toString();
}

export function classifyRecoveryRequestError(
  error: unknown
): Exclude<RecoveryRequestStatus, 'accepted'> {
  const message = error instanceof Error ? error.message.toLowerCase() : '';
  if (
    error instanceof TypeError ||
    message.includes('failed to fetch') ||
    message.includes('network request') ||
    message.includes('networkerror')
  ) {
    return 'network-error';
  }
  return 'service-error';
}

export async function requestPasswordReset(
  auth: ResetPasswordAuth,
  email: string,
  origin: string,
  timeoutMs = 12000
): Promise<{ status: RecoveryRequestStatus }> {
  let timeoutId: ReturnType<typeof setTimeout> | undefined;
  try {
    const timeout = new Promise<never>((_, reject) => {
      timeoutId = setTimeout(() => reject(new TypeError('Network request timed out')), timeoutMs);
    });
    const request = auth.resetPasswordForEmail(email.trim().toLowerCase(), {
      redirectTo: getRecoveryRedirectUrl(origin),
    });
    const { error } = await Promise.race([request, timeout]);
    if (error) return { status: classifyRecoveryRequestError(error) };
    return { status: 'accepted' };
  } catch (error) {
    return { status: classifyRecoveryRequestError(error) };
  } finally {
    if (timeoutId) clearTimeout(timeoutId);
  }
}

export function createSubmissionGuard() {
  let submitting = false;

  return {
    async run<T>(operation: () => Promise<T>): Promise<
      { started: false } | { started: true; value: T }
    > {
      if (submitting) return { started: false };
      submitting = true;
      try {
        return { started: true, value: await operation() };
      } finally {
        submitting = false;
      }
    },
  };
}

export type RecoveryUrlEvidence =
  | { kind: 'recovery'; hasCode: boolean; hasImplicitTokens: boolean }
  | { kind: 'expired' }
  | { kind: 'invalid' };

export function inspectRecoveryUrl(href: string): RecoveryUrlEvidence {
  try {
    const url = new URL(href);
    const fragment = new URLSearchParams(url.hash.replace(/^#/, ''));
    const errorCode = url.searchParams.get('error_code') ?? fragment.get('error_code');
    const error = url.searchParams.get('error') ?? fragment.get('error');

    if (errorCode || error) return { kind: 'expired' };

    const hasCode = Boolean(url.searchParams.get('code'));
    const hasImplicitTokens = Boolean(
      fragment.get('access_token') && fragment.get('refresh_token')
    );
    const type = url.searchParams.get('type') ?? fragment.get('type');
    if (hasCode || type === 'recovery') {
      return { kind: 'recovery', hasCode, hasImplicitTokens };
    }
    return { kind: 'invalid' };
  } catch {
    return { kind: 'invalid' };
  }
}

export async function establishRecoverySession(
  auth: RecoverySessionAuth,
  href: string
): Promise<{
  status: 'ready' | 'expired' | 'invalid' | 'service-error';
}> {
  const evidence = inspectRecoveryUrl(href);
  if (evidence.kind !== 'recovery') return { status: evidence.kind };

  try {
    if (evidence.hasCode) {
      const code = new URL(href).searchParams.get('code');
      if (!code) return { status: 'invalid' };
      const { error } = await auth.exchangeCodeForSession(code);
      if (error) return { status: 'expired' };
    } else {
      if (!evidence.hasImplicitTokens) return { status: 'invalid' };
      const fragment = new URLSearchParams(new URL(href).hash.slice(1));
      const accessToken = fragment.get('access_token');
      const refreshToken = fragment.get('refresh_token');
      if (!accessToken || !refreshToken) return { status: 'invalid' };

      const { error } = await auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken,
      });
      if (error) return { status: 'expired' };
    }

    const { data, error } = await auth.getSession();
    if (error) return { status: 'service-error' };
    return { status: data.session ? 'ready' : 'invalid' };
  } catch {
    return { status: 'service-error' };
  }
}

export async function updateRecoveryPassword(
  auth: UpdatePasswordAuth,
  password: string
): Promise<
  { status: 'updated' } | { status: 'updated-session-active' } | { status: 'service-error' }
> {
  try {
    const { error } = await auth.updateUser({ password });
    if (error) return { status: 'service-error' };

    return (await clearRecoverySession(auth))
      ? { status: 'updated' }
      : { status: 'updated-session-active' };
  } catch {
    return { status: 'service-error' };
  }
}

export async function clearRecoverySession(
  auth: RecoverySignOutAuth,
  attempts = 2
): Promise<boolean> {
  for (let attempt = 0; attempt < attempts; attempt += 1) {
    try {
      const { error } = await auth.signOut({ scope: 'local' });
      if (!error) return true;
    } catch {
      // Retry once before requiring explicit user action.
    }
  }
  return false;
}
