"use client";

import { useEffect, useState, useMemo } from "react";
import { PageHeader, EmptyState, CustomLoader } from "@/components";
import { apiRequest } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { ExamCard } from "@/components/ExamCard";
import type { Exam, StudentExam } from "@/lib/types";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BookOpen, CalendarClock, Zap } from "lucide-react";

export default function ExamsPage() {
  const { user, loading: authLoading } = useAuth();
  const [allExams, setAllExams] = useState<Exam[]>([]);
  const [results, setResults] = useState<
    Record<string, StudentExam | undefined>
  >({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading) {
      loadAllAccessibleExams();
    }
  }, [user, authLoading]);

  const loadAllAccessibleExams = async () => {
    setLoading(true);
    try {
      const result = await apiRequest<Exam[]>("exams", "GET", null, {
        accessible_by: user?.uid,
      });

      if (!result.success || !result.data) throw new Error(result.message);

      const exams = result.data;
      setAllExams(exams || []);

      if (user?.uid && exams && exams.length > 0) {
        fetchResultsForExams(exams);
      }
    } catch (err) {
      console.error("Failed to load exams:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchResultsForExams = async (examsToFetch: Exam[]) => {
    if (user?.uid && examsToFetch && examsToFetch.length > 0) {
      const result = await apiRequest<StudentExam[]>("results", "GET", null, {
        student_id: user.uid,
      });

      const studentAttempts = result.data || [];
      const lookup: Record<string, StudentExam | undefined> = {};
      studentAttempts.forEach((r: StudentExam) => {
        lookup[r.exam_id] = r;
      });

      setResults((prevResults) => ({ ...prevResults, ...lookup }));
    }
  };

  const { liveExams, practiceExams, upcomingExams } = useMemo(() => {
    const now = new Date();
    const live: Exam[] = [];
    const practice: Exam[] = [];
    const upcoming: Exam[] = [];

    allExams.forEach((exam) => {
      if (exam.is_practice) {
        practice.push(exam);
      } else {
        const startTime = exam.start_at ? new Date(exam.start_at) : null;
        const endTime = exam.end_at ? new Date(exam.end_at) : null;

        if (startTime && now < startTime) {
          upcoming.push(exam);
        } else if (endTime && now > endTime) {
          // Finished live exams can be treated as practice
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
  }, [allExams]);

  if (loading || authLoading) {
    return <CustomLoader />;
  }

  return (
    <div className="container mx-auto px-2 sm:px-4 md:px-6 py-4 max-w-6xl space-y-6">
      <PageHeader
        title="পরীক্ষাসমূহ"
        description="আপনার ব্যাচের এবং পাবলিক পরীক্ষাগুলোর তালিকা।"
      />

      <Tabs defaultValue="live" className="w-full mb-8">
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
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 md:gap-4">
              {liveExams.map((exam) => (
                <ExamCard key={exam.id} exam={exam} result={results[exam.id]} />
              ))}
            </div>
          ) : (
            <EmptyState
              icon={<Zap className="h-12 w-12 text-primary" />}
              title="কোনো লাইভ পরীক্ষা নেই"
              description="বর্তমানে কোনো পরীক্ষা লাইভ নেই। অনুগ্রহ করে পরে আবার দেখুন।"
            />
          )}
        </TabsContent>

        <TabsContent value="practice" className="mt-6">
          {practiceExams.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 md:gap-4">
              {practiceExams.map((exam) => (
                <ExamCard key={exam.id} exam={exam} result={results[exam.id]} />
              ))}
            </div>
          ) : (
            <EmptyState
              icon={<BookOpen className="h-12 w-12 text-primary" />}
              title="কোনো প্রাকটিস পরীক্ষা নেই"
              description="অনুশীলনের জন্য কোনো পরীক্ষা এখনো যুক্ত করা হয়নি।"
            />
          )}
        </TabsContent>

        <TabsContent value="upcoming" className="mt-6">
          {upcomingExams.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 md:gap-4">
              {upcomingExams.map((exam) => (
                <ExamCard key={exam.id} exam={exam} result={results[exam.id]} />
              ))}
            </div>
          ) : (
            <EmptyState
              icon={<CalendarClock className="h-12 w-12 text-primary" />}
              title="কোনো আপকামিং পরীক্ষা নেই"
              description="শীঘ্রই নতুন পরীক্ষার সময়সূচী যুক্ত করা হবে।"
            />
          )}
        </TabsContent>
      </Tabs>
      <hr className="h-20 border-transparent" />
    </div>
  );
}
