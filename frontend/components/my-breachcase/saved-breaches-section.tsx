"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Bookmark, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SeverityBadge } from "@/components/ui/severity-badge";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { ChevronDown } from "lucide-react";
import { useAuth } from "@/components/auth/auth-provider";
import { getSavedBreaches, unsaveBreach } from "@/lib/queries/saved-breaches";
import type { BreachSummary } from "@/types/database";

export function SavedBreachesSection() {
  const { user } = useAuth();
  const [breaches, setBreaches] = useState<(BreachSummary & { saved_at: string })[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    getSavedBreaches(user.id)
      .then(setBreaches)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [user]);

  async function handleUnsave(breachId: string) {
    if (!user) return;
    try {
      await unsaveBreach(breachId, user.id);
      setBreaches((prev) => prev.filter((b) => b.id !== breachId));
    } catch {
      // ignore
    }
  }

  return (
    <Collapsible defaultOpen>
      <CollapsibleTrigger className="group flex w-full items-center justify-between py-3">
        <h2 className="text-lg font-semibold">
          Saved Breaches
          {!loading && breaches.length > 0 && (
            <span className="ml-2 text-sm font-normal text-muted-foreground">
              ({breaches.length})
            </span>
          )}
        </h2>
        <ChevronDown className="h-5 w-5 text-muted-foreground transition-transform group-data-[state=open]:rotate-180" />
      </CollapsibleTrigger>
      <CollapsibleContent>
        {loading ? (
          <div className="grid gap-4 sm:grid-cols-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-28 rounded-lg bg-muted animate-pulse" />
            ))}
          </div>
        ) : breaches.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-10 text-muted-foreground">
            <Bookmark className="h-8 w-8 opacity-40" />
            <p className="text-sm">No saved breaches yet.</p>
            <Button variant="outline" size="sm" asChild>
              <Link href="/search">Browse breaches</Link>
            </Button>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {breaches.map((breach) => (
              <div
                key={breach.id}
                className="relative rounded-lg border bg-card p-4 hover:bg-accent/50 transition-colors"
              >
                <button
                  onClick={() => handleUnsave(breach.id)}
                  className="absolute right-3 top-3 text-muted-foreground hover:text-foreground"
                  aria-label="Remove from saved"
                >
                  <X className="h-4 w-4" />
                </button>

                <Link href={`/breach/${breach.id}`} className="block">
                  <div className="flex items-start gap-2 pr-6">
                    <div className="min-w-0">
                      <p className="truncate font-medium leading-tight">
                        {breach.title || breach.company}
                      </p>
                      <p className="mt-0.5 truncate text-xs text-muted-foreground">
                        {breach.company} · {breach.country ?? "Unknown"}
                      </p>
                    </div>
                  </div>
                  <div className="mt-2 flex items-center gap-2">
                    {breach.severity && <SeverityBadge severity={breach.severity} />}
                    {breach.records_affected && (
                      <span className="text-xs text-muted-foreground">
                        {breach.records_affected.toLocaleString()} records
                      </span>
                    )}
                  </div>
                </Link>
              </div>
            ))}
          </div>
        )}
      </CollapsibleContent>
    </Collapsible>
  );
}
