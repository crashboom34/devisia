import { describe, expect, it } from 'vitest';
import { normalizeJobCostCatalogKey } from '../lib/job-cost-catalog';

describe('job cost catalog search', () => {
  it('uses the same simple key for common wording and unit variants', () => {
    expect(normalizeJobCostCatalogKey('  Sac   ciment 25 kg ')).toBe('sac ciment 25kg');
    expect(normalizeJobCostCatalogKey('Sac de ciment 25kg')).toBe('sac ciment 25kg');
    expect(normalizeJobCostCatalogKey('CIMENT 25 KG')).toBe('ciment 25kg');
  });
});
