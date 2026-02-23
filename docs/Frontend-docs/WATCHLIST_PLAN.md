# My Breachcase -- Watchlist & Saved Breaches Restructure

## Overview

**Current state:** Watchlists and saved breaches live inside `/profile` as simple CRUD cards. Watchlists store a name and a JSONB filter object but never execute those filters -- there is no feed, no match count, no live results. Saved breaches are a flat grid with no integration into a broader workflow. Recently Viewed is also buried on the profile page.

**Goal:** Create a dedicated `/my-breachcase` page that serves as the user's personalized breach intelligence hub. Watchlists become functional -- users build filter conditions and get live breach feeds. Saved breaches and recently viewed are relocated here. The profile page becomes a pure account/settings page.

---

## Phase 1: Page & Navigation

### 1.1 Route setup

Create `frontend/app/my-breachcase/page.tsx` as a protected server component.

Add `/my-breachcase` to the `protectedRoutes` array in `frontend/middleware.ts`:

```ts
const protectedRoutes = ["/profile", "/settings", "/admin", "/my-breachcase"];
```

Unauthenticated users who click the link get redirected to `/login?redirectTo=/my-breachcase` (existing middleware behavior).

### 1.2 Navigation links

Add "My Breachcase" between Search and About in both navigation components. The link is always visible to all users (auth and unauth).

**`frontend/components/layout/header.tsx`** -- add link after Search:

```tsx
<Link href="/my-breachcase" className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">
  My Breachcase
</Link>
```

**`frontend/components/layout/mobile-nav.tsx`** -- add the same link in the mobile navigation list between Search and About.

### 1.3 Page skeleton

The page has three collapsible sections, top to bottom:

```
/my-breachcase
+-----------------------------------------------+
|  Watchlists (tabbed interface)                 |
|  [All Saved] [Watchlist 1] [Watchlist 2] [+]  |
|  +-----------------------------------------+  |
|  |  Breach card grid (filtered results)    |  |
|  |  matching the active watchlist's filters |  |
|  +-----------------------------------------+  |
+-----------------------------------------------+
|  Saved Breaches                                |
|  Grid of bookmarked breach cards               |
+-----------------------------------------------+
|  Recently Viewed                               |
|  List of recently visited breach items         |
+-----------------------------------------------+
```

### 1.4 Files to create/modify

| File | Action |
|------|--------|
| `frontend/app/my-breachcase/page.tsx` | Create -- page component |
| `frontend/app/my-breachcase/loading.tsx` | Create -- loading skeleton |
| `frontend/middleware.ts` | Modify -- add to protectedRoutes |
| `frontend/components/layout/header.tsx` | Modify -- add nav link |
| `frontend/components/layout/mobile-nav.tsx` | Modify -- add nav link |

### 1.5 Verify

- Navigate to `/my-breachcase` while logged out -- should redirect to `/login?redirectTo=/my-breachcase`
- Nav link appears between Search and About on desktop and mobile
- Page renders with empty sections and skeleton layout

---

## Phase 2: Watchlist Engine

### 2.1 Condition builder component

Create `frontend/components/my-breachcase/watchlist-condition-builder.tsx` -- a dialog/form for creating and editing watchlists with full filter conditions.

**Fields:**

| Field | Input type | Source |
|-------|-----------|--------|
| Name | Text input | User-provided |
| Keyword query | Text input | Free text |
| Industries | Multi-select checkboxes | `getTagCounts("industry")` |
| Countries | Multi-select checkboxes | `getTagCounts("country")` |
| Attack vectors | Multi-select checkboxes | `getTagCounts("attack_vector")` |
| Threat actors | Multi-select checkboxes | `getTagCounts("threat_actor")` |

The condition builder reuses the same tag data that powers `FilterSidebar` on the search page. Tag counts are fetched via `getAllTagCounts()` from `frontend/lib/queries/tags.ts` and passed as props.

**Data storage:** Filters are stored in the existing `watchlists.filters` JSONB column. No schema changes are needed -- the `WatchlistFilters` type already supports all fields:

```ts
interface WatchlistFilters {
  query?: string;
  industries?: string[];
  countries?: string[];
  attack_vectors?: string[];
  threat_actors?: string[];
}
```

