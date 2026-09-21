export type SupabasePublicConfig = {
  valid: true;
  url: string;
  anonKey: string;
};

export type SupabasePublicConfigError = {
  valid: false;
  reason: 'missing' | 'placeholder' | 'invalid_url' | 'invalid_key' | 'key_project_mismatch';
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

function getProjectRef(value: string): string | null {
  try {
    const url = new URL(value);
    const valid =
      url.protocol === 'https:' &&
      /^[a-z0-9-]+\.supabase\.co$/i.test(url.hostname) &&
      (url.pathname === '' || url.pathname === '/') &&
      !url.username &&
      !url.password;
    return valid ? url.hostname.split('.')[0] : null;
  } catch {
    return null;
  }
}

function validatePublicKey(
  value: string,
  projectRef: string
): 'valid' | 'invalid_key' | 'key_project_mismatch' {
  if (value.startsWith('sb_publishable_')) {
    return value.length > 20 ? 'valid' : 'invalid_key';
  }

  const payload = decodeJwtPayload(value);
  if (
    payload?.role !== 'anon' ||
    typeof payload.ref !== 'string' ||
    (payload.iss !== undefined && payload.iss !== 'supabase')
  ) {
    return 'invalid_key';
  }
  return payload.ref === projectRef ? 'valid' : 'key_project_mismatch';
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

  const projectRef = getProjectRef(url);
  if (!projectRef) return { valid: false, reason: 'invalid_url' };

  const keyResult = validatePublicKey(anonKey, projectRef);
  if (keyResult !== 'valid') return { valid: false, reason: keyResult };

  return { valid: true, url, anonKey };
}
