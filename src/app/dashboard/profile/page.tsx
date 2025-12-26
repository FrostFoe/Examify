"use client";

import { useAuth } from "@/context/AuthContext";
import {
  CustomLoader,
  PageHeader,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Badge,
} from "@/components";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useEffect, useState } from "react";
import { apiRequest } from "@/lib/api";
import {
  CalendarIcon,
  User as UserIcon,
  Edit,
  Save,
  X,
  BookOpen,
  LogOut,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import Link from "next/link";

interface Batch {
  id: string;
  name: string;
}

interface Exam {
  id: string;
  name: string;
  created_at: string;
  duration_minutes?: number;
}

export default function ProfilePage() {
  const { user, loading, signOut } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [batches, setBatches] = useState<Batch[]>([]);
  const [upcomingExams, setUpcomingExams] = useState<Exam[]>([]);
  const [batchesLoading, setBatchesLoading] = useState(true);
  const [examsLoading, setExamsLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState("");

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    }
  }, [user, loading, router]);

  useEffect(() => {
    async function fetchBatches() {
      if (user?.enrolled_batches && user.enrolled_batches.length > 0) {
        try {
          const result = await apiRequest<Batch[]>("batches", "GET", null, {
            enrolled_by: user.uid,
          });

          if (!result.success || !result.data) {
            throw new Error(result.message);
          }
          setBatches(result.data || []);
        } catch (error) {
          console.error("Error fetching batches:", error);
        } finally {
          setBatchesLoading(false);
        }
      } else {
        setBatches([]);
        setBatchesLoading(false);
      }
    }

    async function fetchUpcomingExams() {
      if (!user?.uid) return;

      try {
        const result = await apiRequest<Exam[]>("exams", "GET", null, {
          accessible_by: user.uid,
        });

        if (!result.success || !result.data) {
          throw new Error(result.message);
        }

        setUpcomingExams(result.data || []);
      } catch (error) {
        console.error("Error fetching exams:", error);
      } finally {
        setExamsLoading(false);
      }
    }

    if (!loading && user) {
      fetchBatches();
      fetchUpcomingExams();
      setEditName(user.name);
    }
  }, [user, loading]);

  const handleSaveProfile = async () => {
    if (!user?.uid || !editName.trim()) return;

    try {
      const result = await apiRequest(
        "students",
        "POST",
        {
          uid: user.uid,
          name: editName.trim(),
        },
        { action: "update" },
      );

      if (!result.success) throw new Error(result.message);

      toast({
        title: "প্রোফাইল আপডেট হয়েছে",
      });
      setEditing(false);
      // Refresh user data
      window.location.reload();
    } catch (error) {
      console.error("Error updating profile:", error);
      toast({
        title: "প্রোফাইল আপডেট করতে ব্যর্থ",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return <CustomLoader />;
  }

  if (!user) {
    return null;
  }

  return (
    <div className="container mx-auto px-2 sm:px-4 md:px-6 py-4 max-w-6xl space-y-6">
      <PageHeader
        title="প্রোফাইল"
        description="আপনার ব্যক্তিগত তথ্য এবং আসন্ন পরীক্ষা"
      />

      <div className="grid gap-6 md:grid-cols-2">
        {/* Profile Card */}
        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-4 sm:space-y-0 sm:space-x-4">
              <Avatar className="h-20 w-20 border-2 border-primary">
                <AvatarFallback className="text-2xl">
                  <UserIcon className="h-10 w-10" />
                </AvatarFallback>
              </Avatar>
              <div className="space-y-1 flex-1">
                {editing ? (
                  <div className="space-y-2">
                    <Label htmlFor="name">নাম</Label>
                    <Input
                      id="name"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      placeholder="আপনার নাম"
                    />
                    <div className="flex gap-2">
                      <Button size="sm" onClick={handleSaveProfile}>
                        <Save className="h-4 w-4 mr-1" />
                        সেভ
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setEditing(false)}
                      >
                        <X className="h-4 w-4 mr-1" />
                        বাতিল
                      </Button>
                    </div>
                  </div>
                ) : (
                  <>
                    <CardTitle className="text-2xl">{user.name}</CardTitle>
                    <CardDescription className="text-md">
                      {user.roll}
                    </CardDescription>
                    <Button size="sm" onClick={() => setEditing(true)}>
                      <Edit className="h-4 w-4 mr-1" />
                      এডিট
                    </Button>
                  </>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6 pt-6">
            <div>
              <h3 className="font-semibold text-lg mb-2">
                ভর্তি হওয়া ব্যাচসমূহ
              </h3>
              <div className="flex flex-wrap gap-2">
                {batchesLoading ? (
                  <Skeleton className="h-6 w-24" />
                ) : batches.length > 0 ? (
                  batches.map((batch) => (
                    <Badge key={batch.id} variant="secondary">
                      {batch.name}
                    </Badge>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground">
                    কোনো ব্যাচে ভর্তি হননি।
                  </p>
                )}
              </div>
            </div>

            <div>
              <h3 className="font-semibold text-lg mb-2">অন্যান্য তথ্য</h3>
              <div className="flex items-center text-sm text-muted-foreground">
                <CalendarIcon className="mr-2 h-4 w-4" />
                <span>
                  রেজিস্ট্রেশনের তারিখ:{" "}
                  {new Date(user.created_at).toLocaleDateString("bn-BD", {
                    timeZone: "Asia/Dhaka",
                  })}
                </span>
              </div>
              <Button
                variant="destructive"
                onClick={signOut}
                className="mt-4 w-full"
              >
                <LogOut className="h-4 w-4 mr-2" />
                লগ আউট
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Calendar Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <CalendarIcon className="h-5 w-5 mr-2" />
              আসন্ন পরীক্ষা
            </CardTitle>
            <CardDescription>আপনার অ্যাক্সেস করা পরীক্ষাগুলো</CardDescription>
          </CardHeader>
          <CardContent>
            {examsLoading ? (
              <div className="space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </div>
            ) : upcomingExams.length > 0 ? (
              <div className="space-y-4">
                {upcomingExams.map((exam) => (
                  <div
                    key={exam.id}
                    className="border rounded-lg p-3 flex justify-between items-center"
                  >
                    <div>
                      <h4 className="font-medium">{exam.name}</h4>
                      <p className="text-sm text-muted-foreground">
                        {new Date(exam.created_at).toLocaleDateString("bn-BD", {
                          timeZone: "Asia/Dhaka",
                        })}
                        {exam.duration_minutes &&
                          ` • ${exam.duration_minutes} মিনিট`}
                      </p>
                    </div>
                    <Link href={`/dashboard/exams/${exam.id}`}>
                      <Button variant="outline" size="sm">
                        <BookOpen className="h-4 w-4 mr-2" />
                        পরীক্ষা দিন
                      </Button>
                    </Link>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                কোনো আসন্ন পরীক্ষা নেই।
              </p>
            )}
          </CardContent>
        </Card>
      </div>
      <hr className="h-20 border-transparent" />
    </div>
  );
}