### 2.2 Watchlist tabs component

Create `frontend/components/my-breachcase/watchlist-tabs.tsx` -- client component managing the tabbed watchlist interface.

**Behavior:**

- Fetches user's watchlists via `getWatchlists(userId)` from `frontend/lib/queries/watchlists.ts`
- Renders one tab per watchlist, plus a "+" button to create a new one
- Active tab displays a grid of `BreachCard` components matching the watchlist's filters
- Each tab shows a badge with the match count

**Feed execution:** When a tab becomes active, call a new query function `executeWatchlistFilters(filters: WatchlistFilters)` that wraps `getFilteredBreaches()` from `frontend/lib/queries/breaches.ts`, translating `WatchlistFilters` field names to `FilterOptions` field names:

```ts
// frontend/lib/queries/watchlists.ts (new function)
export async function executeWatchlistFilters(
  filters: WatchlistFilters,
  page = 1
): Promise<{ data: BreachSummary[]; count: number }> {
  // Client-side call to a server action or API route that calls getFilteredBreaches
  // mapping: filters.industries -> industry, filters.countries -> country, etc.
}
```

Since `getFilteredBreaches()` uses `createServerClient()` (server-only), the watchlist tab needs either:
- **Option A:** A server action that accepts `WatchlistFilters` + page and returns results
- **Option B:** An API route (`/api/watchlist-feed`) that the client calls

Recommend **Option A** (server action) -- simpler, no new API route, works with existing Supabase server client pattern.

**Tab actions (per watchlist):**
- Edit button -- opens condition builder pre-filled with current filters
- Delete button -- confirmation dialog, then calls `deleteWatchlist(id)`

### 2.3 Empty state

When a user has no watchlists, show an onboarding prompt:

```
No watchlists yet.
Create a watchlist to track breaches matching specific conditions --
by industry, country, attack type, or keyword.

[Create Your First Watchlist]
```

### 2.4 Files to create/modify

| File | Action |
|------|--------|
| `frontend/components/my-breachcase/watchlist-tabs.tsx` | Create -- tabbed watchlist UI |
| `frontend/components/my-breachcase/watchlist-condition-builder.tsx` | Create -- filter condition form |
| `frontend/lib/queries/watchlists.ts` | Modify -- add `executeWatchlistFilters()` |
| `frontend/lib/actions/watchlist-feed.ts` | Create -- server action for executing filters |
| `frontend/app/my-breachcase/page.tsx` | Modify -- integrate watchlist tabs |

### 2.5 Verify

- Create a watchlist with industry = "Technology" -- tab shows only tech breaches
- Edit the watchlist, add country = "United States" -- results narrow
- Badge count matches the number of results
- Delete a watchlist -- tab disappears
- Create from search page "Save as Watchlist" -- appears as new tab on My Breachcase

---

## Phase 3: Card Save & Profile Cleanup

### 3.1 Save button on BreachCard

Add a bookmark icon to `frontend/components/breach/breach-card.tsx`. Since BreachCard is currently a simple server-rendered link, the save button needs to be a client component overlay.

**Approach:** Create a small `SaveBreachButton` client component that renders as an icon in the card's top-right corner. It:
- Checks auth state via `useAuth()`
- If not authenticated: clicking opens a tooltip/toast "Sign in to save breaches"
- If authenticated: toggles save state via `saveBreach()` / `unsaveBreach()` from `frontend/lib/queries/saved-breaches.ts`
- Renders filled/unfilled bookmark icon based on save state

**Save state loading:** To know which breaches are already saved, the My Breachcase page and search page need to pass a `Set<string>` of saved breach IDs. Add a query:

```ts
// frontend/lib/queries/saved-breaches.ts (new function)
export async function getSavedBreachIds(userId: string): Promise<Set<string>> {
  // SELECT breach_id FROM saved_breaches WHERE user_id = ?
}
```

Pass this set as context or props to BreachCard grids.

### 3.2 Saved breaches section

Relocate the saved breaches display from profile to My Breachcase. The existing `SavedBreachesList` component in `frontend/components/profile/saved-breaches-list.tsx` can be moved to `frontend/components/my-breachcase/saved-breaches-section.tsx` (or kept in place and imported from the new page).

### 3.3 Recently Viewed section

