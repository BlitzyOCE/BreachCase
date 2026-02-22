import type { Metadata } from "next";
import { Card, CardContent } from "@/components/ui/card";
import { ResetPasswordForm } from "@/components/auth/reset-password-form";

export const metadata: Metadata = {
  title: "Reset Password",
};

export default function ResetPasswordPage() {
  return (
    <div className="mx-auto flex min-h-[calc(100vh-8rem)] max-w-sm flex-col items-center justify-center px-4">
      <h1 className="text-2xl font-bold tracking-tight">
        Set a new password
      </h1>
      <Card className="mt-6 w-full">
        <CardContent className="pt-6">
          <ResetPasswordForm />
        </CardContent>
      </Card>
    </div>
  );
}
