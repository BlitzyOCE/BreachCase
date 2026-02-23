"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, AlertTriangle } from "lucide-react";
import { createBrowserClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export function DeleteAccountSection() {
  const [open, setOpen] = useState(false);
  const [confirmation, setConfirmation] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleDelete = async () => {
    if (confirmation !== "DELETE") return;

    setError(null);
    setLoading(true);

    try {
      const supabase = createBrowserClient();
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        setError("You must be signed in to delete your account");
        setLoading(false);
        return;
      }

      const response = await fetch("/api/account/delete", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (!response.ok) {
        const data = await response.json();
        setError(data.error ?? "Failed to delete account");
        setLoading(false);
        return;
      }

      // Sign out locally and redirect
      await supabase.auth.signOut();
      router.push("/");
      router.refresh();
    } catch {
      setError("An unexpected error occurred");
      setLoading(false);
    }
  };

  return (
    <div>
      <p className="text-sm text-muted-foreground">
        Permanently delete your account and all associated data. This action
        cannot be undone.
      </p>
      <ul className="mt-3 space-y-1 text-sm text-muted-foreground">
        <li>Your profile, saved breaches, and watchlists will be permanently deleted</li>
        <li>Your comments will be anonymized (shown as &quot;Deleted User&quot;)</li>
        <li>Your view history will be removed</li>
      </ul>

      <Dialog open={open} onOpenChange={(v) => { setOpen(v); setConfirmation(""); setError(null); }}>
        <DialogTrigger asChild>
          <Button variant="destructive" className="mt-4">
            Delete account
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              Delete account
            </DialogTitle>
            <DialogDescription>
              This action is permanent and cannot be undone. All your data will
              be deleted.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-2">
            <Label htmlFor="deleteConfirmation">
              Type <span className="font-mono font-semibold">DELETE</span> to
              confirm
            </Label>
            <Input
              id="deleteConfirmation"
              type="text"
              value={confirmation}
              onChange={(e) => setConfirmation(e.target.value)}
              placeholder="DELETE"
              autoComplete="off"
            />
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <DialogFooter>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={confirmation !== "DELETE" || loading}
            >
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Permanently delete account
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
