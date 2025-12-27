"use client";

import { useState, useEffect } from "react";
import { apiRequest } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { PageHeader, EmptyState, CustomLoader } from "@/components";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  BarChart3,
  AlertCircle,
  TrendingUp,
  CheckCircle2,
  XCircle,
  Trophy,
} from "lucide-react";
import type { Exam, Batch } from "@/lib/types";
import { Button } from "@/components/ui/button";
import Link from "next/link";

interface ExamResult {
  id: string;
  exam_id: string;
  exam_name: string;
  score: number;
  correct_answers: number;
  wrong_answers: number;
  unattempted: number;
  submitted_at: string;
  negative_marks_per_wrong: number;
  marks_per_question: number;
  batch_id: string | null;
}

interface RawStudentExam {
  id: string;
  exam_id: string;
  correct_answers: string;
  wrong_answers: string;
  unattempted: string;
  submitted_at: string;
}

export default function ResultsPage() {
  const { user, loading: authLoading } = useAuth();
  const [results, setResults] = useState<ExamResult[]>([]);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<"recent" | "score">("recent");
  const [selectedBatchId, setSelectedBatchId] = useState<string>("all");

  useEffect(() => {
    if (!authLoading && user?.uid) {
      fetchResultsAndBatches();
    } else if (!authLoading && !user) {
      setError("অনুগ্রহ করে লগইন করুন");
    }
  }, [user?.uid, authLoading]);

  const fetchResultsAndBatches = async () => {
    setLoading(true);
    setError(null);

    try {
      // Fetch all student exam results
      const resultsResult = await apiRequest<RawStudentExam[]>(
        "results",
        "GET",
        null,
        {
          student_id: user?.uid,
        },
      );

      if (!resultsResult.success || !resultsResult.data) {
        setError("ফলাফল আনতে ব্যর্থ");
        return;
      }

      const allStudentExams = resultsResult.data;

      if (allStudentExams.length === 0) {
        setResults([]);
        setBatches([]);
        return;
      }

      // Fetch all exams for lookup
      const examsResult = await apiRequest<Exam[]>("exams");
      if (!examsResult.success || !examsResult.data)
        throw new Error(examsResult.message);

      const examLookup: Record<string, Partial<Exam>> = {};
      examsResult.data.forEach((exam: Exam) => {
        examLookup[exam.id] = exam;
      });

      // Fetch all batches
      const batchesResult = await apiRequest<Batch[]>("batches");
      if (!batchesResult.success || !batchesResult.data)
        throw new Error(batchesResult.message);
      setBatches(batchesResult.data);

      const transformedResults: ExamResult[] = allStudentExams.map((result) => {
        const examDetails = examLookup[result.exam_id];
        const negativeMarks = examDetails?.negative_marks_per_wrong || 0;
        const finalScore =
          parseFloat(result.correct_answers) -
          parseFloat(result.wrong_answers) * negativeMarks;

        return {
          id: result.id,
          exam_id: result.exam_id,
          exam_name: examDetails?.name || "অজানা পরীক্ষা",
          score: finalScore,
          correct_answers: parseInt(result.correct_answers),
          wrong_answers: parseInt(result.wrong_answers),
          unattempted: parseInt(result.unattempted),
          submitted_at: result.submitted_at,
          negative_marks_per_wrong: negativeMarks,
          marks_per_question: examDetails?.marks_per_question || 1,
          batch_id: examDetails?.batch_id || null,
        };
      });

      setResults(transformedResults);
    } catch (err) {
      console.error("Error:", err);
      setError("ডেটা লোড করতে ত্রুটি হয়েছে");
    } finally {
      setLoading(false);
    }
  };

  const getScoreBadgeColor = (score: number, totalMarks: number) => {
    const percentage = totalMarks > 0 ? (score / totalMarks) * 100 : 0;
    if (percentage >= 80) return "bg-green-100 text-green-800 border-green-300";
    if (percentage >= 60) return "bg-blue-100 text-blue-800 border-blue-300";
    if (percentage >= 40)
      return "bg-yellow-100 text-yellow-800 border-yellow-300";
    return "bg-red-100 text-red-800 border-red-300";
  };

  const getScoreFeedback = (score: number, totalMarks: number) => {
    const percentage = totalMarks > 0 ? (score / totalMarks) * 100 : 0;
    if (percentage >= 80) return "চমৎকার পারফরম্যান্স!";
    if (percentage >= 60) return "ভালো পারফরম্যান্স";
    if (percentage >= 40) return "সন্তোষজনক";
    return "আরও অনুশীলন প্রয়োজন";
  };

  const getScoreFeedbackIcon = (score: number, totalMarks: number) => {
    const percentage = totalMarks > 0 ? (score / totalMarks) * 100 : 0;
    if (percentage >= 80)
      return <CheckCircle2 className="h-5 w-5 text-green-600" />;
    if (percentage >= 60)
      return <TrendingUp className="h-5 w-5 text-blue-600" />;
    if (percentage >= 40)
      return <AlertCircle className="h-5 w-5 text-yellow-600" />;
    return <XCircle className="h-5 w-5 text-red-600" />;
  };

  const filteredResults =
    selectedBatchId === "all"
      ? results
      : results.filter((r) => r.batch_id === selectedBatchId);

  const sortedResults = [...filteredResults].sort((a, b) => {
    if (sortBy === "score") {
      return b.score - a.score;
    }
    return (
      new Date(b.submitted_at).getTime() - new Date(a.submitted_at).getTime()
    );
  });

  const chartData = sortedResults
    .slice(0, 10)
    .reverse()
    .map((r) => ({
      name: new Date(r.submitted_at).toLocaleDateString("bn-BD"),
      score: r.score,
    }));

  const totalAttempts = filteredResults.length;
  const averageScore =
    filteredResults.length > 0
      ? filteredResults.reduce(
          (sum, r) => sum + parseFloat(String(r.score || 0)),
          0,
        ) / filteredResults.length
      : 0;
  const bestScore =
    filteredResults.length > 0
      ? Math.max(
          ...filteredResults.map((r) => parseFloat(String(r.score || 0))),
        )
      : 0;

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString("bn-BD", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      timeZone: "Asia/Dhaka",
    });
  };

  if (authLoading) {
    return (
      <div className="container mx-auto px-2 sm:px-4 md:px-6 py-4 max-w-6xl">
        <PageHeader title="ফলাফল" description="" />
        <Card>
          <CardContent className="py-8 flex items-center justify-center">
            <CustomLoader />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="container mx-auto px-2 sm:px-4 md:px-6 py-4 max-w-6xl space-y-6">
        <PageHeader title="ফলাফল" description="" />
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>অনুগ্রহ করে লগইন করুন</AlertDescription>
        </Alert>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="container mx-auto px-2 sm:px-4 md:px-6 py-4 max-w-6xl">
        <PageHeader title="ফলাফল" description="" />
        <Card>
          <CardContent className="py-8 flex items-center justify-center">
            <CustomLoader />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-2 sm:px-4 md:px-6 py-4 max-w-6xl space-y-6">
        <PageHeader title="ফলাফল" description="" />
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    );
  }

  if (results.length === 0) {
    return (
      <div className="container mx-auto px-2 sm:px-4 md:px-6 py-4 max-w-6xl space-y-6">
        <PageHeader
          title="ফলাফল"
          description="আপনার পরীক্ষার ফলাফল এবং পরিসংখ্যান"
        />
        <EmptyState
          icon={<BarChart3 className="h-12 w-12 text-primary" />}
          title="কোনো ফলাফল পাওয়া যায়নি"
          description="এখনও কোনো পরীক্ষার ফলাফল নেই। পরীক্ষা দিন এবং আপনার ফলাফল দেখুন।"
        />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-2 sm:px-4 md:px-6 py-4 max-w-6xl space-y-6">
      <PageHeader
        title="ফলাফল"
        description="আপনার পরীক্ষার ফলাফল এবং পরিসংখ্যান"
      />

      <div className="flex justify-between items-center">
        <Select onValueChange={setSelectedBatchId} defaultValue="all">
          <SelectTrigger className="w-[280px]">
            <SelectValue placeholder="কোর্স অনুযায়ী ফিল্টার করুন" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">সকল ব্যাচ</SelectItem>
            {batches.map((batch) => (
              <SelectItem key={batch.id} value={batch.id}>
                {batch.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 md:gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-2 text-center">
              <p className="text-sm text-muted-foreground">মোট পরীক্ষা</p>
              <p className="text-3xl font-bold text-primary">{totalAttempts}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="space-y-2 text-center">
              <p className="text-sm text-muted-foreground">গড় স্কোর</p>
              <p className="text-3xl font-bold text-blue-600">
                {parseFloat(String(averageScore)).toFixed(2)}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="space-y-2 text-center">
              <p className="text-sm text-muted-foreground">সর্বোচ্চ স্কোর</p>
              <p className="text-3xl font-bold text-green-600">
                {parseFloat(String(bestScore)).toFixed(2)}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Results */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>বিস্তারিত ফলাফল</CardTitle>
              <CardDescription>সব পরীক্ষার ফলাফল</CardDescription>
            </div>
            <Tabs
              value={sortBy}
              onValueChange={(v) => setSortBy(v as "recent" | "score")}
            >
              <TabsList>
                <TabsTrigger value="recent">সাম্প্রতিক</TabsTrigger>
                <TabsTrigger value="score">স্কোর</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {sortedResults.length > 0 ? (
              sortedResults.map((result) => {
                const totalQuestions =
                  result.correct_answers +
                  result.wrong_answers +
                  result.unattempted;
                const totalMarks = totalQuestions * result.marks_per_question;
                return (
                  <div
                    key={result.id}
                    className="border rounded-lg p-4 space-y-4"
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h3 className="font-semibold text-lg">
                          {result.exam_name}
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          {formatDate(result.submitted_at)}
                        </p>
                      </div>
                      <Badge
                        className={`text-base px-3 py-1 ${getScoreBadgeColor(result.score, totalMarks)}`}
                      >
                        {parseFloat(String(result.score)).toFixed(2)}
                      </Badge>
                    </div>

                    {/* Score Feedback */}
                    <div className="flex items-center gap-2">
                      {getScoreFeedbackIcon(result.score, totalMarks)}
                      <span className="text-sm font-medium">
                        {getScoreFeedback(result.score, totalMarks)}
                      </span>
                    </div>

                    {/* Score Bar */}
                    <Progress
                      value={
                        totalMarks > 0 ? (result.score / totalMarks) * 100 : 0
                      }
                      className="h-2"
                    />

                    {/* Statistics */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 md:gap-4 text-sm">
                      <div>
                        <p className="text-muted-foreground">সঠিক</p>
                        <p className="text-lg font-bold text-green-600">
                          {result.correct_answers}
                        </p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">ভুল</p>
                        <p className="text-lg font-bold text-red-600">
                          {result.wrong_answers}
                        </p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">মোট মার্কস</p>
                        <p className="text-lg font-bold text-gray-600">
                          {parseFloat(String(totalMarks)).toFixed(2)}
                        </p>
                      </div>
                    </div>
                    <div className="pt-4 flex justify-end">
                      <Link
                        href={`/dashboard/exams/${result.exam_id}/leaderboard`}
                      >
                        <Button variant="outline" size="sm">
                          <Trophy className="h-4 w-4 mr-2" />
                          লিডারবোর্ড
                        </Button>
                      </Link>
                    </div>
                  </div>
                );
              })
            ) : (
              <p className="text-center text-muted-foreground py-8">
                এই কোর্সের জন্য কোনো ফলাফল পাওয়া যায়নি।
              </p>
            )}
          </div>
        </CardContent>
      </Card>
      <hr className="h-20 border-transparent" />
    </div>
  );
}
