"use client";

import { useState } from "react";
import { Loader2, CheckCircle2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { createBrowserClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { Profile } from "@/types/profile";

interface ProfileEditFormProps {
  profile: Profile;
}

export function ProfileEditForm({ profile }: ProfileEditFormProps) {
  const [displayName, setDisplayName] = useState(profile.display_name ?? "");
  const [jobTitle, setJobTitle] = useState(profile.job_title ?? "");
  const [company, setCompany] = useState(profile.company ?? "");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);
    setLoading(true);

    const supabase = createBrowserClient();

    // Update profile in profiles table
    const { error: profileError } = await supabase
      .from("profiles")
      .update({
        display_name: displayName || null,
        job_title: jobTitle || null,
        company: company || null,
      })
      .eq("id", profile.id);

    if (profileError) {
      setError(profileError.message);
      setLoading(false);
      return;
    }

    // Keep auth metadata in sync
    const { error: authError } = await supabase.auth.updateUser({
      data: { display_name: displayName },
    });

    if (authError) {
      setError(authError.message);
      setLoading(false);
      return;
    }

    setSuccess(true);
    setLoading(false);
    router.refresh();
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <Label htmlFor="displayName">Display name</Label>
        <Input
          id="displayName"
          type="text"
          placeholder="Jane Doe"
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          autoComplete="name"
        />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="jobTitle">Job title</Label>
        <Input
          id="jobTitle"
          type="text"
          placeholder="Security Analyst"
          value={jobTitle}
          onChange={(e) => setJobTitle(e.target.value)}
          autoComplete="organization-title"
        />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="company">Company</Label>
        <Input
          id="company"
          type="text"
          placeholder="Acme Corp"
          value={company}
          onChange={(e) => setCompany(e.target.value)}
          autoComplete="organization"
        />
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
      {success && (
        <p className="flex items-center gap-1.5 text-sm text-green-600 dark:text-green-500">
          <CheckCircle2 className="h-4 w-4" />
          Profile updated successfully
        </p>
      )}
      <Button type="submit" className="w-full sm:w-auto" disabled={loading}>
        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        Save changes
      </Button>
    </form>
  );
}
