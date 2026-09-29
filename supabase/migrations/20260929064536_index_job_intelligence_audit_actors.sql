create index if not exists job_change_orders_created_by_idx
  on public.job_change_orders(created_by);

create index if not exists job_performance_snapshots_created_by_idx
  on public.job_performance_snapshots(created_by);
