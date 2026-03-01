"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

const STORAGE_KEY = "cookie-notice-dismissed";

export function CookieNotice() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!localStorage.getItem(STORAGE_KEY)) {
      setVisible(true);
    }
  }, []);

  function dismiss() {
    localStorage.setItem(STORAGE_KEY, "1");
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 border-t bg-background px-4 py-3 shadow-md">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          This site uses cookies for authentication and theme preferences. No
          tracking or advertising cookies are used.{" "}
          <Link href="/about" className="underline underline-offset-2 hover:text-foreground">
            Learn more
          </Link>
        </p>
        <Button size="sm" onClick={dismiss}>
          Got it
        </Button>
      </div>
    </div>
  );
}
