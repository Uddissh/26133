-- HexaSync MVP schema — run once in Supabase SQL Editor
create extension if not exists pgcrypto;

-- ========== Tables ==========
create table hospitals (
  id uuid primary key default gen_random_uuid(),
  name text not null
);

create table staff (
  id uuid primary key references auth.users(id) on delete cascade,
  hospital_id uuid not null references hospitals(id),
  name text not null
);

create table samples (
  id uuid primary key default gen_random_uuid(),
  token text unique not null default ('smpl_' || replace(encode(gen_random_bytes(12), 'base64'), '/', '_')),
  hospital_id uuid not null references hospitals(id),
  patient_name text not null,
  guardian_contact text,
  collected_at timestamptz not null default now(),
  status text not null default 'registered' check (status in ('registered','in_testing','ready')),
  result_flag text not null default 'pending' check (result_flag in ('pending','normal','abnormal')),
  report_path text,
  created_by uuid references staff(id),
  created_at timestamptz not null default now()
);

create table reference_ranges (
  test_type text primary key,
  min numeric not null,
  max numeric not null,
  unit text not null
);

create table test_results (
  id uuid primary key default gen_random_uuid(),
  sample_id uuid not null references samples(id) on delete cascade,
  test_type text not null references reference_ranges(test_type),
  value numeric not null,
  unit text not null,
  created_at timestamptz not null default now()
);

-- ========== Seed reference ranges (example newborn screening panel) ==========
insert into reference_ranges (test_type, min, max, unit) values
  ('TSH', 0.5, 20, 'mIU/L'),
  ('PKU (Phenylalanine)', 1, 3, 'mg/dL'),
  ('G6PD', 4, 14, 'U/gHb');

-- ========== Row Level Security ==========
alter table hospitals enable row level security;
alter table staff enable row level security;
alter table samples enable row level security;
alter table test_results enable row level security;
alter table reference_ranges enable row level security;

-- staff can read their own row / hospital
create policy staff_self_select on staff for select
  using (id = auth.uid());

create policy hospitals_staff_select on hospitals for select
  using (exists (select 1 from staff where staff.id = auth.uid() and staff.hospital_id = hospitals.id));

-- reference ranges: readable by any authenticated staff (needed for auto-flag UI)
create policy ranges_staff_select on reference_ranges for select
  using (auth.role() = 'authenticated');

-- samples: staff can CRUD only rows in their own hospital. No anon policy — public lookup goes through the RPC below.
create policy samples_staff_all on samples for all
  using (exists (select 1 from staff where staff.id = auth.uid() and staff.hospital_id = samples.hospital_id))
  with check (exists (select 1 from staff where staff.id = auth.uid() and staff.hospital_id = samples.hospital_id));

create policy results_staff_all on test_results for all
  using (exists (
    select 1 from samples join staff on staff.hospital_id = samples.hospital_id
    where samples.id = test_results.sample_id and staff.id = auth.uid()
  ))
  with check (exists (
    select 1 from samples join staff on staff.hospital_id = samples.hospital_id
    where samples.id = test_results.sample_id and staff.id = auth.uid()
  ));

-- ========== Secure public lookup (token is the secret; table itself stays locked to staff) ==========
create or replace function get_sample_status(p_token text)
returns table (patient_name text, status text, result_flag text, has_report boolean)
language sql security definer set search_path = public as $$
  select patient_name, status, result_flag, (report_path is not null)
  from samples
  where token = p_token;
$$;

revoke all on function get_sample_status(text) from public;
grant execute on function get_sample_status(text) to anon, authenticated;

-- ========== Auto-flag trigger: any out-of-range test_result flags the sample abnormal ==========
create or replace function apply_auto_flag()
returns trigger language plpgsql as $$
declare
  r reference_ranges;
begin
  select * into r from reference_ranges where test_type = NEW.test_type;
  if r is not null and (NEW.value < r.min or NEW.value > r.max) then
    update samples set result_flag = 'abnormal', status = 'ready' where id = NEW.sample_id and result_flag != 'abnormal';
  else
    update samples set result_flag = 'normal', status = 'ready'
      where id = NEW.sample_id and result_flag = 'pending';
  end if;
  return NEW;
end;
$$;

create trigger test_results_auto_flag
  after insert on test_results
  for each row execute function apply_auto_flag();

-- ========== Storage bucket (private) ==========
insert into storage.buckets (id, name, public) values ('reports', 'reports', false)
  on conflict (id) do nothing;

create policy reports_staff_all on storage.objects for all
  using (bucket_id = 'reports' and auth.role() = 'authenticated')
  with check (bucket_id = 'reports' and auth.role() = 'authenticated');
-- No anon storage policy: patient-facing signed URLs are minted server-side with the service_role key (route handler), never via the anon key.
