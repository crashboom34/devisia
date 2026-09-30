export interface EstimatePersistenceClient {
  rpc(
    name: string,
    args: { p_estimate: Record<string, unknown> },
  ): Promise<{ data: unknown; error: { message: string } | null }>;
}

export async function replaceActiveEstimate(
  supabase: EstimatePersistenceClient,
  estimate: Record<string, unknown>,
) {
  const { data, error } = await supabase.rpc('replace_active_estimate', {
    p_estimate: estimate,
  });

  if (error) {
    throw new Error(`Failed to save estimate: ${error.message}`);
  }

  if (!data || Array.isArray(data) && data.length !== 1) {
    throw new Error('Failed to save estimate: atomic replacement returned no estimate');
  }

  return Array.isArray(data) ? data[0] : data;
}
