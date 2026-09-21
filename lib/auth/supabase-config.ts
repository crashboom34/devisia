export type SupabasePublicConfig = {
  valid: true;
  url: string;
  anonKey: string;
};

export type SupabasePublicConfigError = {
  valid: false;
  reason: 'missing' | 'placeholder' | 'invalid_url' | 'invalid_key';
  missing?: Array<'NEXT_PUBLIC_SUPABASE_URL' | 'NEXT_PUBLIC_SUPABASE_ANON_KEY'>;
};

export type SupabasePublicConfigResult =
  | SupabasePublicConfig
  | SupabasePublicConfigError;

type PublicEnvironment = {
  NEXT_PUBLIC_SUPABASE_URL?: string;
  NEXT_PUBLIC_SUPABASE_ANON_KEY?: string;
};

function decodeJwtPayload(key: string): Record<string, unknown> | null {
  const segments = key.split('.');
  if (segments.length !== 3) return null;

  try {
    const base64 = segments[1].replace(/-/g, '+').replace(/_/g, '/');
    const padded = base64.padEnd(Math.ceil(base64.length / 4) * 4, '=');
    const decoded =
      typeof atob === 'function'
        ? atob(padded)
        : Buffer.from(padded, 'base64').toString('utf8');
    return JSON.parse(decoded) as Record<string, unknown>;
  } catch {
    return null;
  }
}

function isValidProjectUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return (
      url.protocol === 'https:' &&
      /^[a-z0-9-]+\.supabase\.co$/i.test(url.hostname) &&
      (url.pathname === '' || url.pathname === '/') &&
      !url.username &&
      !url.password
    );
  } catch {
    return false;
  }
}

function isValidPublicKey(value: string): boolean {
  if (value.startsWith('sb_publishable_')) return value.length > 20;

  const payload = decodeJwtPayload(value);
  return payload?.role === 'anon';
}

export function validateSupabasePublicConfig(
  environment: PublicEnvironment
): SupabasePublicConfigResult {
  const url = environment.NEXT_PUBLIC_SUPABASE_URL?.trim() ?? '';
  const anonKey = environment.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim() ?? '';
  const missing: SupabasePublicConfigError['missing'] = [];

  if (!url) missing.push('NEXT_PUBLIC_SUPABASE_URL');
  if (!anonKey) missing.push('NEXT_PUBLIC_SUPABASE_ANON_KEY');
  if (missing.length > 0) return { valid: false, reason: 'missing', missing };

  if (/placeholder|xxxxxxxx/i.test(url) || /placeholder|xxxxxxxx/i.test(anonKey)) {
    return { valid: false, reason: 'placeholder' };
  }

  if (!isValidProjectUrl(url)) return { valid: false, reason: 'invalid_url' };
  if (!isValidPublicKey(anonKey)) return { valid: false, reason: 'invalid_key' };

  return { valid: true, url, anonKey };
}

