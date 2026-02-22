# BreachCase — Authentication & User Accounts Master Plan

## Overview

This document outlines the full plan for adding user authentication, profiles, and user-powered features (commenting, saving breaches, watchlists) to BreachCase. The implementation uses **Supabase Auth** as the identity provider, with Google OAuth and email/password as sign-in methods.

### Design Principles

- **Supabase-native**: Leverage Supabase Auth, RLS, and Edge Functions — no custom auth server
- **Progressive enhancement**: Anonymous users keep full read access; logged-in users unlock extra features
- **Auth-ready foundation**: Build on the existing middleware stub, browser client, and `breach_views.user_id` column already in the codebase
- **Phased delivery**: Ship core auth first, then layer features on top incrementally

---

## Phase 1: Authentication Foundation

### 1.1 Sign-In Methods

| Method | Provider | Notes |
|--------|----------|-------|
| **Google OAuth** | Supabase Auth (Google provider) | One-click sign-in, avatar + name pulled from Google profile |
| **Email / Password** | Supabase Auth (email provider) | Registration form, email verification required, password reset flow |

**Supabase Dashboard setup required:**
- Enable Google OAuth provider (configure OAuth client ID + secret from Google Cloud Console)
- Enable email provider with "Confirm email" turned on
- Configure redirect URLs for local dev (`http://localhost:3000`) and production

### 1.2 New Package Dependencies

```
@supabase/ssr          # Server-side auth helpers for Next.js (replaces raw @supabase/supabase-js for auth)
```

This replaces the current plain `createClient` in `lib/supabase/client.ts` with auth-aware clients for both browser and server contexts.

### 1.3 Supabase Client Refactor

Replace the current singleton browser client with the `@supabase/ssr` pattern:

| File | Purpose |
|------|---------|
| `lib/supabase/client.ts` | **Rewrite** — Browser client using `createBrowserClient()` from `@supabase/ssr` |
| `lib/supabase/server.ts` | **Update** — Server client using `createServerClient()` with cookie handling for App Router |
| `lib/supabase/middleware.ts` | **New** — Auth session refresh logic, imported by `middleware.ts` |

### 1.4 Middleware Update

