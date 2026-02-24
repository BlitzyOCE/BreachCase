"use server";

import { getFilteredBreaches } from "@/lib/queries/breaches";
import type { WatchlistFilters } from "@/types/database";
import type { BreachSummary } from "@/types/database";

// NOTE: This server action is no longer used by WatchlistTabs.
// The API route /api/watchlist-feed is used instead.
// Kept in case it is useful elsewhere.
export async function executeWatchlistFilters(
  filters: WatchlistFilters,
  page = 1
): Promise<{ data: BreachSummary[]; count: number }> {
  return getFilteredBreaches({
    query: filters.query,
    industry: filters.industries,
    country: filters.countries,
    attackVector: filters.attack_vectors,
    threatActor: filters.threat_actors,
    page,
  });
}
