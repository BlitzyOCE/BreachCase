# Authentication — Build Stages

The full auth plan (AUTH_PLAN.md, Phases 1-6, 20 steps) is split into 5 independent builds. Each build delivers a testable milestone — verify it works before moving to the next.

---

## Build 1: Login & Registration

**Steps 2-6 from AUTH_PLAN.md**

| What | Details |
|------|---------|
| Install `@supabase/ssr` | Replace raw Supabase clients with auth-aware SSR pattern |
| Refactor Supabase clients | `client.ts` (browser), `server.ts` (server + cookies), new `middleware.ts` helper |
| Middleware auth logic | Session refresh on every request, route protection, auth redirects |
| AuthProvider context | Client-side auth state (`user`, `session`, `loading`, `signOut`) |
| Header integration | Sign In button (logged out) / User menu dropdown (logged in) |
| Auth pages | `/login`, `/register`, `/forgot-password`, `/reset-password` |

**Prerequisite:** Supabase Dashboard configured (see SUPABASE_SETUP.md)

**Verify by:** Sign in with Google, sign in with email/password, sign out, password reset flow, route protection works

---

## Build 2: Profiles & Settings

**Steps 7-9 from AUTH_PLAN.md**

| What | Details |
|------|---------|
| `profiles` table + RLS | SQL migration: table, auto-creation trigger on `auth.users` INSERT, RLS policies |
| `/profile` page | View/edit own profile (display name, avatar, job title, company) |
| `/settings` page | Change password, delete account with confirmation |
| Account deletion flow | Anonymize comments, cascade deletes, remove from `auth.users` |

**Prerequisite:** Build 1 complete

**Verify by:** Sign up → profile auto-created, edit profile fields, change password, delete account

---

## Build 3: Save Breaches & Watchlists

**Steps 10-13 from AUTH_PLAN.md**

| What | Details |
|------|---------|
| `saved_breaches` table + RLS | SQL migration with unique constraint on (user_id, breach_id) |
| Save/unsave button | Bookmark icon on breach detail page, toggles save state |
| `watchlists` table + RLS | SQL migration with JSONB filter storage |
| Watchlist manager | CRUD on profile page + "Save as Watchlist" button on search page |
| Saved breaches list | Grid of saved breach cards on profile page |

**Prerequisite:** Build 2 complete

**Verify by:** Save a breach, see it on profile, unsave it, create watchlist from search filters

---

## Build 4: Comments & Moderation

**Steps 14-18 from AUTH_PLAN.md**

| What | Details |
|------|---------|
| `comments` table + RLS | SQL migration with threading (parent_id), status field, character limit |
| Comment section | On breach detail page: comment list, input form, reply threading (1 level) |
| Auto-moderation | Spam detection, length filter, rate limiting (5 per 10 min) |
| Report button | Any logged-in user can flag a comment |
| Admin role check | Middleware + RLS for admin-only routes |
| `/admin` dashboard | Flagged comments queue, user management, basic stats |

**Prerequisite:** Build 2 complete (Build 3 is independent — can be done in parallel)

**Verify by:** Post a comment, reply to it, edit it, report one, review flagged comment as admin

---

## Build 5: View Tracking

**Steps 19-20 from AUTH_PLAN.md**

| What | Details |
|------|---------|
| `breach_views.user_id` integration | Record authenticated user ID when viewing a breach |
| Recently Viewed on profile | List of recently viewed breaches pulled from `breach_views` |

**Prerequisite:** Build 2 complete

**Verify by:** View breaches while logged in, check "Recently Viewed" section on profile

---

## Dependency Graph

```
Build 1 (Auth Foundation)
  └── Build 2 (Profiles & Settings)
        ├── Build 3 (Save & Watchlists)
        ├── Build 4 (Comments & Moderation)
        └── Build 5 (View Tracking)
```

Builds 3, 4, and 5 are independent of each other and can be done in any order after Build 2.
