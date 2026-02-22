import type { Metadata } from "next";
import { Card, CardContent } from "@/components/ui/card";
import { ForgotPasswordForm } from "@/components/auth/forgot-password-form";

export const metadata: Metadata = {
  title: "Forgot Password",
};

export default function ForgotPasswordPage() {
  return (
    <div className="mx-auto flex min-h-[calc(100vh-8rem)] max-w-sm flex-col items-center justify-center px-4">
      <h1 className="text-2xl font-bold tracking-tight">
        Reset your password
      </h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Enter your email and we&apos;ll send you a reset link
      </p>
      <Card className="mt-6 w-full">
        <CardContent className="pt-6">
          <ForgotPasswordForm />
        </CardContent>
      </Card>
    </div>
  );
}
