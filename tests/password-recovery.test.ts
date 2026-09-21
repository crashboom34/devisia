import { describe, expect, it, vi } from 'vitest';

import {
  clearRecoverySession,
  classifyRecoveryRequestError,
  createSubmissionGuard,
  establishRecoverySession,
  getRecoveryRedirectUrl,
  inspectRecoveryUrl,
  requestPasswordReset,
  updateRecoveryPassword,
  validateNewPassword,
  validateRecoveryEmail,
} from '@/lib/auth/password-recovery';
import { validateSupabasePublicConfig } from '@/lib/auth/supabase-config';

describe('validateSupabasePublicConfig', () => {
  it('accepts a valid Supabase URL and public anon JWT', () => {
    const result = validateSupabasePublicConfig({
      NEXT_PUBLIC_SUPABASE_URL: 'https://example-ref.supabase.co',
      NEXT_PUBLIC_SUPABASE_ANON_KEY:
        'eyJhbGciOiJIUzI1NiJ9.eyJyb2xlIjoiYW5vbiJ9.signature',
    });

    expect(result).toEqual({
      valid: true,
      url: 'https://example-ref.supabase.co',
      anonKey: 'eyJhbGciOiJIUzI1NiJ9.eyJyb2xlIjoiYW5vbiJ9.signature',
    });
  });

  it('accepts a Supabase publishable key', () => {
    expect(
      validateSupabasePublicConfig({
        NEXT_PUBLIC_SUPABASE_URL: 'https://example-ref.supabase.co',
        NEXT_PUBLIC_SUPABASE_ANON_KEY: 'sb_publishable_public-value',
      }).valid
    ).toBe(true);
  });

  it.each([
    [{}, 'missing'],
    [
      {
        NEXT_PUBLIC_SUPABASE_URL: 'https://placeholder.supabase.co',
        NEXT_PUBLIC_SUPABASE_ANON_KEY: 'placeholder-key',
      },
      'placeholder',
    ],
    [
      {
        NEXT_PUBLIC_SUPABASE_URL: 'http://example-ref.supabase.co',
        NEXT_PUBLIC_SUPABASE_ANON_KEY: 'sb_publishable_public-value',
      },
      'invalid_url',
    ],
    [
      {
        NEXT_PUBLIC_SUPABASE_URL: 'https://example.invalid',
        NEXT_PUBLIC_SUPABASE_ANON_KEY: 'sb_publishable_public-value',
      },
      'invalid_url',
    ],
    [
      {
        NEXT_PUBLIC_SUPABASE_URL: 'https://example-ref.supabase.co',
        NEXT_PUBLIC_SUPABASE_ANON_KEY: 'service_role_secret',
      },
      'invalid_key',
    ],
  ])('rejects invalid public configuration (%s)', (env, expectedReason) => {
    const result = validateSupabasePublicConfig(env);

    expect(result.valid).toBe(false);
    if (!result.valid) expect(result.reason).toBe(expectedReason);
  });
});

