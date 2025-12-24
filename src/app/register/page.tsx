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
          <CardTitle className="text-2xl">Examify</CardTitle>
          <CardDescription>
            অ্যাকাউন্ট তৈরি করতে নিচের ফর্মটি পূরণ করুন
          </CardDescription>
        </CardHeader>
          <CardFooter className="flex-col">
            <p className="mt-4 text-center text-sm text-muted-foreground">
              Already have an account?{" "}
              <Link href="/login" className="underline hover:text-primary">
                Login here
              </Link>
            </p>
            <p className="mt-2 text-center text-xs text-muted-foreground">
              Please contact Examify admins to obtain your account.
            </p>
          </CardFooter>
      </Card>
    </div>
  );
}
