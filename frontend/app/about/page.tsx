import type { Metadata } from "next";
import { Rss, Bot, Database, Globe } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { StatCard } from "@/components/ui/stat-card";
import { RSS_SOURCES } from "@/lib/utils/constants";
import { getBreachCount } from "@/lib/queries/breaches";

export const metadata: Metadata = {
  title: "About",
  description:
    "Learn about BreachCase, an AI-powered data breach intelligence platform.",
};

export const dynamic = "force-dynamic";

export default async function AboutPage() {
  const totalCount = await getBreachCount();

  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-bold tracking-tight">About BreachCase</h1>

      {/* Stats */}
      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        <StatCard label="Breaches Tracked" value={totalCount} />
        <StatCard label="Sources Monitored" value={RSS_SOURCES.length} />
      </div>

      <div className="mt-6 space-y-6 text-muted-foreground leading-relaxed">
        <p>
          BreachCase is an AI-powered data breach intelligence platform that
          automatically aggregates, analyzes, and tracks cybersecurity incidents
          from across the web.
        </p>
      </div>

      <Separator className="my-8" />

      {/* How It Works */}
      <h2 className="text-2xl font-semibold tracking-tight">How It Works</h2>
      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Rss className="h-5 w-5 text-muted-foreground" />
              1. Aggregate
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            RSS feeds from {RSS_SOURCES.length} leading cybersecurity news
            sources are monitored daily for new breach reports.
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Bot className="h-5 w-5 text-muted-foreground" />
              2. Analyze
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            AI extracts structured data from unstructured articles — company
            names, severity levels, attack methods, and more.
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Database className="h-5 w-5 text-muted-foreground" />
              3. Deduplicate
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            Intelligent detection distinguishes new breaches from updates to
            existing incidents, preventing duplicate entries.
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Globe className="h-5 w-5 text-muted-foreground" />
              4. Present
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            Breach data is presented with timelines, tags, and related
            incidents, making it easy to track evolving situations.
          </CardContent>
        </Card>
      </div>

      <Separator className="my-8" />

      {/* Data Sources */}
      <h2 className="text-2xl font-semibold tracking-tight">Data Sources</h2>
      <p className="mt-3 text-sm text-muted-foreground">
        Breach intelligence is aggregated from leading cybersecurity news sources and feeds:
      </p>
      <div className="mt-4 flex flex-wrap gap-2">
        {RSS_SOURCES.map((source) => (
          <span
            key={source.name}
            className="rounded-md border px-2.5 py-1 text-xs text-muted-foreground"
          >
            {source.name}
          </span>
        ))}
      </div>

      <Separator className="my-8" />

      {/* AI Disclosure */}
      <div className="rounded-lg border bg-muted/50 p-4">
        <h3 className="text-sm font-semibold">AI Disclosure</h3>
        <p className="mt-2 text-sm text-muted-foreground">
          Breach data on this platform is extracted, classified, and summarized
          using AI (DeepSeek). While we strive for accuracy, AI-generated
          content may contain errors. Always verify critical information with
          the original source articles linked on each breach page.
        </p>
      </div>
    </div>
  );
}
