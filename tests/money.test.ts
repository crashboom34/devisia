import { describe, expect, it } from 'vitest';
import { eurosToCents, multiplyCents, percentageCents } from '../lib/money';

describe('money cents', () => {
  it('arrondit les euros une seule fois en centimes', () => {
    expect(eurosToCents(10.005)).toBe(1001);
    expect(eurosToCents(0)).toBe(0);
  });

  it('calcule quantité et TVA sans flottants monétaires persistés', () => {
    expect(multiplyCents(3200, 42)).toBe(134400);
    expect(multiplyCents(399, 2.5)).toBe(998);
    expect(percentageCents(10001, 2000)).toBe(2000);
  });

  it('refuse NaN et Infinity', () => {
    expect(() => eurosToCents(Number.NaN)).toThrow();
    expect(() => multiplyCents(100, Number.POSITIVE_INFINITY)).toThrow();
  });
});

