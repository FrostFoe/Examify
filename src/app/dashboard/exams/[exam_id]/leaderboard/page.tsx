"use client";

import { useState, useEffect } from "react";
import { apiRequest } from "@/lib/api";
import { useParams } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { PageHeader, CustomLoader } from "@/components";
import { maskMobileNumber, formatExamDateTime } from "@/lib/utils";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import type { Exam } from "@/lib/types";

export const runtime = "edge";

interface StudentResult {
  id: string;
  student: {
    name: string;
    roll: string;
  };
  score: number;
  correct_answers: number;
  wrong_answers: number;
  unattempted: number;
  submitted_at: string;
}

interface ApiResult {
  id: string;
  student_name: string;
  student_roll: string;
  correct_answers: number;
  wrong_answers: number;
  unattempted: number;
  score: string;
  submitted_at: string;
}

export default function ExamLeaderboardPage() {
  const { user } = useAuth();
  const params = useParams();
  const { toast } = useToast();

  const exam_id = params.exam_id as string;
  const [exam, setExam] = useState<Exam | null>(null);
  const [results, setResults] = useState<StudentResult[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!exam_id) return;

    const loadData = async () => {
      setLoading(true);
      try {
        const examResult = await apiRequest<Exam>("exams", "GET", null, {
          id: exam_id,
        });
        if (!examResult.success || !examResult.data)
          throw new Error(examResult.message);
        const examData = examResult.data;
        setExam(examData);

        const resultsResult = await apiRequest<ApiResult[]>(
          "results",
          "GET",
          null,
          {
            exam_id: exam_id,
          },
        );
        if (!resultsResult.success || !resultsResult.data)
          throw new Error(resultsResult.message);

        setResults(
          resultsResult.data.map((r) => ({
            id: r.id,
            student: { name: r.student_name, roll: r.student_roll },
            score: parseFloat(r.score),
            correct_answers: r.correct_answers,
            wrong_answers: r.wrong_answers,
            unattempted: r.unattempted,
            submitted_at: r.submitted_at,
          })),
        );
      } catch (err) {
        console.error(err);
        toast({
          title: "লিডারবোর্ড লোড করতে ব্যর্থ",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [exam_id, toast]);

  if (loading) {
    return <CustomLoader />;
  }

  return (
    <div className="container mx-auto px-2 sm:px-4 md:px-6 py-4 max-w-6xl space-y-6">
      <PageHeader
        title={`${exam?.name || "লিডারবোর্ড"}`}
        description="এই পরীক্ষায় অংশগ্রহণকারীদের র‌্যাঙ্কিং"
      />
      <Card>
        <CardHeader>
          <CardTitle>ফলাফল তালিকা</CardTitle>
          <CardDescription>
            সর্বোচ্চ স্কোর থেকে সর্বনিম্ন স্কোরের ক্রমানুসারে সাজানো
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="relative w-full overflow-x-auto scrollbar-hide">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="whitespace-nowrap">র‌্যাঙ্ক</TableHead>
                  <TableHead className="whitespace-nowrap">নাম</TableHead>
                  <TableHead className="whitespace-nowrap">রোল</TableHead>
                  <TableHead className="text-right whitespace-nowrap">
                    স্কোর
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {results.length > 0 ? (
                  results.map((result, idx) => (
                    <TableRow
                      key={result.id}
                      className={
                        result.student.roll === user?.roll
                          ? "bg-primary/10"
                          : ""
                      }
                    >
                      <TableCell className="font-medium whitespace-nowrap">
                        {idx + 1}
                      </TableCell>
                      <TableCell className="min-w-[120px]">
                        {result.student.name}
                      </TableCell>
                      <TableCell className="whitespace-nowrap">
                        {maskMobileNumber(result.student.roll)}
                      </TableCell>
                      <TableCell className="text-right font-bold whitespace-nowrap">
                        {parseFloat(String(result.score)).toFixed(2)}
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={4} className="h-24 text-center">
                      এখনো কোনো ফলাফল পাওয়া যায়নি।
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
