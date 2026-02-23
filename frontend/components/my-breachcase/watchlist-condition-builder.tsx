"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { ChevronDown } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { TagCount, WatchlistFilters } from "@/types/database";

interface ConditionBuilderProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (name: string, filters: WatchlistFilters) => Promise<void>;
  initialName?: string;
  initialFilters?: WatchlistFilters;
  title?: string;
  industryCounts: TagCount[];
  countryCounts: TagCount[];
  attackVectorCounts: TagCount[];
  threatActorCounts: TagCount[];
}

interface FilterSectionProps {
  title: string;
  options: TagCount[];
  selected: string[];
  onToggle: (value: string) => void;
}

function FilterSection({ title, options, selected, onToggle }: FilterSectionProps) {
  if (options.length === 0) return null;

  return (
    <Collapsible>
      <CollapsibleTrigger className="group flex w-full items-center justify-between py-2 text-sm font-medium hover:text-foreground">
        <span>
          {title}
          {selected.length > 0 && (
            <span className="ml-2 text-xs text-muted-foreground">
              ({selected.length} selected)
            </span>
          )}
        </span>
        <ChevronDown className="h-4 w-4 transition-transform group-data-[state=open]:rotate-180" />
      </CollapsibleTrigger>
      <CollapsibleContent>
        <ScrollArea className="max-h-48">
          <div className="space-y-1 pb-2">
            {options.map((option) => (
              <label
                key={option.tag_value}
                className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-accent"
              >
                <Checkbox
                  checked={selected.includes(option.tag_value)}
                  onCheckedChange={() => onToggle(option.tag_value)}
                />
                <span className="flex-1 truncate">{option.tag_value}</span>
                <span className="text-xs text-muted-foreground">
                  {option.breach_count}
                </span>
              </label>
            ))}
          </div>
        </ScrollArea>
      </CollapsibleContent>
    </Collapsible>
  );
}

export function WatchlistConditionBuilder({
  open,
  onOpenChange,
  onSave,
  initialName = "",
  initialFilters = {},
  title = "New Watchlist",
  industryCounts,
  countryCounts,
  attackVectorCounts,
  threatActorCounts,
}: ConditionBuilderProps) {
  const [name, setName] = useState(initialName);
  const [query, setQuery] = useState(initialFilters.query ?? "");
  const [industries, setIndustries] = useState<string[]>(initialFilters.industries ?? []);
  const [countries, setCountries] = useState<string[]>(initialFilters.countries ?? []);
  const [attackVectors, setAttackVectors] = useState<string[]>(initialFilters.attack_vectors ?? []);
  const [threatActors, setThreatActors] = useState<string[]>(initialFilters.threat_actors ?? []);
  const [saving, setSaving] = useState(false);

  function toggleValue(arr: string[], value: string): string[] {
    return arr.includes(value) ? arr.filter((v) => v !== value) : [...arr, value];
  }

  function resetForm() {
    setName(initialName);
    setQuery(initialFilters.query ?? "");
    setIndustries(initialFilters.industries ?? []);
    setCountries(initialFilters.countries ?? []);
    setAttackVectors(initialFilters.attack_vectors ?? []);
    setThreatActors(initialFilters.threat_actors ?? []);
  }

  async function handleSave() {
    if (!name.trim()) return;
    setSaving(true);
    try {
      const filters: WatchlistFilters = {};
      if (query.trim()) filters.query = query.trim();
      if (industries.length) filters.industries = industries;
      if (countries.length) filters.countries = countries;
      if (attackVectors.length) filters.attack_vectors = attackVectors;
      if (threatActors.length) filters.threat_actors = threatActors;

      await onSave(name.trim(), filters);
      onOpenChange(false);
    } catch {
      // ignore
    } finally {
      setSaving(false);
    }
  }

  const filterCount =
    industries.length + countries.length + attackVectors.length + threatActors.length;

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (!o) resetForm();
        onOpenChange(o);
      }}
    >
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label htmlFor="wl-name">Name</Label>
            <Input
              id="wl-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Healthcare alerts"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="wl-query">Keyword query</Label>
            <Input
              id="wl-query"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="e.g. ransomware hospital"
            />
          </div>

          <div className="space-y-1">
            <p className="text-sm font-medium">
              Filter conditions
              {filterCount > 0 && (
                <span className="ml-2 text-xs text-muted-foreground">
                  ({filterCount} selected)
                </span>
              )}
            </p>

            <FilterSection
              title="Industries"
              options={industryCounts}
              selected={industries}
              onToggle={(v) => setIndustries(toggleValue(industries, v))}
            />
            <FilterSection
              title="Countries"
              options={countryCounts}
              selected={countries}
              onToggle={(v) => setCountries(toggleValue(countries, v))}
            />
            <FilterSection
              title="Attack Vectors"
              options={attackVectorCounts}
              selected={attackVectors}
              onToggle={(v) => setAttackVectors(toggleValue(attackVectors, v))}
            />
            <FilterSection
              title="Threat Actors"
              options={threatActorCounts}
              selected={threatActors}
              onToggle={(v) => setThreatActors(toggleValue(threatActors, v))}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={!name.trim() || saving}>
            {saving ? "Saving..." : "Save"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
