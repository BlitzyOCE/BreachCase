# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

BreachCase - AI-powered data breach intelligence platform. RSS feeds are scraped, classified and extracted by DeepSeek AI, stored in Supabase (PostgreSQL), and displayed via a Next.js frontend. Breaches are "living stories" - new articles about the same incident are detected and appended as timeline updates rather than creating duplicates.

## Architecture

```
RSS Feeds (8 sources)
  -> feed_parser.py (parallel fetch via ThreadPoolExecutor)
  -> cache_manager.py (skip already-processed URLs via processed_ids.txt)
  -> ai_processor.py (4 AI stages: classify -> extract -> detect update -> decide new/update/duplicate)
  -> db_writer.py (write to Supabase)
  -> Supabase (PostgreSQL + Auth + Storage)
  <- Next.js frontend (App Router, SSR + client components)
```

### Scraper (`scraper/`)

Pipeline in `main.py` processes articles through 4 AI sub-stages:
1. **Classify** - Is this article about a data breach? (confidence threshold)
2. **Extract** - Pull structured data (company, severity, records, attack vector, CVEs, MITRE techniques, etc.)
3. **Detect update** - Fuzzy match (`difflib.SequenceMatcher`) + AI classification as NEW_BREACH / GENUINE_UPDATE / DUPLICATE_SOURCE
4. **DB write** - Insert new breach or append update; duplicates discarded

Config in `config.py` - all settings are env-overridable. Uses OpenAI-compatible SDK pointed at DeepSeek API.

8 RSS sources: BleepingComputer, The Hacker News, DataBreachToday, Krebs on Security, HelpNet Security, NCSC UK, Check Point Research, Have I Been Pwned.

### Frontend (`frontend/`)

Next.js 16 + React 19 + Supabase SSR + shadcn/ui (Radix) + Tailwind v4. Path alias `@/*` maps to `frontend/`.

**Auth**: Supabase Auth with SSR pattern. Three client types in `lib/supabase/`: browser (`client.ts`), server (`server.ts`, cookie-aware), admin (`admin.ts`, service role key). Google OAuth supported. `middleware.ts` protects routes (`/profile`, `/settings`, `/admin`, `/my-breachcase`) and redirects authenticated users away from auth pages. `AuthProvider` context in `components/auth/auth-provider.tsx` exposes user/session/profile state app-wide.

**Key pages**: home (breach list), `/breach/[id]` (detail + timeline + comments), `/search` (filters + saved watchlists), `/my-breachcase` (saved breaches + watchlist condition builder), `/profile`, `/settings`, `/admin` (comment moderation, user management), `/about`, auth flows (`/login`, `/register`, `/forgot-password`, `/reset-password`).

**Data layer**: `lib/queries/` contains all Supabase query functions. Frontend reads from a `breach_summary` DB view. Two RPC functions: `search_breaches(search_query)` and `get_related_breaches(breach_uuid, max_results)`.

**API routes**: `POST /api/account/delete` (account deletion via admin client), `POST /api/watchlist-feed` (filtered breach feed for watchlists).

### Database (`database/`)

PostgreSQL on Supabase. Schema in `current_db.sql`. 9 tables:
- Core: `breaches`, `breach_updates`, `breach_tags`, `sources`, `company_aliases`, `breach_views`
- User: `profiles` (FK to `auth.users`, roles: user/admin), `saved_breaches`, `watchlists` (filters stored as JSONB), `comments` (threaded, with moderation status)

`breaches` has a `search_vector` (tsvector) column for full-text search.

## Commands

```bash
# Scraper
cd scraper && python main.py           # Run full scraper pipeline
cd scraper && python audit.py          # Audit DB (flags: --duplicates, --csv)
cd scraper && python test_scraper.py   # Test scraper against sample articles

# Frontend
cd frontend && npm run dev             # Dev server (localhost:3000)
cd frontend && npm run build           # Production build
cd frontend && npx next lint           # Run ESLint (ESLint 9, core-web-vitals + TS rules)
```

No test framework is configured for either frontend or scraper. No CI/CD pipeline exists.

## Key Config

**Scraper `.env`**: `DEEPSEEK_API_KEY`, `DEEPSEEK_BASE_URL` (default: `https://api.deepseek.com/v1`), `DEEPSEEK_MODEL` (default: `deepseek-chat`), `SUPABASE_URL`, `SUPABASE_KEY`, `ARTICLE_LOOKBACK_HOURS` (48), `FUZZY_MATCH_THRESHOLD` (0.85), `CLASSIFICATION_CONFIDENCE_THRESHOLD` (0.6), `MAX_FEED_WORKERS` (10), `MAX_EXISTING_BREACHES_FETCH` (100).

**Frontend `.env.local`**: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` (required for admin client / account deletion).

## Conventions

- Supabase client creation: use `createBrowserClient()` in client components, `createServerClient()` in server components/route handlers, `createAdminClient()` only for privileged operations
- UI components: shadcn/ui primitives in `components/ui/`, domain components organized by feature (`breach/`, `auth/`, `comments/`, `search/`, `my-breachcase/`, `admin/`, `profile/`, `settings/`, `layout/`)
- Types in `frontend/types/database.ts` mirror DB schema - keep in sync when schema changes
- Fonts: Plus Jakarta Sans (body), Lora (serif), Roboto Mono (mono) - loaded in `app/layout.tsx`
- Theme: `next-themes` with dark/light/system support via `ThemeProvider`

## Logs

`scraper/logs/scraper_YYYY-MM-DD.log` (debug level), `errors_YYYY-MM-DD.log` (errors only).
