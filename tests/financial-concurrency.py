"""Run against a disposable PostgreSQL 17 Docker container with no exposed ports.

Run from the repository root: python3 tests/financial-concurrency.py <container>
The container must be empty. This check creates only synthetic data.
"""
import re
import subprocess
import sys
import time
from pathlib import Path

container = sys.argv[1]
if not re.fullmatch(r"devisia-p0b-[a-z0-9-]+", container):
    raise SystemExit("Use a disposable container named devisia-p0b-…")

command = ["docker", "exec", "-i", container, "psql", "-XAt", "-U", "postgres",
           "-v", "ON_ERROR_STOP=1", "-v", "VERBOSITY=verbose"]

def run(sql):
    return subprocess.run(command, input=sql, text=True, capture_output=True, check=True).stdout.strip()

if run("select to_regclass('public.jobs') is null and to_regnamespace('auth') is null;") != "t":
    raise SystemExit("The database is already initialized. Use a fresh test container.")

run(Path("tests/fixtures/p0-finance-prerequisites.sql").read_text())
for version in ["20260928170413", "20260928201500", "20260929064354", "20260929064443",
                "20260929072006", "20260929174152", "20261007060051", "20261010143718", "20261122120000", "20261123130000"]:
    path, = Path("supabase/migrations").glob(f"{version}_*.sql")
    run(path.read_text())
run(Path("supabase/deferred/20261123140000_p0_b_financial_access_cutover.sql").read_text())

owner = "00000000-0000-0000-0000-000000000001"
project = "00000000-0000-0000-0000-000000000002"
estimate = "00000000-0000-0000-0000-000000000003"
job = "00000000-0000-0000-0000-000000000004"
auth = f"set role authenticated; set test.user_id = '{owner}';"
run(f"""
insert into auth.users(id, email) values ('{owner}', 'owner@example.test');
insert into user_subscriptions select '{owner}', id, 'active', now(), now() from subscription_tiers;
insert into projects(id, user_id, title) values ('{project}', '{owner}', 'Chantier test');
insert into estimates(id, user_id, project_id, estimate_kind, quote_status)
  values ('{estimate}', '{owner}', '{project}', 'quote', 'accepted');
insert into jobs(id, organization_id, source_estimate_id, source_project_id, name, sold_total_ht_cents, initial_budget_cents, created_by)
  values ('{job}', '{owner}', '{estimate}', '{project}', 'Chantier test', 100, 100, '{owner}');
insert into job_budget_snapshots(organization_id, job_id, version, sold_total_ht_cents, other_cents)
  values ('{owner}', '{job}', 1, 100, 100);
""")
approval = f"""
insert into job_change_orders(organization_id, job_id, title, status, sold_delta_cents,
                              planned_cost_delta_cents, cost_category, approved_on)
values ('{owner}', '{job}', 'Réduction', 'approved', -80, -80, 'consumable', current_date);
"""

for isolation, expected_error in [("read committed", "negative"), ("repeatable read", "40001")]:
    with subprocess.Popen(command + ["-q"], stdin=subprocess.PIPE, stdout=subprocess.PIPE, text=True) as first:
        try:
            first.stdin.write(f"{auth} begin; {approval} select 'first_approved';\n")
            first.stdin.flush()
            assert first.stdout.readline().strip() == "first_approved"
            with subprocess.Popen(command, stdin=subprocess.PIPE, stdout=subprocess.PIPE,
                                  stderr=subprocess.PIPE, text=True) as second:
                try:
                    second.stdin.write(f"set application_name = 'concurrent_approval'; {auth} "
                                       f"begin isolation level {isolation}; {approval} commit;\n")
                    second.stdin.flush()
                    deadline = time.monotonic() + 10
                    while run("select count(*) from pg_stat_activity where application_name = "
                              "'concurrent_approval' and wait_event_type = 'Lock';") != "1":
                        assert second.poll() is None and time.monotonic() < deadline, "No concurrent lock wait"
                        time.sleep(0.05)
                    first.stdin.write("commit;\n")
                    first.stdin.close()
                    assert first.wait(timeout=10) == 0
                    second.stdin.close()
                    assert second.wait(timeout=10) != 0
                    error = second.stderr.read()
                    assert expected_error in error, error
                finally:
                    if second.poll() is None:
                        second.kill()
        finally:
            if first.poll() is None:
                first.kill()

    expected_count = 1 if isolation == 'read committed' else 3
    assert run(f"{auth} select count(*) || ':' || sum(planned_cost_delta_cents) "
               f"from job_change_orders where job_id = '{job}';").splitlines()[-1] == f"{expected_count}:-80"
    print(f"{isolation}: une seule réduction, concurrence confirmée, solde de 20 centimes")

    # Preserve approved history. Restore capacity through a compensating change order before the next case.
    if isolation == "read committed":
        run(f"""{auth}
insert into job_change_orders(organization_id, job_id, title, status, sold_delta_cents,
                              planned_cost_delta_cents, cost_category, approved_on)
values ('{owner}', '{job}', 'Avenant compensatoire', 'approved', 80, 80, 'transport', current_date);""")
        # Subsequent validation includes both prior approvals and the compensation.