describe('forgot password helpers', () => {
  it.each([
    ['', 'required'],
    ['not-an-email', 'invalid'],
    ['alex@example.com', null],
    ['  Alex@Example.com  ', null],
  ])('validates email %j', (email, expectedError) => {
    expect(validateRecoveryEmail(email)).toBe(expectedError);
  });

  it('builds the existing reset route from the current origin', () => {
    expect(getRecoveryRedirectUrl('https://devisia.vercel.app')).toBe(
      'https://devisia.vercel.app/auth/reset-password'
    );
  });

  it('rejects an unsafe redirect origin', () => {
    expect(() => getRecoveryRedirectUrl('javascript:alert(1)')).toThrow(
      'Invalid recovery origin'
    );
  });

  it.each([
    [new TypeError('Failed to fetch'), 'network-error'],
    [new Error('Network request failed'), 'network-error'],
    [new Error('Email rate limit exceeded'), 'service-error'],
    ['unexpected', 'service-error'],
  ] as const)('classifies request errors without exposing raw details', (error, expected) => {
    expect(classifyRecoveryRequestError(error)).toBe(expected);
  });

  it('reports accepted only after Supabase accepts the request', async () => {
    const resetPasswordForEmail = vi.fn().mockResolvedValue({ error: null });

    await expect(
      requestPasswordReset(
        { resetPasswordForEmail },
        '  Alex@Example.com ',
        'https://devisia.vercel.app'
      )
    ).resolves.toEqual({ status: 'accepted' });
    expect(resetPasswordForEmail).toHaveBeenCalledWith('alex@example.com', {
      redirectTo: 'https://devisia.vercel.app/auth/reset-password',
    });
  });

  it('distinguishes a Supabase error from success', async () => {
    const resetPasswordForEmail = vi.fn().mockResolvedValue({
      error: new Error('Email rate limit exceeded'),
    });

    await expect(
      requestPasswordReset(
        { resetPasswordForEmail },
        'alex@example.com',
        'https://devisia.vercel.app'
      )
    ).resolves.toEqual({ status: 'service-error' });
  });

  it('distinguishes a network failure from success', async () => {
    const resetPasswordForEmail = vi
      .fn()
      .mockRejectedValue(new TypeError('Failed to fetch'));

    await expect(
      requestPasswordReset(
        { resetPasswordForEmail },
        'alex@example.com',
        'https://devisia.vercel.app'
      )
    ).resolves.toEqual({ status: 'network-error' });
  });

  it('does not leave the request pending indefinitely', async () => {
    vi.useFakeTimers();
    const resetPasswordForEmail = vi.fn(() => new Promise<{ error: null }>(() => undefined));
    const result = requestPasswordReset(
      { resetPasswordForEmail },
      'alex@example.com',
      'https://devisia.vercel.app',
      1000
    );

    await vi.advanceTimersByTimeAsync(1000);
    await expect(result).resolves.toEqual({ status: 'network-error' });
    vi.useRealTimers();
  });

  it('prevents concurrent submissions', async () => {
    let release!: () => void;
    const pending = new Promise<string>((resolve) => {
      release = () => resolve('done');
    });
    const operation = vi.fn(() => pending);
    const guard = createSubmissionGuard();

    const first = guard.run(operation);
    const second = await guard.run(operation);

    expect(second).toEqual({ started: false });
    expect(operation).toHaveBeenCalledTimes(1);
    release();
    await expect(first).resolves.toEqual({ started: true, value: 'done' });
  });
});

describe('reset password recovery session', () => {
  it.each([
    [
      'https://devisia.vercel.app/auth/reset-password#type=recovery&access_token=secret&refresh_token=secret-refresh',
      'recovery',
    ],
    ['https://devisia.vercel.app/auth/reset-password?code=pkce-code', 'recovery'],
    ['https://devisia.vercel.app/auth/reset-password?error_code=otp_expired', 'expired'],
    ['https://devisia.vercel.app/auth/reset-password', 'invalid'],
  ] as const)('recognizes %s without returning tokens', (href, expectedKind) => {
    const evidence = inspectRecoveryUrl(href);

    expect(evidence.kind).toBe(expectedKind);
    expect(JSON.stringify(evidence)).not.toContain('secret');
  });

  it('accepts an implicit recovery session', async () => {
    const auth = {
      exchangeCodeForSession: vi.fn(),
      setSession: vi.fn().mockResolvedValue({ error: null }),
      getSession: vi.fn().mockResolvedValue({
        data: { session: { access_token: 'secret', user: { id: 'user-id' } } },
        error: null,
      }),
    };

    await expect(
      establishRecoverySession(
        auth,
        'https://devisia.vercel.app/auth/reset-password#type=recovery&access_token=secret&refresh_token=secret-refresh'
      )
    ).resolves.toEqual({ status: 'ready' });
    expect(auth.exchangeCodeForSession).not.toHaveBeenCalled();
    expect(auth.setSession).toHaveBeenCalledWith({
      access_token: 'secret',
      refresh_token: 'secret-refresh',
    });
  });

  it('exchanges a PKCE code before accepting the session', async () => {
    const auth = {
      exchangeCodeForSession: vi.fn().mockResolvedValue({ error: null }),
      setSession: vi.fn(),
      getSession: vi.fn().mockResolvedValue({
        data: { session: { user: { id: 'user-id' } } },
        error: null,
      }),
    };

    await expect(
      establishRecoverySession(
        auth,
        'https://devisia.vercel.app/auth/reset-password?code=pkce-code'
      )
    ).resolves.toEqual({ status: 'ready' });
    expect(auth.exchangeCodeForSession).toHaveBeenCalledWith('pkce-code');
  });

  it('rejects a direct visit even if a normal session exists', async () => {
    const auth = {
      exchangeCodeForSession: vi.fn(),
      setSession: vi.fn(),
      getSession: vi.fn().mockResolvedValue({
        data: { session: { user: { id: 'already-signed-in' } } },
        error: null,
      }),
    };

    await expect(
      establishRecoverySession(
        auth,
        'https://devisia.vercel.app/auth/reset-password'
      )
    ).resolves.toEqual({ status: 'invalid' });
  });

  it('rejects expired and invalid recovery links', async () => {
    const auth = {
      exchangeCodeForSession: vi.fn(),
      setSession: vi.fn(),
      getSession: vi.fn(),
    };

    await expect(
      establishRecoverySession(
        auth,
        'https://devisia.vercel.app/auth/reset-password?error_code=otp_expired'
      )
    ).resolves.toEqual({ status: 'expired' });
    expect(auth.getSession).not.toHaveBeenCalled();
  });

  it('requires a session after valid recovery evidence', async () => {
    const auth = {
      exchangeCodeForSession: vi.fn(),
      setSession: vi.fn(),
      getSession: vi.fn().mockResolvedValue({ data: { session: null }, error: null }),
    };

    await expect(
      establishRecoverySession(
        auth,
        'https://devisia.vercel.app/auth/reset-password#type=recovery'
      )
    ).resolves.toEqual({ status: 'invalid' });
  });

  it('rejects implicit tokens that Supabase cannot validate', async () => {
    const auth = {
      exchangeCodeForSession: vi.fn(),
      setSession: vi.fn().mockResolvedValue({ error: new Error('expired') }),
      getSession: vi.fn(),
    };

    await expect(
      establishRecoverySession(
        auth,
        'https://devisia.vercel.app/auth/reset-password#type=recovery&access_token=secret&refresh_token=secret-refresh'
      )
    ).resolves.toEqual({ status: 'expired' });
    expect(auth.getSession).not.toHaveBeenCalled();
  });
});

