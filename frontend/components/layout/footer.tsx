import Link from "next/link";
import { BriefcaseLogo } from "@/components/ui/logo";

export function Footer() {
  return (
    <footer className="border-t bg-background">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-between">
          <div className="flex items-center gap-2">
            <BriefcaseLogo className="h-7 w-7 text-amber-800" />
            <span className="text-sm font-medium">BreachCase</span>
          </div>
          <p className="text-center text-sm text-muted-foreground">
            Breach data is aggregated from public sources and analyzed using AI.
            Information may not be fully accurate.
          </p>
          <nav className="flex gap-4">
            <Link
              href="/about"
              className="text-sm text-muted-foreground hover:text-foreground"
            >
              About
            </Link>
          </nav>
        </div>
      </div>
    </footer>
  );
}
