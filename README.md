# HexaSync — SIH26133

Newborn Screening & Genetic Report Tracking Platform. See `PRD.md` for scope.

## Setup

1. **Supabase**: SQL Editor → run `supabase/migration.sql` (creates tables, RLS, auto-flag trigger, private `reports` bucket).
2. **Create a staff user**: Authentication → Users → Add user (email/password). Then in SQL Editor:
   ```sql
   insert into hospitals (name) values ('Demo Rural PHC') returning id;
   insert into staff (id, hospital_id, name)
     values ('<auth-user-id-from-above>', '<hospital-id-from-above>', 'Demo Staff');
   ```
3. **Local dev**: `cp .env.local.example .env.local`, fill in Project URL / anon key / service_role key from Supabase → Settings → API, then:
   ```bash
   npm install
   npm run dev
   ```
4. **Deploy**: import this repo in Vercel, add the same env vars in Project Settings, deploy.

## Routes
- `/` — landing
- `/login` — staff sign-in
- `/dashboard` — sample list (staff only)
- `/dashboard/samples/new` — register a sample
- `/dashboard/samples/[id]` — enter results, upload report PDF, view QR
- `/status` and `/status/[token]` — public, patient-facing lookup (no login)
