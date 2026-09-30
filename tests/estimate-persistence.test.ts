import { describe, expect, it, vi } from 'vitest';
import { replaceActiveEstimate } from '../supabase/functions/_shared/estimate-persistence';

describe('replaceActiveEstimate', () => {
  it('persiste le devis via le RPC atomique', async () => {
    const estimate = {
      project_id: 'project-1',
      scenario_type: 'standard',
      estimate_kind: 'preliminary',
    };
    const saved = { id: 'estimate-2', ...estimate };
    const rpc = vi.fn().mockResolvedValue({ data: [saved], error: null });

    await expect(replaceActiveEstimate({ rpc }, estimate)).resolves.toEqual(saved);
    expect(rpc).toHaveBeenCalledWith('replace_active_estimate', { p_estimate: estimate });
  });

  it('conserve une erreur interne exploitable par le filtre public', async () => {
    const rpc = vi.fn().mockResolvedValue({
      data: null,
      error: { message: 'duplicate active estimate' },
    });

    await expect(replaceActiveEstimate({ rpc }, {})).rejects.toThrow(
      'Failed to save estimate: duplicate active estimate',
    );
  });
});
