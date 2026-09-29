export type AiUsageStatus = 'success' | 'error' | 'timeout' | 'rate_limited';

export function classifyAiUsageStatus(httpStatus?: number, timedOut = false): AiUsageStatus {
  if (timedOut) return 'timeout';
  if (httpStatus === 429) return 'rate_limited';
  return httpStatus !== undefined && httpStatus >= 200 && httpStatus < 300 ? 'success' : 'error';
}

export function aiAttemptDurationMs(startedAtMs: number, endedAtMs = Date.now()): number {
  return Math.max(0, Math.round(endedAtMs - startedAtMs));
}

export function safeAiErrorMessage(status: AiUsageStatus, httpStatus?: number): string | null {
  if (status === 'success') return null;
  if (status === 'timeout') return 'AI request timed out';
  if (status === 'rate_limited') return 'AI provider rate limited the request';
  return httpStatus ? `AI provider returned HTTP ${httpStatus}` : 'AI request failed';
}
