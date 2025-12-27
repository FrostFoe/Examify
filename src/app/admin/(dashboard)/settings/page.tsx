"use client";

import { useState } from "react";
import { Settings, Users, Lock, ShieldCheck, Loader2 } from "lucide-react";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAdminAuth } from "@/context/AdminAuthContext";
import { apiRequest } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

export default function AdminSettingsPage() {
  const { admin } = useAdminAuth();
  const { toast } = useToast();
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      toast({
        variant: "destructive",
        title: "পাসওয়ার্ড মিলেনি",
        description: "নতুন পাসওয়ার্ড এবং নিশ্চিতকরণ পাসওয়ার্ড এক হতে হবে।",
      });
      return;
    }

    if (newPassword.length < 4) {
      toast({
        variant: "destructive",
        title: "পাসওয়ার্ড খুব ছোট",
        description: "পাসওয়ার্ড অন্তত ৪ অক্ষরের হতে হবে।",
      });
      return;
    }

    setIsChangingPassword(true);
    try {
      const result = await apiRequest(
        "settings",
        "POST",
        {
          admin_uid: admin?.uid,
          old_password: oldPassword,
          new_password: newPassword,
        },
        { action: "change-admin-password" },
      );

      if (result.success) {
        toast({
          title: "সফল",
          description: "অ্যাডমিন পাসওয়ার্ড সফলভাবে পরিবর্তন করা হয়েছে।",
        });
        setOldPassword("");
        setNewPassword("");
        setConfirmPassword("");
      } else {
        toast({
          variant: "destructive",
          title: "ব্যর্থ হয়েছে",
          description: result.message || "পাসওয়ার্ড পরিবর্তন করা যায়নি।",
        });
      }
    } catch {
      toast({
        variant: "destructive",
        title: "ত্রুটি",
        description: "সার্ভারের সাথে যোগাযোগ করতে সমস্যা হয়েছে।",
      });
    } finally {
      setIsChangingPassword(false);
    }
  };

  return (
    <div className="container mx-auto p-1 md:p-2 lg:p-4 space-y-6">
      <div className="flex items-center space-x-2">
        <Settings className="h-6 w-6 text-muted-foreground" />
        <h1 className="text-2xl font-bold tracking-tight">সেটিংস</h1>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="space-y-6">
          <section>
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-primary" />
              সাধারণ ব্যবস্থাপনা
            </h2>
            <div className="grid gap-2 md:gap-4">
              <Link href="/admin/users">
                <Card className="hover:bg-muted/50 transition-colors cursor-pointer">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                      ব্যবহারকারী ব্যবস্থাপনা
                    </CardTitle>
                    <Users className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-xs text-muted-foreground">
                      শিক্ষার্থী এবং অ্যাডমিনদের তালিকা দেখুন এবং পরিচালনা করুন।
                    </div>
                  </CardContent>
                </Card>
              </Link>
            </div>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Lock className="h-5 w-5 text-primary" />
              নিরাপত্তা সেটিংস
            </h2>
            <Card>
              <CardHeader>
                <CardTitle className="text-base">
                  অ্যাডমিন পাসওয়ার্ড পরিবর্তন
                </CardTitle>
                <CardDescription>
                  আপনার অ্যাডমিন প্যানেলের পাসওয়ার্ড আপডেট করুন।
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handlePasswordChange} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="old-password">বর্তমান পাসওয়ার্ড</Label>
                    <Input
                      id="old-password"
                      type="password"
                      value={oldPassword}
                      onChange={(e) => setOldPassword(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="new-password">নতুন পাসওয়ার্ড</Label>
                    <Input
                      id="new-password"
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="confirm-password">
                      নতুন পাসওয়ার্ড নিশ্চিত করুন
                    </Label>
                    <Input
                      id="confirm-password"
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                    />
                  </div>
                  <Button
                    type="submit"
                    className="w-full"
                    disabled={isChangingPassword}
                  >
                    {isChangingPassword ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        পরিবর্তন করা হচ্ছে...
                      </>
                    ) : (
                      "পাসওয়ার্ড আপডেট করুন"
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </section>
        </div>

        <div className="space-y-6">
          <section>
            <h2 className="text-lg font-semibold mb-4">অ্যাপ্লিকেশন তথ্য</h2>
            <Card>
              <CardContent className="pt-6">
                <div className="space-y-4 text-sm">
                  <div className="flex justify-between border-b pb-2">
                    <span className="text-muted-foreground">সংস্করণ</span>
                    <span className="font-medium">2.1.0</span>
                  </div>
                  <div className="flex justify-between border-b pb-2">
                    <span className="text-muted-foreground">পরিবেশ</span>
                    <span className="font-medium">Production</span>
                  </div>
                  <div className="flex justify-between border-b pb-2">
                    <span className="text-muted-foreground">অ্যাডমিন</span>
                    <span className="font-medium">{admin?.username}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">স্ট্যাটাস</span>
                    <span className="text-green-500 font-medium">সচল</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </section>
        </div>
      </div>
    </div>
  );
}
