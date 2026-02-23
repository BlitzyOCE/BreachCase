"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu, User, Settings, LogOut, LogIn } from "lucide-react";
import { useAuth } from "@/components/auth/auth-provider";
import { BriefcaseLogo } from "@/components/ui/logo";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { SearchBar } from "@/components/search/search-bar";

export function MobileNav() {
  const [open, setOpen] = useState(false);
  const { user, profile, signOut } = useAuth();

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon">
          <Menu className="h-5 w-5" />
          <span className="sr-only">Open menu</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-72">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <BriefcaseLogo className="h-7 w-7 text-amber-800" />
            BreachCase
          </SheetTitle>
        </SheetHeader>
        <div className="mt-6 flex flex-col gap-4">
          <SearchBar compact onNavigate={() => setOpen(false)} />
          <nav className="flex flex-col gap-2">
            <Link
              href="/"
              onClick={() => setOpen(false)}
              className="rounded-md px-3 py-2 text-sm font-medium hover:bg-accent"
            >
              Home
            </Link>
            <Link
              href="/search"
              onClick={() => setOpen(false)}
              className="rounded-md px-3 py-2 text-sm font-medium hover:bg-accent"
            >
              Search
            </Link>
            <Link
              href="/my-breachcase"
              onClick={() => setOpen(false)}
              className="rounded-md px-3 py-2 text-sm font-medium hover:bg-accent"
            >
              My Breachcase
            </Link>
            <Link
              href="/about"
              onClick={() => setOpen(false)}
              className="rounded-md px-3 py-2 text-sm font-medium hover:bg-accent"
            >
              About
            </Link>
            <div className="my-2 border-t" />
            {user ? (
              <>
                {profile?.display_name && (
                  <p className="px-3 py-1 text-xs text-muted-foreground">
                    Signed in as {profile.display_name}
                  </p>
                )}
                <Link
                  href="/profile"
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium hover:bg-accent"
                >
                  <User className="h-4 w-4" />
                  Profile
                </Link>
                <Link
                  href="/settings"
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium hover:bg-accent"
                >
                  <Settings className="h-4 w-4" />
                  Settings
                </Link>
                <button
                  onClick={() => {
                    signOut();
                    setOpen(false);
                  }}
                  className="flex items-center gap-2 rounded-md px-3 py-2 text-left text-sm font-medium hover:bg-accent"
                >
                  <LogOut className="h-4 w-4" />
                  Sign out
                </button>
              </>
            ) : (
              <Link
                href="/login"
                onClick={() => setOpen(false)}
                className="flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium hover:bg-accent"
              >
                <LogIn className="h-4 w-4" />
                Sign in
              </Link>
            )}
          </nav>
        </div>
      </SheetContent>
    </Sheet>
  );
}
