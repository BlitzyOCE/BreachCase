import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createServerClient } from "@/lib/supabase/server";
import { getRecentlyViewed } from "@/lib/queries/breach-views-server";
import { getAllTagCounts } from "@/lib/queries/tags";
import { Separator } from "@/components/ui/separator";
import { WatchlistTabs } from "@/components/my-breachcase/watchlist-tabs";
import { SavedBreachesSection } from "@/components/my-breachcase/saved-breaches-section";
import { RecentlyViewed } from "@/components/profile/recently-viewed";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { ChevronDown } from "lucide-react";

export const metadata: Metadata = {
  title: "My Breachcase",
  description: "Your personalized breach intelligence hub.",
};

export default async function MyBreachcasePage() {
  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login?redirectTo=/my-breachcase");

  const [tagCounts, recentlyViewed] = await Promise.all([
    getAllTagCounts(),
    getRecentlyViewed(user.id, 10),
  ]);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">My Breachcase</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Your personalized breach intelligence hub.
        </p>
      </div>

      {/* Watchlists */}
      <section>
        <WatchlistTabs
          industryCounts={tagCounts.industry ?? []}
          countryCounts={tagCounts.country ?? []}
          attackVectorCounts={tagCounts.attack_vector ?? []}
          threatActorCounts={tagCounts.threat_actor ?? []}
        />
      </section>

      <Separator />

      {/* Saved Breaches */}
      <section>
        <SavedBreachesSection />
      </section>

      <Separator />

      {/* Recently Viewed */}
      <section>
        <Collapsible defaultOpen>
          <CollapsibleTrigger className="group flex w-full items-center justify-between py-3">
            <h2 className="text-lg font-semibold">
              Recently Viewed
              {recentlyViewed.length > 0 && (
                <span className="ml-2 text-sm font-normal text-muted-foreground">
                  ({recentlyViewed.length})
                </span>
              )}
            </h2>
            <ChevronDown className="h-5 w-5 text-muted-foreground transition-transform group-data-[state=open]:rotate-180" />
          </CollapsibleTrigger>
          <CollapsibleContent>
            <RecentlyViewed breaches={recentlyViewed} />
          </CollapsibleContent>
        </Collapsible>
      </section>
    </div>
  );
}
