"use client";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components";
import { GraduationCap } from "lucide-react";
import Link from "next/link";

export default function RegisterPage() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-background animate-in fade-in duration-500">
      <Card className="w-full max-w-sm animate-in zoom-in slide-in-from-bottom-8 duration-500">
        <CardHeader className="text-center">
          <div className="flex justify-center items-center mb-4">
            <GraduationCap className="h-10 w-10 text-primary" />
          </div>
          <CardTitle className="text-2xl">MNR Study</CardTitle>
          <CardDescription>Registration is currently closed.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 text-center">
          <p className="text-lg font-semibold">
            Please contact MNR World admins to obtain your account.
          </p>
          <p className="text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link href="/login" className="underline hover:text-primary">
              Login here
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
