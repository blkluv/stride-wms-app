# Supabase CI Deploy Setup

This repository includes a GitHub Actions workflow:

- `.github/workflows/supabase-deploy.yml`

It deploys on push to `main` and can also be run manually from Actions.

## Required GitHub Actions secrets

Add these in:
`GitHub repo -> Settings -> Secrets and variables -> Actions`

1. `SUPABASE_ACCESS_TOKEN`
   - Create from Supabase dashboard account settings (personal access token).
2. `SUPABASE_PROJECT_REF`
   - Supabase project reference ID (e.g. `abcdefghijklmnopqrst`).
3. `SUPABASE_DB_PASSWORD`
   - Database password from project settings.

## What the workflow does

1. Links to your Supabase project.
2. Runs `supabase db push` (migrations) on `main` pushes.
3. Deploys changed functions from `supabase/functions/*`.

## Manual run options

When using **Run workflow**, you can choose:

- `run_db_push`: run migrations or skip
- `deploy_functions`: deploy functions or skip
- `deploy_mode`:
  - `changed` (default): deploy only functions changed in the pushed range
  - `all`: deploy all function directories

## Notes

- If your remote migration history diverges from local migration files, `db push` will fail safely.
- In that case, reconcile migration history first (or run migration SQL manually in Supabase SQL Editor).
