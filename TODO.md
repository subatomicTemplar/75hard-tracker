# 75 Hard Tracker — Deployment TODO

## 1. Supabase Setup
- [ ] Go to https://supabase.com → New Project → Name: `75hard-tracker`
- [ ] Save the database password
- [ ] From Project Settings → API, copy: **Project URL**, **anon public key**, **service_role key**

## 2. Run Database Schema
- [ ] Go to Supabase SQL Editor
- [ ] Run the full SQL schema from Section 6 of `IMPLEMENTATION_PLAN.md`

## 3. Create Storage Bucket
- [ ] In Supabase Storage, create bucket named `progress-photos`
- [ ] Set it to **Public**
- [ ] RLS policies are included in the SQL schema

## 4. Configure Auth
- [ ] In Authentication → URL Configuration, set **Site URL** to your Vercel production URL
- [ ] Add `http://localhost:5173` to **Redirect URLs**

## 5. Generate VAPID Keys
- [ ] Run: `npx web-push generate-vapid-keys`
- [ ] Save both public and private keys

## 6. Fill in Environment Variables
- [ ] Update `.env.local` with:
  - `VITE_SUPABASE_URL`
  - `VITE_SUPABASE_ANON_KEY`
  - `VITE_VAPID_PUBLIC_KEY`

## 7. Deploy to Vercel
- [ ] Import repo in Vercel, Framework Preset: **Vite**, Output: `dist`
- [ ] Set environment variables in Vercel dashboard:
  - `VITE_SUPABASE_URL`
  - `VITE_SUPABASE_ANON_KEY`
  - `VITE_VAPID_PUBLIC_KEY`
  - `VAPID_PUBLIC_KEY` (same value, server-side)
  - `VAPID_PRIVATE_KEY` (server-side only)
  - `SUPABASE_URL` (server-side)
  - `SUPABASE_SERVICE_ROLE_KEY` (server-side only)
  - `CRON_SECRET` (generate a random string)

## 8. Create First Season
- [ ] In Supabase SQL Editor, run:
  ```sql
  INSERT INTO seasons (name, start_date, end_date, is_current)
  VALUES ('75 Hard — Spring 2026', '2026-03-15', '2026-05-28', true);
  ```

## 9. Go Live
- [ ] Sign up accounts for each participant via the app
- [ ] Accept push notification permissions
- [ ] Test the cron endpoint manually if desired
- [ ] Share the URL with friends
