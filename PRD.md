# HexaSync — Genetic Report Tracking Platform (MVP PRD)
SIH26133 · Repo: `Uddissh/26133`

## 1. Problem & Scope
Rural newborn screening reports get stuck between hospital and family. MVP proves one loop end-to-end: **staff registers a sample → runs the test → system auto-flags Normal/Abnormal → patient scans a QR to view status/report, no hospital visit needed.**

**In scope:** staff auth, sample registration, result entry with rule-based auto-flagging, PDF upload, QR-based patient lookup, signed-URL secure report access.
**Out of scope (v2):** SMS/WhatsApp/email alerts, admin/RBAC roles, multi-hospital orgs, PDF text parsing/ML.

## 2. Users & Auth
- **Staff** — Supabase Auth (email/password). One role for MVP; RLS restricts all writes to authenticated staff.
- **Patient** — no login. Looks up status via QR token or sample ID at a public `/status/[token]` route. Read-only, scoped by RLS to just that one row.

## 3. Data Model (Postgres via Supabase)
```
hospitals        id, name
staff            id (auth.users), hospital_id, name
samples          id, token (unique, random), hospital_id, patient_name,
                 guardian_contact, collected_at, status (registered|in_testing|ready),
                 result_flag (pending|normal|abnormal), report_path (storage path), created_by
test_results     id, sample_id, test_type, value, unit
reference_ranges test_type (pk), min, max, unit
```
`token` = `smpl_` + 16 random base62 chars, generated server-side on insert — never sequential.

## 4. Core Flows
- **Register sample** (staff): form → insert `samples` row (status=registered) → returns token → render QR (client-side, e.g. `qrcode` lib) for the physical sample label.
- **Enter results** (staff): input numeric `test_results` per test_type → server action checks each against `reference_ranges` → sets `result_flag` (any out-of-range = abnormal) → staff can override → status → `ready`.
- **Upload report PDF** (staff): file → Supabase Storage private bucket `reports/{sample_id}.pdf` → path saved to `report_path`.
- **Patient lookup** (public): scan QR or type token/ID → `/status/[token]` → shows status + flag; if `ready`, server generates a short-lived signed URL (e.g. 5 min) for the PDF — never a public path.

## 5. Security
- RLS: staff can insert/update only rows for their `hospital_id`; patients (anon) can `select` a single row by exact token match only (no listing endpoint).
- Storage bucket private; access only via signed URLs generated server-side with the `service_role` key.
- `service_role` key used only in server-side code (route handlers/server actions), never shipped to the client.

## 6. Tech Stack
Next.js 14 (App Router, TS) · Tailwind · Supabase (Postgres + Auth + Storage) · deployed on Vercel (manual, by you).

## 7. Env Vars (`.env.local`, not committed)
```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
```

## 8. Setup Instructions (everything except the Vercel deploy)
1. **Repo**: you create `Uddissh/26133` on GitHub (done).
2. **I will**: scaffold the Next.js app, write the SQL migration (tables + RLS + `reference_ranges` seed data), create the Storage bucket setup script, add `.env.local.example`, commit, and push using your PAT.
3. **You then**, in Supabase dashboard:
   - SQL Editor → run the migration file I provide (`supabase/migration.sql`).
   - Storage → create private bucket `reports` (or run the provided script — same result).
   - Auth → create one staff user manually (Authentication → Users → Add user) to log in with.
4. **Locally** (optional, to test before deploying): `npm install`, copy `.env.local.example` → `.env.local`, fill in your 3 keys, `npm run dev`.
5. **Vercel** (you, manually): import the GitHub repo, add the same 3 env vars in Project Settings, deploy.

## 9. Non-goals / explicit cuts
No notifications, no multi-role RBAC, no offline/PWA support, no automated PDF parsing — all flagged for v2 in the deck's roadmap, not this build.
