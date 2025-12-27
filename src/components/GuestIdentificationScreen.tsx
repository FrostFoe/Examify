"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import {
  createTemporaryGuestUser,
  saveGuestUserToSession,
} from "@/lib/guest-utils";
import type { User } from "@/lib/types";

export function GuestIdentificationScreen({
  onIdentify,
  examName,
}: {
  onIdentify: (user: User) => void;
  examName: string;
}) {
  const [name, setName] = useState("");
  const [roll, setRoll] = useState("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !roll.trim()) {
      toast({ title: "নাম এবং রোল দিন", variant: "destructive" });
      return;
    }

    setLoading(true);
    try {
      // Create a temporary guest user without calling the backend API
      const tempUser = createTemporaryGuestUser(name, roll);

      // Save to session storage for persistence during this session
      saveGuestUserToSession(tempUser);

      // Call the onIdentify callback with the temporary user
      onIdentify(tempUser);
    } catch (error) {
      console.error("Error creating guest user:", error);
      toast({
        title: "ত্রুটি",
        description: "গেস্ট ইউজার তৈরি করতে সমস্যা হয়েছে",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto mt-8">
      <CardHeader className="text-center">
        <CardTitle>{examName} পরীক্ষা দিন</CardTitle>
        <CardDescription>
          গেস্ট হিসেবে পরীক্ষা দিতে আপনার নাম এবং রোল নম্বর দিন
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">নাম</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="আপনার নাম"
              disabled={loading}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="roll">রোল নম্বর</Label>
            <Input
              id="roll"
              value={roll}
              onChange={(e) => setRoll(e.target.value)}
              placeholder="আপনার রোল নম্বর"
              disabled={loading}
            />
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "প্রবেশ করছে..." : "পরীক্ষা শুরু করুন"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
