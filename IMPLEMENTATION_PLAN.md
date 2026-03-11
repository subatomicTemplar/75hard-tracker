# 75 Hard Tracker — Full Implementation Plan

This document is a complete, self-contained specification for building a 75 Hard challenge tracking web app. A Claude Code instance should be able to follow this document start-to-finish to produce a fully deployed application.

---

## Table of Contents

1. [Overview](#1-overview)
2. [Tech Stack](#2-tech-stack)
3. [Supabase Setup (Manual Steps)](#3-supabase-setup-manual-steps)
4. [GitHub + Vercel Setup (Manual Steps)](#4-github--vercel-setup-manual-steps)
5. [Project Scaffolding](#5-project-scaffolding)
6. [Database Schema](#6-database-schema)
7. [Authentication System](#7-authentication-system)
8. [Core Data Model (TypeScript)](#8-core-data-model-typescript)
9. [Supabase Client & Sync](#9-supabase-client--sync)
10. [Pages & Routing](#10-pages--routing)
11. [Main Page — Daily View](#11-main-page--daily-view)
12. [Daily Entry Form](#12-daily-entry-form)
13. [Photo Upload](#13-photo-upload)
14. [User Tiles](#14-user-tiles)
15. [Analytics Section](#15-analytics-section)
16. [Push Notifications](#16-push-notifications)
17. [Styling & Theme](#17-styling--theme)
18. [Environment Variables](#18-environment-variables)
19. [Deployment Checklist](#19-deployment-checklist)
20. [File Tree](#20-file-tree)

---

## 1. Overview

**75 Hard** is a mental toughness challenge with daily requirements:
- Two 45-minute workouts (one must be outdoors)
- Drink 1 gallon of water
- Read 10 pages of a non-fiction book
- Follow a diet (no alcohol, no cheat meals)
- Take a progress photo

This app lets a group of friends track their daily progress together across multiple "seasons" (iterations of the challenge). Each user logs their daily data, uploads a progress photo, and can see everyone's progress for any given day. Analytics graphs show trends over time.

**Key UX Flow:**
1. User logs in (email/password via Supabase Auth)
2. Lands on main page filtered to current season + today's date
3. Sees all participants' tiles for that day (photo + stats)
4. Taps "Log Today" to fill out the daily form
5. Can browse other dates and seasons
6. Expandable analytics per user at bottom of their tile
7. Gets a push notification at 10 PM EST daily as a reminder

---

## 2. Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | React 18 + TypeScript + Vite |
| Styling | Tailwind CSS 3 |
| Routing | React Router v6 |
| Auth | Supabase Auth (email/password) |
| Database | Supabase PostgreSQL |
| Storage | Supabase Storage (photo bucket) |
| Hosting | Vercel (static site) |
| Charts | Recharts |
| Push Notifications | Web Push API + Vercel serverless function + `web-push` npm package |
| Date Handling | `date-fns` |
| Icons | `lucide-react` |

---

## 3. Supabase Setup (Manual Steps)

The human must do these steps in the Supabase dashboard before Claude Code builds the app.

### 3.1 Create Project

1. Go to https://supabase.com → New Project
2. Name: `75hard-tracker`
3. Set a strong database password (save it)
4. Region: US East (or closest)
5. Wait for project to provision

### 3.2 Get Credentials

From Project Settings → API:
- Copy **Project URL** (e.g., `https://xxxx.supabase.co`)
- Copy **anon public** key
- Copy **service_role** key (for server-side push notification function only)

### 3.3 Enable Auth

From Authentication → Providers:
- Email provider should be enabled by default
- Under Authentication → URL Configuration:
  - Set **Site URL** to your Vercel production URL (e.g., `https://75hard.vercel.app`)
  - Add `http://localhost:5173` to **Redirect URLs** for local dev

### 3.4 Create Storage Bucket

From Storage:
1. Create bucket named `progress-photos`
2. Set to **Public** (photos are viewable by all authenticated users)
3. Add RLS policies (see section 6)

### 3.5 Run SQL Schema

From SQL Editor, run the full schema from Section 6 of this document.

### 3.6 Enable Realtime (Optional)

From Database → Replication:
- Enable realtime for `daily_entries` table (so users see each other's updates live)

---

## 4. GitHub + Vercel Setup (Manual Steps)

### 4.1 GitHub

1. Create a new repository: `75hard-tracker`
2. Clone it locally
3. Claude Code will scaffold the project inside this repo

### 4.2 Vercel

1. Go to https://vercel.com → Import Git Repository → select `75hard-tracker`
2. Framework Preset: **Vite**
3. Build Command: `npm run build`
4. Output Directory: `dist`
5. Add environment variables (see Section 18)
6. Deploy

### 4.3 Custom Domain (Optional)

In Vercel project settings → Domains, add your custom domain if desired.

---

## 5. Project Scaffolding

```bash
npm create vite@latest . -- --template react-ts
npm install @supabase/supabase-js react-router-dom recharts date-fns lucide-react web-push
npm install -D tailwindcss @tailwindcss/vite
```

### Tailwind Setup

In `vite.config.ts`:
```typescript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
})
```

In `src/index.css`:
```css
@import "tailwindcss";
```

### Vercel Config

Create `vercel.json` at project root:
```json
{
  "rewrites": [
    { "source": "/((?!api/).*)", "destination": "/index.html" }
  ]
}
```

---

## 6. Database Schema

Run this SQL in Supabase SQL Editor:

```sql
-- ============================================================
-- SEASONS (iterations of the 75 Hard challenge)
-- ============================================================
CREATE TABLE seasons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,               -- e.g., "75 Hard — Spring 2026"
  start_date date NOT NULL,
  end_date date NOT NULL,           -- start_date + 74 days
  is_current boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Only one season can be current at a time
CREATE UNIQUE INDEX idx_seasons_current ON seasons (is_current) WHERE is_current = true;

-- ============================================================
-- PROFILES (extends Supabase auth.users)
-- ============================================================
CREATE TABLE profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name text NOT NULL,
  avatar_url text,
  created_at timestamptz DEFAULT now()
);

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1)));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ============================================================
-- DAILY ENTRIES (one per user per day per season)
-- ============================================================
CREATE TABLE daily_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  season_id uuid NOT NULL REFERENCES seasons(id) ON DELETE CASCADE,
  entry_date date NOT NULL,

  -- Tracking fields
  weight_lbs numeric(5,1),                -- e.g., 185.5
  water_oz integer DEFAULT 0,             -- ounces consumed (target: 128 oz = 1 gallon)
  workout1_type text,                     -- e.g., "Run", "Gym", "Walk", "Yoga", "Bike", "Swim", "Hike", "Sport"
  workout1_outdoor boolean DEFAULT false,
  workout1_duration_min integer,          -- minutes
  workout1_notes text,
  workout2_type text,
  workout2_outdoor boolean DEFAULT false,
  workout2_duration_min integer,
  workout2_notes text,
  pages_read integer DEFAULT 0,
  book_title text,
  diet_followed boolean DEFAULT false,

  -- Photo
  photo_url text,                         -- Supabase Storage public URL

  -- Metadata
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),

  -- One entry per user per day per season
  UNIQUE(user_id, season_id, entry_date)
);

-- Index for fast lookups by date + season
CREATE INDEX idx_entries_season_date ON daily_entries(season_id, entry_date);
CREATE INDEX idx_entries_user_season ON daily_entries(user_id, season_id);

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON daily_entries
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- PUSH SUBSCRIPTIONS (for web push notifications)
-- ============================================================
CREATE TABLE push_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  endpoint text NOT NULL UNIQUE,
  keys_p256dh text NOT NULL,
  keys_auth text NOT NULL,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX idx_push_subs_user ON push_subscriptions(user_id);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

-- Seasons: everyone can read, nobody can write via API (admin only via dashboard)
ALTER TABLE seasons ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Seasons are viewable by authenticated users" ON seasons
  FOR SELECT USING (auth.role() = 'authenticated');

-- Profiles: everyone can read, users can update their own
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Profiles are viewable by authenticated users" ON profiles
  FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

-- Daily entries: everyone can read, users can insert/update their own
ALTER TABLE daily_entries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Entries are viewable by authenticated users" ON daily_entries
  FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Users can insert own entries" ON daily_entries
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own entries" ON daily_entries
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own entries" ON daily_entries
  FOR DELETE USING (auth.uid() = user_id);

-- Push subscriptions: users manage their own
ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own push subs" ON push_subscriptions
  FOR ALL USING (auth.uid() = user_id);

-- ============================================================
-- STORAGE POLICIES (for progress-photos bucket)
-- ============================================================
-- Run these AFTER creating the 'progress-photos' bucket in the dashboard

-- Anyone authenticated can upload to their own folder
CREATE POLICY "Users can upload own photos" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'progress-photos' AND
    auth.role() = 'authenticated' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

-- Anyone authenticated can view all photos
CREATE POLICY "Authenticated users can view photos" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'progress-photos' AND
    auth.role() = 'authenticated'
  );

-- Users can update/delete their own photos
CREATE POLICY "Users can update own photos" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'progress-photos' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );
CREATE POLICY "Users can delete own photos" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'progress-photos' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );
```

---

## 7. Authentication System

### 7.1 Supabase Client

```typescript
// src/lib/supabase.ts
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
```

### 7.2 Auth Context

Create `src/contexts/AuthContext.tsx`:
- Wrap the app in an `AuthProvider`
- On mount, call `supabase.auth.getSession()` to check for existing session
- Subscribe to `supabase.auth.onAuthStateChange()` for login/logout events
- Expose: `user`, `profile`, `loading`, `signIn`, `signUp`, `signOut`, `resetPassword`

### 7.3 Auth Pages

**Login Page** (`/login`):
- Email + password form
- "Forgot password?" link → calls `supabase.auth.resetPasswordForEmail(email)`
- "Don't have an account? Sign up" link

**Sign Up Page** (`/signup`):
- Email + password + display name
- Calls `supabase.auth.signUp({ email, password, options: { data: { display_name } } })`
- Shows "Check your email for confirmation" message

**Reset Password Page** (`/reset-password`):
- Shown when user clicks email reset link
- Supabase redirects to `{site_url}/reset-password#access_token=...`
- Form to enter new password
- Calls `supabase.auth.updateUser({ password })`

### 7.4 Protected Routes

Create a `ProtectedRoute` wrapper component:
- If no session → redirect to `/login`
- If loading → show spinner
- If authenticated → render children

---

## 8. Core Data Model (TypeScript)

```typescript
// src/types.ts

export interface Season {
  id: string;
  name: string;
  start_date: string;       // 'YYYY-MM-DD'
  end_date: string;
  is_current: boolean;
  created_at: string;
}

export interface Profile {
  id: string;
  display_name: string;
  avatar_url: string | null;
  created_at: string;
}

export interface DailyEntry {
  id: string;
  user_id: string;
  season_id: string;
  entry_date: string;       // 'YYYY-MM-DD'
  weight_lbs: number | null;
  water_oz: number;
  workout1_type: string | null;
  workout1_outdoor: boolean;
  workout1_duration_min: number | null;
  workout1_notes: string | null;
  workout2_type: string | null;
  workout2_outdoor: boolean;
  workout2_duration_min: number | null;
  workout2_notes: string | null;
  pages_read: number;
  book_title: string | null;
  diet_followed: boolean;
  photo_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface PushSubscription {
  id: string;
  user_id: string;
  endpoint: string;
  keys_p256dh: string;
  keys_auth: string;
}

// Workout type options (used in dropdowns)
export const WORKOUT_TYPES = [
  'Run', 'Walk', 'Hike', 'Bike', 'Swim',
  'Gym', 'Yoga', 'Pilates', 'CrossFit',
  'Sport', 'Dance', 'Martial Arts', 'Other'
] as const;
```

---

## 9. Supabase Client & Sync

### 9.1 Data Fetching Hooks

Create custom hooks in `src/hooks/`:

**`useSeasons()`** — Fetch all seasons, sorted by start_date desc
**`useCurrentSeason()`** — Fetch the season where `is_current = true`
**`useProfiles()`** — Fetch all profiles
**`useDailyEntries(seasonId, date)`** — Fetch all entries for a season + date
**`useUserEntries(userId, seasonId)`** — Fetch all entries for one user in a season (for analytics)
**`useMyEntry(seasonId, date)`** — Fetch current user's entry for a specific date

All hooks should use `useState` + `useEffect` with the Supabase client. Optionally set up Supabase Realtime subscription on `daily_entries` for live updates.

### 9.2 Data Mutation Functions

Create `src/lib/api.ts`:

```typescript
export async function upsertDailyEntry(entry: Partial<DailyEntry>): Promise<DailyEntry>
// Uses supabase.from('daily_entries').upsert() with onConflict: 'user_id,season_id,entry_date'

export async function uploadProgressPhoto(userId: string, date: string, file: File): Promise<string>
// Uploads to progress-photos/{userId}/{date}.jpg
// Returns public URL

export async function savePushSubscription(userId: string, sub: PushSubscriptionJSON): Promise<void>
// Upserts to push_subscriptions table
```

---

## 10. Pages & Routing

```typescript
// src/App.tsx routes
<Routes>
  <Route path="/login" element={<LoginPage />} />
  <Route path="/signup" element={<SignUpPage />} />
  <Route path="/reset-password" element={<ResetPasswordPage />} />
  <Route element={<ProtectedRoute />}>
    <Route path="/" element={<MainPage />} />
    <Route path="/entry/:date?" element={<EntryFormPage />} />
    <Route path="/profile" element={<ProfilePage />} />
  </Route>
</Routes>
```

| Route | Page | Description |
|-------|------|-------------|
| `/` | MainPage | Daily view with filters, user tiles |
| `/entry` | EntryFormPage | Daily entry form (defaults to today) |
| `/entry/:date` | EntryFormPage | Edit entry for specific date |
| `/login` | LoginPage | Email/password login |
| `/signup` | SignUpPage | Registration |
| `/reset-password` | ResetPasswordPage | Password reset flow |
| `/profile` | ProfilePage | Edit display name, avatar |

---

## 11. Main Page — Daily View

### Layout

```
┌──────────────────────────────────────────┐
│  75 HARD                    [Profile] 🔔 │
├──────────────────────────────────────────┤
│  Season: [Spring 2026 ▾]                 │
│  Date:   [◀] March 11, 2026 [▶]         │
├──────────────────────────────────────────┤
│  Day 15 of 75  ████████░░░░░ 20%        │
├──────────────────────────────────────────┤
│  [ + Log Today ]                         │
├──────────────────────────────────────────┤
│  ┌─ User Tile: Zach ──────────────────┐  │
│  │  [Photo]  Weight: 185 lbs          │  │
│  │           Water: 128/128 oz ✓      │  │
│  │           Workout 1: Run (outdoor) │  │
│  │           Workout 2: Gym           │  │
│  │           Pages: 15                │  │
│  │           Diet: ✓                  │  │
│  │  [▾ Analytics]                     │  │
│  └────────────────────────────────────┘  │
│  ┌─ User Tile: Mike ─────────────────┐   │
│  │  (no entry yet)                    │  │
│  └────────────────────────────────────┘  │
└──────────────────────────────────────────┘
```

### Filters

- **Season dropdown**: Shows all seasons. Defaults to current season (`is_current = true`). Stored in URL search params or local state.
- **Date picker**: Left/right arrows to navigate days. Defaults to today. Only allows dates within the selected season's `start_date` to `end_date` range. Shows "Day X of 75" progress indicator.

### Data Loading

On filter change:
1. Fetch all `daily_entries` WHERE `season_id = selectedSeason` AND `entry_date = selectedDate`
2. Fetch all `profiles` (cached)
3. Render one tile per profile, with entry data if it exists

---

## 12. Daily Entry Form

### Route: `/entry` or `/entry/:date`

If no `:date` param, default to today's date in `YYYY-MM-DD` format.

### Form Fields

**Weight** (optional):
- Number input, step 0.1, placeholder "lbs"
- Min 50, max 500

**Water Intake** (required, default 0):
- Visual water bottle that fills up as you tap increments
- Settable increment size: user picks 8oz, 12oz, 16oz, 20oz, 24oz, 32oz increments (buttons at top of bottle)
- Target line at 128 oz (1 gallon)
- Tap the bottle or "+" button to add one increment
- Tap "-" to remove one increment
- Numerical display shows current oz / 128 oz
- Bottle SVG fills proportionally (water_oz / 128)

**Workout 1**:
- Type: dropdown from `WORKOUT_TYPES`
- Outdoor: toggle/checkbox
- Duration: number input (minutes)
- Notes: optional text input

**Workout 2**:
- Same fields as Workout 1

**Reading**:
- Pages read: number input (min 0)
- Book title: text input (optional, remembered from last entry)

**Diet Followed**: toggle/checkbox

**Progress Photo**:
- Camera/file input (accept image/*)
- Preview thumbnail after selection
- On submit, upload to Supabase Storage then save URL

### Submit Behavior

1. Upload photo if selected → get URL
2. Call `upsertDailyEntry()` with all fields
3. Navigate back to main page
4. Show success toast

---

## 13. Photo Upload

### Storage Path Convention

```
progress-photos/{user_id}/{YYYY-MM-DD}.jpg
```

### Upload Flow

```typescript
async function uploadProgressPhoto(userId: string, date: string, file: File): Promise<string> {
  const path = `${userId}/${date}.jpg`;

  // Compress image client-side before upload (max 800px wide, 80% quality JPEG)
  const compressed = await compressImage(file, 800, 0.8);

  const { error } = await supabase.storage
    .from('progress-photos')
    .upload(path, compressed, {
      upsert: true,
      contentType: 'image/jpeg'
    });

  if (error) throw error;

  const { data } = supabase.storage
    .from('progress-photos')
    .getPublicUrl(path);

  // Append cache-buster to force reload after re-upload
  return `${data.publicUrl}?t=${Date.now()}`;
}
```

### Image Compression

Create `src/lib/imageCompress.ts`:
- Use `<canvas>` to resize to max 800px width
- Convert to JPEG at 80% quality
- Return as `Blob`

---

## 14. User Tiles

Each tile represents one participant for the selected date.

### Tile Component Props

```typescript
interface UserTileProps {
  profile: Profile;
  entry: DailyEntry | null;    // null = no entry for this date
  seasonId: string;
}
```

### Layout

- **Header**: Display name + avatar (or initials)
- **Photo**: Large photo if uploaded, placeholder if not
- **Stats grid**:
  - Weight (if logged)
  - Water progress bar (X/128 oz) with checkmark if >= 128
  - Workout 1 summary (type, outdoor badge, duration)
  - Workout 2 summary
  - Pages read
  - Diet followed (check/X)
- **Completion indicator**: Green border if ALL daily requirements met, yellow if partial, gray if no entry
- **Analytics toggle**: Expandable section at bottom (see Section 15)

### Completion Logic

A day is "complete" when ALL of these are true:
- `water_oz >= 128`
- `workout1_type` is not null AND `workout1_duration_min >= 45`
- `workout2_type` is not null AND `workout2_duration_min >= 45`
- At least one workout has `outdoor = true`
- `pages_read >= 10`
- `diet_followed = true`
- `photo_url` is not null

---

## 15. Analytics Section

Expandable section at the bottom of each user tile. When expanded, shows charts for that user within the current season.

### Data Source

Fetch all entries for `user_id` + `season_id`, sorted by `entry_date`.

### Charts (use Recharts)

**1. Weight Over Time** (Line chart)
- X-axis: date (entry_date)
- Y-axis: weight_lbs
- Skip days with no weight logged
- Domain: auto-fit with padding

**2. Water Per Day** (Bar chart)
- X-axis: date
- Y-axis: water_oz
- Reference line at 128 oz (goal)
- Green bars >= 128, yellow bars < 128

**3. Pages Read Per Day** (Bar chart)
- X-axis: date
- Y-axis: pages_read
- Reference line at 10 (daily goal)

**4. Workout Types Breakdown** (Pie chart)
- Aggregate all workout1_type + workout2_type values across the season
- Show distribution of workout types
- Tooltip with count

### Implementation

Create `src/components/UserAnalytics.tsx`:
- Accept `userId: string` and `seasonId: string` props
- Fetch data on expand (lazy load)
- Render 4 charts in a 2x2 grid on desktop, stacked on mobile
- Each chart ~250px tall
- Loading skeleton while fetching

---

## 16. Push Notifications

### 16.1 Overview

Send a web push notification to all subscribed users at 10 PM EST daily reminding them to log their day.

### 16.2 VAPID Keys

Generate VAPID keys (one-time):
```bash
npx web-push generate-vapid-keys
```

Save the public and private keys. Add them to environment variables.

### 16.3 Service Worker

Create `public/sw.js`:
```javascript
self.addEventListener('push', (event) => {
  const data = event.data?.json() || {};
  const title = data.title || '75 Hard Reminder';
  const options = {
    body: data.body || "Don't forget to log your progress today!",
    icon: '/icon-192.png',
    badge: '/icon-192.png',
    tag: 'daily-reminder',
    renotify: true,
  };
  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(clients.openWindow('/'));
});
```

### 16.4 Client-Side Subscription

In `src/lib/pushNotifications.ts`:

```typescript
export async function subscribeToPush(userId: string): Promise<void> {
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) return;

  const registration = await navigator.serviceWorker.register('/sw.js');

  const subscription = await registration.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: import.meta.env.VITE_VAPID_PUBLIC_KEY,
  });

  const sub = subscription.toJSON();
  await supabase.from('push_subscriptions').upsert({
    user_id: userId,
    endpoint: sub.endpoint,
    keys_p256dh: sub.keys.p256dh,
    keys_auth: sub.keys.auth,
  }, { onConflict: 'endpoint' });
}
```

Call `subscribeToPush()` after login (with a permission prompt).

### 16.5 Server-Side Push (Vercel Cron)

Create `api/send-reminders.ts`:

```typescript
import webpush from 'web-push';
import { createClient } from '@supabase/supabase-js';

webpush.setVapidDetails(
  'mailto:your-email@example.com',
  process.env.VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!
);

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export default async function handler(req: Request) {
  // Verify this is a cron call (Vercel sets this header)
  if (req.headers.get('authorization') !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response('Unauthorized', { status: 401 });
  }

  const { data: subs } = await supabase
    .from('push_subscriptions')
    .select('*');

  if (!subs || subs.length === 0) {
    return new Response('No subscriptions');
  }

  const payload = JSON.stringify({
    title: '75 Hard Reminder',
    body: "Don't forget to log your progress today! 💪",
  });

  const results = await Promise.allSettled(
    subs.map(sub =>
      webpush.sendNotification(
        {
          endpoint: sub.endpoint,
          keys: { p256dh: sub.keys_p256dh, auth: sub.keys_auth },
        },
        payload
      ).catch(async (err) => {
        // Remove expired subscriptions (410 Gone)
        if (err.statusCode === 410) {
          await supabase.from('push_subscriptions').delete().eq('id', sub.id);
        }
      })
    )
  );

  return new Response(`Sent to ${results.length} subscribers`);
}
```

### 16.6 Vercel Cron Schedule

Create `vercel.json` (merge with existing):
```json
{
  "rewrites": [
    { "source": "/((?!api/).*)", "destination": "/index.html" }
  ],
  "crons": [
    {
      "path": "/api/send-reminders",
      "schedule": "0 3 * * *"
    }
  ]
}
```

**Note:** `0 3 * * *` = 3:00 AM UTC = 10:00 PM EST. Adjust if daylight saving shifts matter (EDT = UTC-4, so use `0 2 * * *` during summer, or just pick one).

---

## 17. Styling & Theme

### Colors (Dark Theme)

```
Background:       #0f172a (slate-900)
Card background:  #1e293b (slate-800)
Card border:      #334155 (slate-700)
Primary accent:   #22c55e (green-500) — completion, success
Warning:          #eab308 (yellow-500) — partial completion
Text primary:     #f8fafc (slate-50)
Text secondary:   #94a3b8 (slate-400)
Water blue:       #3b82f6 (blue-500)
```

### Mobile-First

- Max width 640px for main content (centered on desktop)
- Touch-friendly tap targets (min 44px)
- Bottom nav or top header with minimal controls

---

## 18. Environment Variables

### Local Development (`.env.local`)

```
VITE_SUPABASE_URL=https://xxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGci...
VITE_VAPID_PUBLIC_KEY=BLxxxxxx...
```

### Vercel Environment Variables

Set in Vercel dashboard → Project Settings → Environment Variables:

```
VITE_SUPABASE_URL         = https://xxxx.supabase.co
VITE_SUPABASE_ANON_KEY    = eyJhbGci...
VITE_VAPID_PUBLIC_KEY     = BLxxxxxx...
VAPID_PUBLIC_KEY           = BLxxxxxx...    (server-side, same value)
VAPID_PRIVATE_KEY          = xxxxxxxx...    (server-side only)
SUPABASE_URL               = https://xxxx.supabase.co  (server-side)
SUPABASE_SERVICE_ROLE_KEY  = eyJhbGci...   (server-side only, NEVER expose to client)
CRON_SECRET                = (generate a random string, used to authenticate cron calls)
```

---

## 19. Deployment Checklist

After Claude Code builds the app:

1. [ ] **Supabase**: Create project, run SQL schema, create `progress-photos` bucket
2. [ ] **VAPID keys**: Generate with `npx web-push generate-vapid-keys`, save both keys
3. [ ] **GitHub**: Push code to repo
4. [ ] **Vercel**: Import repo, set env vars, deploy
5. [ ] **Supabase Auth**: Set Site URL to Vercel production URL, add localhost to redirect URLs
6. [ ] **Create first season**: In Supabase SQL Editor:
   ```sql
   INSERT INTO seasons (name, start_date, end_date, is_current)
   VALUES ('75 Hard — Spring 2026', '2026-03-15', '2026-05-28', true);
   ```
7. [ ] **Sign up**: Create accounts for each participant via the app's signup page
8. [ ] **Test push**: Visit the app, accept notification permission, trigger cron manually via `curl`
9. [ ] **Go live**: Share the URL with friends

---

## 20. File Tree

```
75hard-tracker/
├── api/
│   └── send-reminders.ts          # Vercel serverless: push notification cron
├── public/
│   ├── sw.js                       # Service worker for push notifications
│   ├── icon-192.png                # App icon (192x192)
│   ├── icon-512.png                # App icon (512x512)
│   └── manifest.json               # PWA manifest (for "Add to Home Screen")
├── src/
│   ├── components/
│   │   ├── DateNavigator.tsx        # Left/right arrows + date display + day counter
│   │   ├── EntryForm.tsx            # The daily entry form (weight, water, workouts, etc.)
│   │   ├── ProtectedRoute.tsx       # Auth guard wrapper
│   │   ├── SeasonPicker.tsx         # Season dropdown
│   │   ├── UserAnalytics.tsx        # Expandable charts (weight, water, pages, workouts)
│   │   ├── UserTile.tsx             # Single participant's daily card
│   │   ├── WaterBottle.tsx          # Interactive water bottle with settable increments
│   │   └── Layout.tsx               # App shell (header, nav)
│   ├── contexts/
│   │   └── AuthContext.tsx          # Supabase auth state provider
│   ├── hooks/
│   │   ├── useSeasons.ts
│   │   ├── useProfiles.ts
│   │   ├── useDailyEntries.ts
│   │   └── useUserEntries.ts
│   ├── lib/
│   │   ├── supabase.ts             # Supabase client singleton
│   │   ├── api.ts                   # Data mutation functions (upsert, upload)
│   │   ├── imageCompress.ts         # Client-side image compression
│   │   └── pushNotifications.ts     # Push subscription management
│   ├── pages/
│   │   ├── MainPage.tsx             # Daily view with filters + user tiles
│   │   ├── EntryFormPage.tsx        # Wrapper for EntryForm with routing
│   │   ├── LoginPage.tsx
│   │   ├── SignUpPage.tsx
│   │   ├── ResetPasswordPage.tsx
│   │   └── ProfilePage.tsx          # Edit display name, avatar
│   ├── types.ts                     # All TypeScript interfaces
│   ├── App.tsx                      # Routes + AuthProvider
│   ├── main.tsx                     # Entry point
│   └── index.css                    # Tailwind import
├── .env.local                       # Local env vars (gitignored)
├── .gitignore
├── index.html
├── package.json
├── tsconfig.json
├── vite.config.ts
└── vercel.json                      # Rewrites + cron schedule
```

---

## Implementation Order for Claude Code

When a Claude Code instance receives this document, it should build in this order:

1. **Scaffold**: Vite + React + TS + Tailwind + deps
2. **Config**: `vite.config.ts`, `vercel.json`, `tsconfig.json`
3. **Types**: `src/types.ts`
4. **Supabase client**: `src/lib/supabase.ts`
5. **Auth**: `AuthContext.tsx`, `ProtectedRoute.tsx`, login/signup/reset pages
6. **Data hooks**: `useSeasons`, `useProfiles`, `useDailyEntries`, `useUserEntries`
7. **API functions**: `src/lib/api.ts`, `src/lib/imageCompress.ts`
8. **Layout + routing**: `App.tsx`, `Layout.tsx`
9. **Main page**: `MainPage.tsx`, `SeasonPicker.tsx`, `DateNavigator.tsx`
10. **User tiles**: `UserTile.tsx`
11. **Entry form**: `EntryForm.tsx`, `WaterBottle.tsx`, `EntryFormPage.tsx`
12. **Photo upload**: integrate into entry form
13. **Analytics**: `UserAnalytics.tsx` with Recharts
14. **Push notifications**: `sw.js`, `pushNotifications.ts`, `api/send-reminders.ts`
15. **Profile page**: `ProfilePage.tsx`
16. **PWA manifest**: `manifest.json`
17. **Final polish**: loading states, error handling, toasts

---

## Key Architectural Notes

- **No local DB / IndexedDB**: Unlike the cornhole app, this is a simple CRUD app. All data lives in Supabase. No offline-first pattern needed.
- **No sync complexity**: Direct Supabase queries. RLS handles authorization.
- **Realtime optional**: Can add Supabase Realtime subscription on `daily_entries` to see friends' updates live, but polling on page load is fine for MVP.
- **Photos are public within the app**: All authenticated users can see all photos. This is intentional (friends tracking together).
- **One entry per user per day per season**: Enforced by unique constraint. Upsert pattern for create-or-update.
- **Season management**: Done via Supabase dashboard/SQL for now (admin-only). No in-app season CRUD needed for MVP. Just a dropdown to select which season to view.
