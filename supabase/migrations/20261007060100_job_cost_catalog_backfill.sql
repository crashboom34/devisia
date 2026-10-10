-- Populate the new catalogue from previously recorded purchases. Keep the
-- most recent HT amount for each description, organization and category.
insert into public.job_cost_catalog
  (organization_id, category, description, description_key, amount_ht_cents)
select distinct on (organization_id, category, description_key)
  organization_id, category, description, description_key, amount_ht_cents
from (
  select organization_id, category, btrim(description) as description,
    private.job_cost_catalog_key(description) as description_key,
    amount_ht_cents, created_at, id
  from public.job_cost_entries
  where btrim(description) <> '' and char_length(btrim(description)) <= 160
) existing
order by organization_id, category, description_key, created_at desc, id desc
on conflict (organization_id, category, description_key) do nothing;
