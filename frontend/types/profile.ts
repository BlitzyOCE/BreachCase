export interface Profile {
  id: string;
  display_name: string | null;
  avatar_url: string | null;
  job_title: string | null;
  company: string | null;
  role: "user" | "admin";
  created_at: string;
  updated_at: string;
}
