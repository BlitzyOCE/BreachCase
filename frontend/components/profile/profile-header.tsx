import { CalendarDays, Briefcase, Building2 } from "lucide-react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import type { Profile } from "@/types/profile";

interface ProfileHeaderProps {
  profile: Profile;
  email: string;
}

export function ProfileHeader({ profile, email }: ProfileHeaderProps) {
  const initial =
    profile.display_name?.charAt(0) ?? email.charAt(0) ?? "?";

  const joinedDate = new Date(profile.created_at).toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });

  return (
    <div className="flex items-start gap-6">
      <Avatar className="h-20 w-20 text-2xl">
        {profile.avatar_url ? (
          <AvatarImage src={profile.avatar_url} alt={profile.display_name ?? "Avatar"} />
        ) : null}
        <AvatarFallback className="text-2xl">
          {initial.toUpperCase()}
        </AvatarFallback>
      </Avatar>
      <div className="flex-1 space-y-1">
        <h1 className="text-2xl font-bold tracking-tight">
          {profile.display_name ?? "Unnamed User"}
        </h1>
        <p className="text-sm text-muted-foreground">{email}</p>
        <div className="mt-3 flex flex-wrap gap-4 text-sm text-muted-foreground">
          {profile.job_title && (
            <span className="flex items-center gap-1.5">
              <Briefcase className="h-4 w-4" />
              {profile.job_title}
            </span>
          )}
          {profile.company && (
            <span className="flex items-center gap-1.5">
              <Building2 className="h-4 w-4" />
              {profile.company}
            </span>
          )}
          <span className="flex items-center gap-1.5">
            <CalendarDays className="h-4 w-4" />
            Joined {joinedDate}
          </span>
        </div>
      </div>
    </div>
  );
}
