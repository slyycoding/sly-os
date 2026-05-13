# Sly OS — Personal Life Operating System

A full-stack personal productivity app built with Next.js 14, Supabase, Tailwind CSS, and shadcn/ui.

## Quick Start

### 1. Install dependencies
```bash
cd sly-os
npm install
```

### 2. Set up Supabase
1. Create a project at [supabase.com](https://supabase.com)
2. Go to **SQL Editor** and run the contents of `supabase/migrations/001_initial.sql`
3. Optionally run `supabase/seed.sql` (replace `YOUR_USER_ID` with your actual user ID first)

### 3. Configure environment
```bash
cp .env.local.example .env.local
```
Fill in your Supabase URL and anon key from the Supabase project settings.

### 4. Run locally
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) — you'll be redirected to `/login`.

### 5. Deploy to Vercel
```bash
vercel deploy
```
Add `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` to your Vercel environment variables.

---

## Modules

| Module | Path | Description |
|---|---|---|
| Dashboard | `/` | Overview widgets for everything |
| Tasks | `/tasks` | Daily to-do list with priority, status, tags |
| Calendar | `/calendar` | Week/month view with events |
| Projects | `/projects` | Project tracker with milestones and logs |
| Notes | `/notes` | Searchable notes with categories and pins |
| Gym Log | `/gym` | Workout sessions and exercise tracking |
| Skincare | `/skincare` | AM/PM routines and skin condition logs |
| Products | `/products` | Track everything you use |
| Finance | `/finance` | Income, expenses, bills, subscriptions, debt, savings |
| Habits | `/habits` | Daily habit tracker with streaks |
| Goals | `/goals` | Daily/weekly/monthly/yearly goal tracking |
| Learning | `/learning` | Study roadmap with Kanban, list, and session views |
| Health | `/health` | Sleep, mood, energy, weight, nutrition |
| Reminders | `/reminders` | Bills, subscriptions, product expiry, and more |
| Search | `/search` | Global search across all modules |
| Settings | `/settings` | Profile, password, and account settings |

## Tech Stack

- **Framework:** Next.js 14 App Router
- **Language:** TypeScript
- **Database & Auth:** Supabase (PostgreSQL, Row Level Security)
- **Styling:** Tailwind CSS
- **Components:** shadcn/ui + Radix UI
- **Icons:** Lucide React
- **Date utils:** date-fns

## Design

- Dark mode first (black/charcoal/grey with red accents)
- Desktop: collapsible sidebar navigation
- Mobile: bottom tab navigation
- Quick Add modal for tasks, notes, expenses, and health logs
