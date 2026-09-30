/*
  Keep exactly one active estimate per project and scenario.

  Historical concurrent writes left three project/scenario pairs with more than
  one active estimate. The most recently created estimate remains active; older
  active estimates are deactivated before the uniqueness constraint is added in
  the following schema migration.
*/

WITH ranked_active_estimates AS (
  SELECT
    id,
    row_number() OVER (
      PARTITION BY project_id, scenario_type
      ORDER BY created_at DESC, id DESC
    ) AS active_rank
  FROM public.estimates
  WHERE is_active = true
)
UPDATE public.estimates AS estimate
SET is_active = false
FROM ranked_active_estimates AS ranked
WHERE estimate.id = ranked.id
  AND ranked.active_rank > 1;