Update the existing `middleware.ts` stub to:
1. Refresh the Supabase auth session on every request (prevents stale tokens)
2. Protect routes that require authentication (`/profile`, `/settings`, `/admin`)
3. Redirect unauthenticated users to `/login`
4. Redirect authenticated users away from `/login` and `/register` (they're already signed in)

### 1.5 Auth Context Provider

Create an `AuthProvider` component (client component wrapping the app) that:
- Listens to `onAuthStateChange` events from Supabase
- Provides `user`, `session`, `loading`, `signOut()` via React Context
- Follows the same pattern as the existing `ThemeProvider`

Wrap the app in `layout.tsx`:
```
<ThemeProvider>
  <AuthProvider>
    {children}
  </AuthProvider>
</ThemeProvider>
```

---

## Phase 2: Database Schema

### 2.1 `profiles` Table

Extends `auth.users` (Supabase's built-in auth table) with application-specific fields.

| Column | Type | Notes |
|--------|------|-------|
| `id` | `uuid` PK | References `auth.users(id)` — same UUID |
| `display_name` | `text` | Shown in comments and profile |
| `avatar_url` | `text` | From Google profile or custom upload |
| `job_title` | `text` | Optional — e.g., "Security Analyst" |
| `company` | `text` | Optional — e.g., "Acme Corp" |
| `role` | `text` | `'user'` (default) or `'admin'` |
| `created_at` | `timestamptz` | Auto-set |
| `updated_at` | `timestamptz` | Auto-set via trigger |

**Auto-creation**: A Supabase database trigger on `auth.users` INSERT creates a `profiles` row automatically, pre-filling `display_name` and `avatar_url` from the OAuth metadata (for Google sign-ins) or from the registration form (for email sign-ups).

### 2.2 `saved_breaches` Table

| Column | Type | Notes |
|--------|------|-------|
| `id` | `uuid` PK | |
| `user_id` | `uuid` FK | References `profiles(id)` ON DELETE CASCADE |
| `breach_id` | `uuid` FK | References `breaches(id)` ON DELETE CASCADE |
| `created_at` | `timestamptz` | When the user saved it |

Unique constraint on `(user_id, breach_id)` — a user can only save a breach once.

### 2.3 `watchlists` Table

| Column | Type | Notes |
|--------|------|-------|
| `id` | `uuid` PK | |
| `user_id` | `uuid` FK | References `profiles(id)` ON DELETE CASCADE |
| `name` | `text` | User-defined label, e.g., "My Healthcare Alerts" |
| `filters` | `jsonb` | Stored filter criteria: `{ "industries": ["Healthcare"], "countries": ["US"], "threat_actors": ["LockBit"] }` |
| `created_at` | `timestamptz` | |
| `updated_at` | `timestamptz` | |

### 2.4 `comments` Table

| Column | Type | Notes |
|--------|------|-------|
| `id` | `uuid` PK | |
| `breach_id` | `uuid` FK | References `breaches(id)` ON DELETE CASCADE |
| `user_id` | `uuid` FK | References `profiles(id)` ON DELETE SET NULL |
| `parent_id` | `uuid` FK | References `comments(id)` — for threaded replies, NULL for top-level |
| `body` | `text` | Comment content (max 2000 chars, enforced via CHECK constraint) |
| `status` | `text` | `'visible'`, `'flagged'`, `'removed'` — default `'visible'` |
| `is_edited` | `boolean` | Default `false`, set to `true` on update |
| `created_at` | `timestamptz` | |
| `updated_at` | `timestamptz` | |

**ON DELETE SET NULL for `user_id`**: When a user deletes their account, their comments remain visible but show "Deleted User" (anonymization strategy).

### 2.5 Row Level Security (RLS) Policies

All new tables get RLS enabled. Core policies:

**`profiles`**:
- SELECT: Anyone can read any profile (public profiles for comment attribution)
- UPDATE: Users can only update their own profile (`auth.uid() = id`)
- DELETE: Users can only delete their own profile

**`saved_breaches`**:
- ALL operations: Users can only access their own saves (`auth.uid() = user_id`)

**`watchlists`**:
- ALL operations: Users can only access their own watchlists (`auth.uid() = user_id`)

**`comments`**:
- SELECT: Anyone can read comments where `status = 'visible'`
- INSERT: Authenticated users only, `user_id` must match `auth.uid()`
- UPDATE: Users can only edit their own comments (body + is_edited flag only)
- DELETE: Users can delete their own comments; admins can delete any

**`breach_views`** (existing table):
- UPDATE existing policy to populate `user_id` from `auth.uid()` when available

### 2.6 `breach_views.user_id` Integration

The existing `user_id` column in `breach_views` becomes functional:
- When a logged-in user views a breach, record their `user_id`
- Enables "Recently Viewed" on the profile page
- Enables personalized "Breaches you might be interested in" recommendations (future)

---

## Phase 3: Frontend — Auth Pages & Components

### 3.1 New Routes

| Route | Purpose | Auth Required |
|-------|---------|---------------|
| `/login` | Sign in (Google button + email/password form) | No (redirect if already signed in) |
| `/register` | Create account (Google button + email/password form) | No (redirect if already signed in) |
| `/forgot-password` | Request password reset email | No |
| `/reset-password` | Set new password (from email link) | No (token-based) |
| `/profile` | View/edit own profile, saved breaches, watchlists | Yes |
| `/profile/[id]` | View another user's public profile (display name, avatar, comment history) | No |
| `/settings` | Account settings (change password, delete account) | Yes |
| `/admin` | Moderation dashboard (comments queue, user management) | Yes (admin role only) |

### 3.2 New Components

**Auth components** (`components/auth/`):
- `LoginForm` — Email/password input + submit + "Forgot password?" link
- `RegisterForm` — Email/password + display name input + submit
- `GoogleSignInButton` — Styled "Continue with Google" button, triggers `supabase.auth.signInWithOAuth({ provider: 'google' })`
- `AuthGuard` — Wrapper component that redirects to `/login` if unauthenticated (for client-side protection on top of middleware)
- `UserMenu` — Dropdown in the header showing avatar + name, with links to Profile, Settings, Sign Out

**Profile components** (`components/profile/`):
- `ProfileHeader` — Avatar, display name, job title, company, join date
- `ProfileEditForm` — Edit display name, job title, company, avatar
- `SavedBreachesList` — Grid of saved breach cards with unsave button
- `WatchlistManager` — CRUD interface for watchlists (name + filter builder)
- `RecentlyViewed` — List of recently viewed breaches (from `breach_views`)

**Comment components** (`components/comments/`):
- `CommentSection` — Container that loads and displays comments for a breach
- `CommentCard` — Single comment: avatar, name, timestamp, body, reply button, edit/delete (if own)
- `CommentInput` — Text area with submit button, character counter (2000 char limit)
- `CommentThread` — Indented reply chain (one level of nesting only, to keep UI clean)

**Admin components** (`components/admin/`):
- `CommentModerationQueue` — List of flagged comments with approve/remove actions
- `UserManagementTable` — List of users with role assignment and account actions

### 3.3 Header Integration

Update the existing site header/navbar:
- **Signed out**: Show "Sign In" button (links to `/login`)
- **Signed in**: Show `UserMenu` dropdown (avatar + name) with links to Profile, Settings, Admin (if admin), Sign Out

### 3.4 Breach Detail Page Updates

Add to the existing breach detail page (`/breach/[id]`):
- **Save button**: Heart/bookmark icon in the breach header area — toggles save/unsave
- **Comment section**: Below the existing content sections, above Related Breaches
- **View tracking**: Record `user_id` in `breach_views` when logged in

### 3.5 Search Page Updates

- **"Save as Watchlist" button**: When the user has active filters applied, show a button to save the current filter combination as a named watchlist (requires login)

---

## Phase 4: Commenting System with Auto-Moderation

### 4.1 Comment Flow

1. User writes comment in `CommentInput` (max 2000 chars)
2. On submit, client-side runs **auto-moderation checks**:
   - Spam detection: reject if body is empty, all caps, or contains excessive URLs (>3 links)
   - Length filter: reject if under 5 characters
   - Rate limiting: max 5 comments per user per 10-minute window (enforced via RLS or database function)
3. If auto-mod passes → insert with `status = 'visible'` (appears immediately)
4. If auto-mod flags → insert with `status = 'flagged'` (hidden, enters moderation queue)

### 4.2 Moderation Features

- **Report button**: Any logged-in user can report a comment (updates status to `'flagged'`)
- **Admin queue** (`/admin`): Shows all flagged comments with:
  - Comment body + context (which breach, who wrote it)
  - "Approve" (set to `'visible'`) or "Remove" (set to `'removed'`) buttons
- **Removed comments**: Show as "[This comment has been removed by a moderator]" in the thread

### 4.3 Comment Editing

- Users can edit their own comments within 15 minutes of posting
- Edited comments show an "(edited)" indicator
- Edit history is not stored (keeps schema simple; the `is_edited` flag is sufficient)

---

## Phase 5: User Roles & Admin

### 5.1 Role System

Two roles stored in `profiles.role`:

| Role | Permissions |
|------|-------------|
| `user` | Default. Comment, save breaches, create watchlists, edit own profile |
| `admin` | Everything above + access `/admin`, moderate comments, manage users, assign roles |

Role checks:
- **Middleware level**: `/admin` route blocked for non-admins
- **RLS level**: Delete-any-comment policy checks for admin role
- **UI level**: Admin nav link only shown to admin users

### 5.2 Admin Dashboard (`/admin`)

Minimal admin panel with:
- **Flagged comments queue**: Review and action flagged comments
- **User list**: View all users, change roles, deactivate accounts
- **Basic stats**: Total users, comments today, flagged comments count

### 5.3 First Admin

The very first admin is created manually by updating the `profiles.role` column directly in Supabase Dashboard. Subsequent admins can be promoted from the admin panel.

---

## Phase 6: Account Management

### 6.1 Settings Page (`/settings`)

- **Change password** (email/password users only)
- **Link/unlink Google account** (allow users to add Google sign-in to an email account)
- **Delete account**: Confirmation modal explaining what will happen:
  - Profile, saved breaches, watchlists, and view history are permanently deleted
  - Comments are anonymized (show "Deleted User")
  - Action is irreversible

### 6.2 Account Deletion Flow

1. User clicks "Delete Account" → confirmation modal with typed confirmation (e.g., type "DELETE")
2. Database function triggered:
   - Set `comments.user_id = NULL` for all user's comments (anonymize)
   - Delete from `saved_breaches`, `watchlists`, `breach_views` (CASCADE handles this)
   - Delete from `profiles` (CASCADE from auth.users)
   - Call `supabase.auth.admin.deleteUser(userId)` to remove from `auth.users`
3. User is signed out and redirected to homepage

---

## Implementation Order

The phases above describe the feature areas. The recommended **build order** is:

| Step | What | Depends On | Estimate |
|------|------|------------|----------|
| **1** | Supabase Auth config (Google + email providers, redirect URLs) | Nothing | Config only |
| **2** | Install `@supabase/ssr`, refactor Supabase clients | Step 1 |  |
| **3** | Middleware auth session refresh | Step 2 |  |
| **4** | `AuthProvider` context + `UserMenu` in header | Step 3 |  |
| **5** | `/login` + `/register` pages (Google + email/password) | Step 4 |  |
| **6** | `/forgot-password` + `/reset-password` pages | Step 5 |  |
| **7** | `profiles` table + auto-creation trigger + RLS | Step 1 |  |
| **8** | `/profile` page (view + edit) | Steps 4, 7 |  |
| **9** | `/settings` page (change password, delete account) | Step 8 |  |
| **10** | `saved_breaches` table + RLS | Step 7 |  |
| **11** | Save/unsave button on breach detail page | Steps 4, 10 |  |
| **12** | `watchlists` table + RLS | Step 7 |  |
| **13** | Watchlist manager on profile page + "Save as Watchlist" on search | Steps 8, 12 |  |
| **14** | `comments` table + RLS | Step 7 |  |
| **15** | Comment section on breach detail page | Steps 4, 14 |  |
| **16** | Auto-moderation logic (client-side + rate limiting) | Step 15 |  |
| **17** | Admin role check in middleware + RLS | Step 7 |  |
| **18** | `/admin` moderation dashboard | Steps 16, 17 |  |
| **19** | `breach_views.user_id` integration | Step 4 |  |
| **20** | Recently viewed on profile page | Steps 8, 19 |  |

Steps 1-6 deliver a working login/register system. Steps 7-9 add profiles. Steps 10-13 add save/watchlist. Steps 14-18 add commenting with moderation. Steps 19-20 wire up view tracking.

---

## Future Extensions (Not in This Plan)

These are noted for awareness but **explicitly out of scope** for this plan:

- **Email notifications** for watchlists and saved breach updates (separate project, likely Supabase Edge Functions + a transactional email service like Resend)
- **Browse history-based recommendations** ("Breaches you might be interested in")
- **OAuth providers beyond Google** (GitHub, Microsoft — can be added trivially in Supabase Dashboard)
- **Two-factor authentication (2FA)** — Supabase Auth supports TOTP, can be enabled later
- **REST API authentication** for external access
- **Public user profiles with comment history** (the schema supports it; the UI can be added later)

---

## Key Technical Decisions Summary

| Decision | Choice | Reasoning |
|----------|--------|-----------|
| Auth provider | Supabase Auth | Already using Supabase; zero additional infrastructure |
| Session management | `@supabase/ssr` with cookie-based sessions | Works with Next.js App Router SSR; no client-side token juggling |
| Profile storage | Separate `profiles` table linked to `auth.users` | Keeps app data separate from auth internals; easy to extend |
| Comment deletion on account delete | Anonymize (`user_id` set to NULL) | Preserves discussion threads; respects user's right to delete |
| Comment nesting | Single level only | Keeps UI clean; deep threads add complexity with little value |
| Moderation model | Auto-mod (spam/length/rate) + manual queue | Balance between user experience (instant posting) and safety |
| Role system | Two roles (`user`, `admin`) in `profiles.role` | Simple; avoids RBAC complexity. Power users can be added later if needed |
| Watchlist storage | JSONB filter object | Flexible; mirrors the existing search/filter system; no schema migration needed when filters change |