describe('new password update', () => {
  it.each([
    ['', '', 'required'],
    ['12345', '12345', 'too-short'],
    ['abcdef', 'abcdeg', 'mismatch'],
    ['abcdef', 'abcdef', null],
  ] as const)('validates password and confirmation', (password, confirmation, expected) => {
    expect(validateNewPassword(password, confirmation)).toBe(expected);
  });

  it('updates the password and clears the local recovery session', async () => {
    const auth = {
      updateUser: vi.fn().mockResolvedValue({ error: null }),
      signOut: vi.fn().mockResolvedValue({ error: null }),
    };

    await expect(updateRecoveryPassword(auth, 'new-password')).resolves.toEqual({
      status: 'updated',
    });
    expect(auth.updateUser).toHaveBeenCalledWith({ password: 'new-password' });
    expect(auth.signOut).toHaveBeenCalledWith({ scope: 'local' });
  });

  it('does not report success when updateUser fails', async () => {
    const auth = {
      updateUser: vi.fn().mockResolvedValue({ error: new Error('expired') }),
      signOut: vi.fn(),
    };

    await expect(updateRecoveryPassword(auth, 'new-password')).resolves.toEqual({
      status: 'service-error',
    });
    expect(auth.signOut).not.toHaveBeenCalled();
  });

  it('retries local session cleanup before reporting success', async () => {
    const auth = {
      updateUser: vi.fn().mockResolvedValue({ error: null }),
      signOut: vi
        .fn()
        .mockResolvedValueOnce({ error: new Error('storage busy') })
        .mockResolvedValueOnce({ error: null }),
    };

    await expect(updateRecoveryPassword(auth, 'new-password')).resolves.toEqual({
      status: 'updated',
    });
    expect(auth.signOut).toHaveBeenCalledTimes(2);
  });

  it('keeps cleanup failure distinct from a fully completed reset', async () => {
    const auth = {
      updateUser: vi.fn().mockResolvedValue({ error: null }),
      signOut: vi.fn().mockResolvedValue({ error: new Error('storage unavailable') }),
    };

    await expect(updateRecoveryPassword(auth, 'new-password')).resolves.toEqual({
      status: 'updated-session-active',
    });
    expect(auth.signOut).toHaveBeenCalledTimes(2);
  });
});

describe('recovery session cleanup', () => {
  it('returns false after the configured cleanup attempts fail', async () => {
    const signOut = vi.fn().mockRejectedValue(new Error('storage unavailable'));

    await expect(clearRecoverySession({ signOut }, 3)).resolves.toBe(false);
    expect(signOut).toHaveBeenCalledTimes(3);
  });
});
