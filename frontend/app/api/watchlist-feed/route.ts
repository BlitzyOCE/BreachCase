import { type NextRequest, NextResponse } from "next/server";
import { getFilteredBreaches } from "@/lib/queries/breaches";
import type { WatchlistFilters } from "@/types/database";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const filters: WatchlistFilters = body.filters ?? {};
    const page: number = body.page ?? 1;

    const result = await getFilteredBreaches({
      query: filters.query,
      industry: filters.industries,
      country: filters.countries,
      attackVector: filters.attack_vectors,
      threatActor: filters.threat_actors,
      page,
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("[watchlist-feed] error:", error);
    return NextResponse.json({ data: [], count: 0 }, { status: 500 });
  }
}
