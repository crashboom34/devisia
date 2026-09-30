/*
  Replace the active estimate for one project/scenario in a single transaction.

  The partial unique index intentionally rejects two active estimates. Generating
  a new estimate must therefore deactivate the previous row and insert its
  replacement under the same transaction-level lock.
*/

CREATE OR REPLACE FUNCTION public.replace_active_estimate(p_estimate jsonb)
RETURNS SETOF public.estimates
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_project_id uuid := nullif(p_estimate ->> 'project_id', '')::uuid;
  v_user_id uuid := nullif(p_estimate ->> 'user_id', '')::uuid;
  v_organization_id uuid;
  v_scenario_type text := p_estimate ->> 'scenario_type';
  v_estimate_id uuid;
BEGIN
  IF coalesce(auth.jwt() ->> 'role', '') <> 'service_role' THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  IF v_project_id IS NULL OR v_user_id IS NULL OR v_scenario_type NOT IN ('eco', 'standard', 'premium') THEN
    RAISE EXCEPTION 'Invalid estimate payload';
  END IF;

  SELECT project.organization_id
  INTO v_organization_id
  FROM public.projects AS project
  JOIN public.organization_members AS member
    ON member.organization_id = project.organization_id
   AND member.user_id = v_user_id
  WHERE project.id = v_project_id;

  IF v_organization_id IS NULL THEN
    RAISE EXCEPTION 'Project not found or access denied';
  END IF;

  PERFORM pg_advisory_xact_lock(hashtextextended(v_project_id::text || ':' || v_scenario_type, 0));

  UPDATE public.estimates
  SET is_active = false
  WHERE project_id = v_project_id
    AND scenario_type = v_scenario_type
    AND is_active = true;

  INSERT INTO public.estimates (
    user_id,
    organization_id,
    project_id,
    scenario_type,
    estimate_kind,
    estimate_data,
    total_amount,
    line_items,
    categories,
    estimate_number,
    client_name,
    estimate_date,
    validity_days,
    payment_terms,
    execution_delay,
    deposit_required,
    special_conditions,
    total_ht,
    total_tva,
    total_ttc,
    discount_amount,
    discount_percent,
    model_used,
    scenario_justification,
    is_active
  ) VALUES (
    v_user_id,
    v_organization_id,
    v_project_id,
    v_scenario_type,
    coalesce(p_estimate ->> 'estimate_kind', 'quote'),
    coalesce(p_estimate -> 'estimate_data', '{}'::jsonb),
    coalesce((p_estimate ->> 'total_amount')::numeric, 0),
    coalesce(p_estimate -> 'line_items', '[]'::jsonb),
    coalesce(p_estimate -> 'categories', '[]'::jsonb),
    p_estimate ->> 'estimate_number',
    p_estimate ->> 'client_name',
    coalesce((p_estimate ->> 'estimate_date')::timestamptz, now()),
    coalesce((p_estimate ->> 'validity_days')::integer, 30),
    p_estimate ->> 'payment_terms',
    p_estimate ->> 'execution_delay',
    coalesce((p_estimate ->> 'deposit_required')::numeric, 0),
    p_estimate ->> 'special_conditions',
    coalesce((p_estimate ->> 'total_ht')::numeric, 0),
    nullif(p_estimate ->> 'total_tva', '')::numeric,
    nullif(p_estimate ->> 'total_ttc', '')::numeric,
    coalesce((p_estimate ->> 'discount_amount')::numeric, 0),
    coalesce((p_estimate ->> 'discount_percent')::numeric, 0),
    p_estimate ->> 'model_used',
    p_estimate ->> 'scenario_justification',
    true
  )
  RETURNING id INTO v_estimate_id;

  RETURN QUERY
  SELECT estimate.*
  FROM public.estimates AS estimate
  WHERE estimate.id = v_estimate_id;
END;
$$;

REVOKE ALL ON FUNCTION public.replace_active_estimate(jsonb) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.replace_active_estimate(jsonb) TO service_role;
