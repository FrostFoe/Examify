"use client";

import { apiRequest } from "@/lib/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Download, Upload } from "lucide-react";

export default function BackupManager() {
  const { toast } = useToast();

  type BackupResponse = {
    success: boolean;
    filename?: string;
    size?: number;
    message?: string;
    error?: string;
  };

  const createBackup = async () => {
    try {
      const result = await apiRequest<BackupResponse>("backup", "POST", null);
      if (result.success) {
        toast({
          title: "ব্যাকআপ সফল",
          description: `ব্যাকআপ তৈরি হয়েছে: ${result.data?.filename}`,
        });
      } else {
        throw new Error(result.message || result.data?.error || "ব্যাকআপ তৈরিতে সমস্যা হয়েছে");
      }
    } catch (error) {
      toast({
        title: "ব্যাকআপ তৈরিতে সমস্যা",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>ডেটাবেস ব্যাকআপ ম্যানেজার</CardTitle>
          <CardDescription>
            আপনার ডেটাবেসের ব্যাকআপ তৈরি এবং পরিচালনা করুন
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <Button onClick={createBackup} className="w-full sm:w-auto">
              <Download className="h-4 w-4 mr-2" />
              নতুন ব্যাকআপ তৈরি করুন
            </Button>
            <Button variant="outline" className="w-full sm:w-auto" disabled>
              <Upload className="h-4 w-4 mr-2" />
              ব্যাকআপ রিস্টোর করুন
            </Button>
          </div>
          <div className="text-sm text-muted-foreground mt-4">
            <p>বর্তমানে ব্যাকআপগুলো সার্ভারের /backups ফোল্ডারে সংরক্ষণ করা হয়।</p>
            <p className="mt-1">নিরাপত্তার জন্য ব্যাকআপগুলো ডাউনলোড করে অন্যত্র সংরক্ষণ করার পরামর্শ দেওয়া হয়।</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}