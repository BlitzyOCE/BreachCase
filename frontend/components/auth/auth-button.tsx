"use client";

import Link from "next/link";
import { useAuth } from "@/components/auth/auth-provider";
import { UserMenu } from "@/components/auth/user-menu";
import { Button } from "@/components/ui/button";

export function AuthButton() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="h-8 w-8 animate-pulse rounded-full bg-muted" />
    );
  }

  if (user) {
    return <UserMenu />;
  }

  return (
    <Button variant="ghost" size="sm" asChild>
      <Link href="/login">Sign in</Link>
    </Button>
  );
}
