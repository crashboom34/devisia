-- Read-only diagnostic for the P0-B release gate.
select j.id, j.organization_id, b.id as budget_v1_id,
       j.sold_total_ht_cents as job_sold, b.sold_total_ht_cents as snapshot_sold,
       j.initial_budget_cents as job_budget,
       b.material_cents::numeric + b.labor_cents + b.subcontract_cents
         + b.equipment_cents + b.other_cents as snapshot_budget,
       e.quote_status, e.organization_id as estimate_org, p.organization_id as project_org
from public.jobs j
left join public.job_budget_snapshots b on b.job_id = j.id and b.version = 1
left join public.estimates e on e.id = j.source_estimate_id
left join public.projects p on p.id = j.source_project_id
where b.id is null
   or b.organization_id is distinct from j.organization_id
   or b.sold_total_ht_cents is distinct from j.sold_total_ht_cents
   or j.initial_budget_cents is distinct from
      b.material_cents::numeric + b.labor_cents + b.subcontract_cents + b.equipment_cents + b.other_cents
   or least(b.material_cents, b.labor_cents, b.subcontract_cents, b.equipment_cents, b.other_cents) < 0
   or e.quote_status is distinct from 'accepted' or e.estimate_kind is distinct from 'quote'
   or e.project_id is distinct from j.source_project_id
   or e.organization_id is distinct from j.organization_id
   or p.organization_id is distinct from j.organization_id;
