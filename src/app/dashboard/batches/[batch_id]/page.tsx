"use client";

import { useState, useEffect, useMemo } from "react";
import { apiRequest } from "@/lib/api";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ExamCard } from "@/components/ExamCard";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import type { Batch, Exam, StudentExam, User } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { PageHeader, CustomLoader, EmptyState } from "@/components";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BookOpen, CalendarClock, Zap } from "lucide-react";

export const runtime = "edge";

export default function StudentBatchExamsPage() {
  const params = useParams();
  const router = useRouter();
  const batch_id = params.batch_id as string;
  const { user, loading: authLoading } = useAuth();

  const [batch, setBatch] = useState<Batch | null>(null);
  const [exams, setExams] = useState<Exam[]>([]);
  const [examResults, setExamResults] = useState<Record<string, StudentExam>>(
    {},
  );
  const [loading, setLoading] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null);

  useEffect(() => {
    if (authLoading || !batch_id) return;

    const authorizeAndFetch = async () => {
      setLoading(true);
      try {
        const batchResult = await apiRequest<Batch>("batches", "GET", null, {
          id: batch_id,
        });

        if (!batchResult.success || !batchResult.data) {
          setIsAuthorized(false);
          return;
        }

        const batchData = batchResult.data;
        setBatch(batchData);

        let isAuth = false;
        if (batchData.is_public) {
          isAuth = true;
        } else if (user?.uid) {
          const userResult = await apiRequest<User>("students", "GET", null, {
            uid: user.uid,
          });

          if (
            userResult.success &&
            userResult.data?.enrolled_batches?.includes(batch_id)
          ) {
            isAuth = true;
          }
        }

        if (!isAuth && !batchData.is_public) {
          router.push("/login");
          return;
        }

        setIsAuthorized(true);

        const examsResult = await apiRequest<Exam[]>("exams", "GET", null, {
          batch_id,
        });

        if (!examsResult.success) throw new Error(examsResult.message);
        const examsData = examsResult.data || [];
        setExams(examsData);

        if (user?.uid && examsData.length > 0) {
          const resultsResult = await apiRequest<StudentExam[]>(
            "results",
            "GET",
            null,
            { student_id: user.uid },
          );

          const resultsMap: Record<string, StudentExam> = {};
          (resultsResult.data || []).forEach((r: StudentExam) => {
            resultsMap[r.exam_id] = r;
          });
          setExamResults(resultsMap);
        }
      } catch (error) {
        console.error("Error loading batch page:", error);
        setIsAuthorized(false);
      } finally {
        setLoading(false);
      }
    };

    authorizeAndFetch();
  }, [batch_id, user, authLoading, router]);

  const { liveExams, practiceExams, upcomingExams } = useMemo(() => {
    const now = new Date();
    const live: Exam[] = [];
    const practice: Exam[] = [];
    const upcoming: Exam[] = [];

    exams.forEach((exam) => {
      if (exam.is_practice) {
        practice.push(exam);
      } else {
        const startTime = exam.start_at ? new Date(exam.start_at) : null;
        const endTime = exam.end_at ? new Date(exam.end_at) : null;

        if (startTime && now < startTime) {
          upcoming.push(exam);
        } else if (endTime && now > endTime) {
          practice.push(exam);
        } else {
          live.push(exam);
        }
      }
    });

    return {
      liveExams: live,
      practiceExams: practice,
      upcomingExams: upcoming,
    };
  }, [exams]);

  if (authLoading || loading || isAuthorized === null) {
    return <CustomLoader />;
  }

  if (!isAuthorized) {
    return (
      <div className="container mx-auto p-4 text-center">
        <Card className="max-w-md mx-auto">
          <CardHeader>
            <CardTitle>অনুমতি নেই</CardTitle>
            <CardDescription>এই ব্যাচে আপনার অ্যাক্সেস নেই।</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => router.push("/dashboard/batches")}>
              আমার ব্যাচসমূহে ফিরুন
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-2 md:p-4 space-y-6">
      <PageHeader
        title={`পরীক্ষাসমূহ - ${batch?.name}`}
        description="এই ব্যাচের অন্তর্ভুক্ত পরীক্ষাসমূহ।"
      />
      {exams.length > 0 ? (
        <Tabs defaultValue="live" className="w-full">
          <TabsList className="grid w-full grid-cols-3 max-w-md mx-auto">
            <TabsTrigger value="live">
              <Zap className="h-4 w-4 mr-2" />
              লাইভ
            </TabsTrigger>
            <TabsTrigger value="practice">
              <BookOpen className="h-4 w-4 mr-2" />
              প্রাকটিস
            </TabsTrigger>
            <TabsTrigger value="upcoming">
              <CalendarClock className="h-4 w-4 mr-2" />
              আপকামিং
            </TabsTrigger>
          </TabsList>
          <TabsContent value="live" className="mt-6">
            {liveExams.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {liveExams.map((exam) => (
                  <ExamCard
                    key={exam.id}
                    exam={exam}
                    result={examResults[exam.id]}
                  />
                ))}
              </div>
            ) : (
              <EmptyState
                icon={<Zap className="h-12 w-12 text-primary" />}
                title="কোনো লাইভ পরীক্ষা নেই"
                description="এই ব্যাচে বর্তমানে কোনো পরীক্ষা লাইভ নেই।"
              />
            )}
          </TabsContent>
          <TabsContent value="practice" className="mt-6">
            {practiceExams.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {practiceExams.map((exam) => (
                  <ExamCard
                    key={exam.id}
                    exam={exam}
                    result={examResults[exam.id]}
                  />
                ))}
              </div>
            ) : (
              <EmptyState
                icon={<BookOpen className="h-12 w-12 text-primary" />}
                title="কোনো প্রাকটিস পরীক্ষা নেই"
                description="এই ব্যাচে অনুশীলনের জন্য কোনো পরীক্ষা নেই।"
              />
            )}
          </TabsContent>
          <TabsContent value="upcoming" className="mt-6">
            {upcomingExams.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {upcomingExams.map((exam) => (
                  <ExamCard
                    key={exam.id}
                    exam={exam}
                    result={examResults[exam.id]}
                  />
                ))}
              </div>
            ) : (
              <EmptyState
                icon={<CalendarClock className="h-12 w-12 text-primary" />}
                title="কোনো আপকামিং পরীক্ষা নেই"
                description="এই ব্যাচে কোনো নতুন পরীক্ষার সময়সূচী নেই।"
              />
            )}
          </TabsContent>
        </Tabs>
      ) : (
        <Card>
          <CardContent className="pt-6">
            <p>এই ব্যাচে এখনও কোনো পরীক্ষা যোগ করা হয়নি।</p>
          </CardContent>
        </Card>
      )}
      <hr className="h-20 border-transparent" />
    </div>
  );
}