Relocate from profile. The existing `RecentlyViewed` component in `frontend/components/profile/recently-viewed.tsx` can be reused directly -- it accepts `breaches` as a prop. The server data fetch (`getRecentlyViewed`) moves from the profile page to the My Breachcase page.

### 3.4 Profile page cleanup

Remove from `frontend/app/profile/page.tsx`:
- Saved Breaches card
- Watchlists card
- Recently Viewed card
- Associated imports (`SavedBreachesList`, `WatchlistManager`, `RecentlyViewed`, `getRecentlyViewed`)

Profile page retains:
- `ProfileHeader`
- `ProfileEditForm` (Edit Profile card)

### 3.5 Files to create/modify

| File | Action |
|------|--------|
| `frontend/components/breach/breach-card.tsx` | Modify -- add save button overlay |
| `frontend/components/breach/save-breach-button.tsx` | Create -- client component for bookmark toggle |
| `frontend/lib/queries/saved-breaches.ts` | Modify -- add `getSavedBreachIds()` |
| `frontend/components/my-breachcase/saved-breaches-section.tsx` | Create or move -- saved breaches for My Breachcase |
| `frontend/app/my-breachcase/page.tsx` | Modify -- add saved breaches + recently viewed sections |
| `frontend/app/profile/page.tsx` | Modify -- remove watchlist/saved/recent cards |

### 3.6 Verify

- Save a breach from its card on the search page -- bookmark icon fills
- Navigate to My Breachcase -- saved breach appears in Saved Breaches section
- Unsave from My Breachcase -- card disappears
- View several breaches -- Recently Viewed populates on My Breachcase
- Profile page shows only header + edit form, no breach-related sections

---

## Database Changes

**None required.** The existing schema supports everything:

- `watchlists` table with JSONB `filters` column already stores `WatchlistFilters`
- `saved_breaches` table with `(user_id, breach_id)` unique constraint
- `breach_views` table for recently viewed tracking
- `WatchlistFilters` TypeScript type already has all needed fields

---

## Full File Summary

### New files

| File | Purpose |
|------|---------|
| `frontend/app/my-breachcase/page.tsx` | My Breachcase page |
| `frontend/app/my-breachcase/loading.tsx` | Loading skeleton |
| `frontend/components/my-breachcase/watchlist-tabs.tsx` | Tabbed watchlist interface |
| `frontend/components/my-breachcase/watchlist-condition-builder.tsx` | Filter condition builder dialog |
| `frontend/components/my-breachcase/saved-breaches-section.tsx` | Saved breaches section |
| `frontend/components/breach/save-breach-button.tsx` | Bookmark toggle for breach cards |
| `frontend/lib/actions/watchlist-feed.ts` | Server action for watchlist feed execution |

### Modified files

| File | Change |
|------|--------|
| `frontend/middleware.ts` | Add `/my-breachcase` to protectedRoutes |
| `frontend/components/layout/header.tsx` | Add My Breachcase nav link |
| `frontend/components/layout/mobile-nav.tsx` | Add My Breachcase nav link |
| `frontend/components/breach/breach-card.tsx` | Add save button overlay |
| `frontend/lib/queries/watchlists.ts` | Add `executeWatchlistFilters()` |
| `frontend/lib/queries/saved-breaches.ts` | Add `getSavedBreachIds()` |
| `frontend/app/profile/page.tsx` | Remove watchlist/saved/recent sections |

### Unchanged files (reused as-is)

| File | Reused for |
|------|-----------|
| `frontend/lib/queries/breaches.ts` | `getFilteredBreaches()` powers watchlist feeds |
| `frontend/lib/queries/tags.ts` | `getAllTagCounts()` powers condition builder dropdowns |
| `frontend/components/profile/recently-viewed.tsx` | Imported directly into My Breachcase page |
| `frontend/types/database.ts` | `Watchlist`, `WatchlistFilters` types already sufficient |

---

## Build Order

```
Phase 1: Page & Navigation
  |
  v
Phase 2: Watchlist Engine
  |
  v
Phase 3: Card Save & Profile Cleanup
```

Each phase is independently testable. Phase 1 can ship as a skeleton. Phase 2 delivers the core value. Phase 3 is polish and cleanup.
