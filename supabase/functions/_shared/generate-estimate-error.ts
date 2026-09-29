export interface SafeGenerateEstimateError {
  status: number;
  publicMessage: string;
  logMessage: string;
}

export function toSafeGenerateEstimateError(error: unknown): SafeGenerateEstimateError {
  const message = error instanceof Error ? error.message : '';

  if (/^(Missing authorization header|Unauthorized)$/.test(message)) {
    return { status: 401, publicMessage: 'Authentification requise.', logMessage: 'Authentication failed' };
  }
  if (message === 'Projet introuvable ou accès refusé') {
    return { status: 404, publicMessage: message, logMessage: 'Project not found or access denied' };
  }
  if (/^Dossier modifié|^Le dossier a changé/.test(message)) {
    return { status: 409, publicMessage: message, logMessage: 'Project changed during estimate generation' };
  }
  if (/^Limite mensuelle atteinte/.test(message)) {
    return { status: 429, publicMessage: message, logMessage: 'Monthly estimate limit reached' };
  }
  if (/^Limite d'utilisation équitable atteinte/.test(message)) {
    return { status: 429, publicMessage: message, logMessage: 'Fair-use estimate limit reached' };
  }
  if (/^Service IA momentanément indisponible|^All models failed/.test(message)) {
    return {
      status: 503,
      publicMessage: 'Service IA momentanément indisponible.',
      logMessage: 'AI models unavailable',
    };
  }
  if (/^(Missing required fields|Invalid scenario type|Version du dossier ou scénario invalide)/.test(message)) {
    return { status: 400, publicMessage: 'Requête de génération invalide.', logMessage: 'Invalid estimate request' };
  }

  return {
    status: 500,
    publicMessage: 'Génération momentanément indisponible.',
    logMessage: 'Internal generate-estimate error',
  };
}
