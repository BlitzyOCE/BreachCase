import type { Metadata } from "next";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { GoogleSignInButton } from "@/components/auth/google-sign-in-button";
import { RegisterForm } from "@/components/auth/register-form";

export const metadata: Metadata = {
  title: "Create Account",
};

export default function RegisterPage() {
  return (
    <div className="mx-auto flex min-h-[calc(100vh-8rem)] max-w-sm flex-col items-center justify-center px-4">
      <h1 className="text-2xl font-bold tracking-tight">
        Create your account
      </h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Start tracking data breaches
      </p>
      <Card className="mt-6 w-full">
        <CardContent className="flex flex-col gap-4 pt-6">
          <GoogleSignInButton mode="register" />
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <Separator />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-card px-2 text-muted-foreground">or</span>
            </div>
          </div>
          <RegisterForm />
        </CardContent>
      </Card>
      <p className="mt-4 text-sm text-muted-foreground">
        Already have an account?{" "}
        <Link
          href="/login"
          className="font-medium text-primary hover:underline"
        >
          Sign in
        </Link>
      </p>
    </div>
  );
}
