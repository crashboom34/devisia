import { afterEach, describe, expect, it, vi } from 'vitest';
import { buildEmployerCostEstimate, buildManualEmployerCostEstimate, eurosToCents, fetchUrssafEmployerCost } from '../lib/team-cost';

afterEach(() => { vi.unstubAllGlobals(); vi.useRealTimers(); });

describe('team employer costs', () => {
  it('parses only safe euro amounts', () => {
    expect(eurosToCents('3000,50')).toBe(300050);
    expect(eurosToCents('-1')).toBeNull();
    expect(eurosToCents('')).toBeNull();
    expect(eurosToCents('0')).toBe(0);
    expect(eurosToCents('3.001')).toBeNull();
    expect(eurosToCents('21474836.48')).toBeNull();
  });

  it('separates gross pay, contributions and optional extra costs', () => {
    expect(buildEmployerCostEstimate(300000, 4007.18, 35, 10000)).toEqual({
      source: 'urssaf',
      grossMonthlyCents: 300000,
      employerContributionsCents: 100718,
      employerMonthlyCostCents: 400718,
      extraMonthlyCostCents: 10000,
      totalMonthlyCostCents: 410718,
      hourlyCostCents: 2708,
      paidMonthlyHours: 35 * 52 / 12,
    });
  });

  it('rejects invalid results instead of producing NaN/Infinity', () => {
    expect(buildEmployerCostEstimate(300000, Number.NaN, 35)).toBeNull();
    expect(buildEmployerCostEstimate(0, 0, 35)).toBeNull();
    expect(buildEmployerCostEstimate(300000, 2000, 35)).toBeNull();
    expect(buildEmployerCostEstimate(300000, 4000, 0)).toBeNull();
    expect(buildEmployerCostEstimate(300000, 25_000_000, 35)).toBeNull();
  });

  it('allows a manual all-in hourly fallback without inventing contribution details', () => {
    const estimate = buildManualEmployerCostEstimate(300000, 35, 3500, 10000);
    expect(estimate).toMatchObject({ source: 'manual', employerContributionsCents: null, hourlyCostCents: 3500 });
    expect(estimate?.totalMonthlyCostCents).toBe(530833);
    expect(estimate?.employerMonthlyCostCents).toBe(520833);
    expect(estimate?.totalMonthlyCostCents && estimate.totalMonthlyCostCents * 12).toBe(6369996);
    expect(buildManualEmployerCostEstimate(300000, 35, 100, 10000)).toBeNull();
    expect(buildManualEmployerCostEstimate(0, 35, 3500)).toBeNull();
    expect(buildManualEmployerCostEstimate(300000, 0, 3500)).toBeNull();
    expect(buildManualEmployerCostEstimate(300000, 35, Number.NaN)).toBeNull();
  });

  it('sends only the gross amount to Urssaf and validates its response', async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ evaluate: [{ nodeValue: 4007.18 }] }) });
    vi.stubGlobal('fetch', fetchMock);
    expect(await fetchUrssafEmployerCost(300000, 35)).toBe(4007.18);
    const sent = JSON.parse(fetchMock.mock.calls[0][1].body as string);
    expect(sent.situation).toEqual({ 'salarié . contrat . salaire brut': '3000 €/mois' });
    expect(JSON.stringify(sent)).not.toMatch(/name|email|employee/i);
  });

  it('passes part-time hours to the official simulator', async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ evaluate: [{ nodeValue: 4160.78 }] }) });
    vi.stubGlobal('fetch', fetchMock);
    await fetchUrssafEmployerCost(300000, 28);
    const sent = JSON.parse(fetchMock.mock.calls[0][1].body as string);
    expect(sent.situation['salarié . contrat . temps de travail . temps partiel']).toBe('oui');
    expect(sent.situation['salarié . contrat . temps de travail . temps partiel . heures par semaine']).toBe('28 heure/semaine');
  });

  it('does not start a request when the calculation was already cancelled', async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
    const controller = new AbortController();
    controller.abort();

    await expect(fetchUrssafEmployerCost(300000, 35, controller.signal)).rejects.toMatchObject({ name: 'AbortError' });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it.each([400, 503])('rejects HTTP %i without trapping the user in automatic mode', async (status) => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, status }));
    await expect(fetchUrssafEmployerCost(300000, 35)).rejects.toThrow('indisponible');
  });

  it('rejects incomplete and non-finite API results', async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce({ ok: true, json: async () => ({ evaluate: [] }) })
      .mockResolvedValueOnce({ ok: true, json: async () => ({ evaluate: [{ nodeValue: Number.POSITIVE_INFINITY }] }) });
    vi.stubGlobal('fetch', fetchMock);
    await expect(fetchUrssafEmployerCost(300000, 35)).rejects.toThrow('invalide');
    await expect(fetchUrssafEmployerCost(300000, 35)).rejects.toThrow('invalide');
  });

  it('times out a stalled API request', async () => {
    vi.useFakeTimers();
    vi.stubGlobal('fetch', vi.fn().mockImplementation((_url, options: RequestInit) => new Promise((_resolve, reject) => {
      options.signal?.addEventListener('abort', () => reject(new DOMException('Aborted', 'AbortError')));
    })));
    const result = expect(fetchUrssafEmployerCost(300000, 35)).rejects.toThrow('dépassé le délai');
    await vi.advanceTimersByTimeAsync(10_000);
    await result;
  });
});
