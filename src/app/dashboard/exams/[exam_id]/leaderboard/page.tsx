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

  // Calculate summary statistics
  const avgScore =
    results.length > 0
      ? results.reduce((sum, r) => sum + parseFloat(String(r.score || 0)), 0) /
        results.length
      : 0;
  const maxScore = Math.max(
    ...results.map((r) => parseFloat(String(r.score || 0))),
    0,
  );
  const minScore =
    results.length > 0
      ? Math.min(...results.map((r) => parseFloat(String(r.score || 0))))
      : 0;

  return (
    <div className="container mx-auto p-1 md:p-2 lg:p-4 space-y-6 max-w-6xl">
      <PageHeader
        title={`${exam?.name || "লিডারবোর্ড"}`}
        description="এই পরীক্ষায় অংশগ্রহণকারীদের র‌্যাঙ্কিং"
      />

      {/* Exam Time Information */}
      {(exam?.start_at || exam?.end_at) && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">পরীক্ষার সময়কাল</CardTitle>
            <CardDescription>পরীক্ষার শুরু ও শেষের সময়</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-4">
            {exam.start_at && (
              <div className="flex-1 min-w-[200px]">
                <h4 className="text-sm font-medium text-muted-foreground mb-1">
                  শুরুর সময়
                </h4>
                <p className="font-medium">
                  {formatExamDateTime(exam.start_at)}
                </p>
              </div>
            )}
            {exam.end_at && (
              <div className="flex-1 min-w-[200px]">
                <h4 className="text-sm font-medium text-muted-foreground mb-1">
                  শেষ সময়
                </h4>
                <p className="font-medium">{formatExamDateTime(exam.end_at)}</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2 md:gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              মোট অংশগ্রহণকারী
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{results.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">গড় স্কোর</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {parseFloat(String(avgScore)).toFixed(2)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              সর্বোচ্চ স্কোর
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {parseFloat(String(maxScore)).toFixed(2)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              সর্বনিম্ন স্কোর
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {parseFloat(String(minScore)).toFixed(2)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Results Table */}
      <Card>
        <CardHeader>
          <CardTitle>ফলাফল তালিকা</CardTitle>
          <CardDescription>
            সর্বোচ্চ স্কোর থেকে সর্বনিম্ন স্কোরের ক্রমানুসারে সাজানো
          </CardDescription>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <Table className="min-w-full">
            <TableHeader className="hidden md:table-header-group">
              <TableRow>
                <TableHead>র‌্যাঙ্ক</TableHead>
                <TableHead>রোল</TableHead>
                <TableHead>নাম</TableHead>
                <TableHead className="text-right">স্কোর</TableHead>
                <TableHead className="text-center">সঠিক</TableHead>
                <TableHead className="text-center">ভুল</TableHead>
                <TableHead className="text-center">উত্তর না দেওয়া</TableHead>
                <TableHead>সময়</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {results.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={8}
                    className="h-24 text-center text-muted-foreground"
                  >
                    এখনো কোনো ফলাফল পাওয়া যায়নি।
                  </TableCell>
                </TableRow>
              ) : (
                results.map((result, idx) => (
                  <TableRow
                    key={result.id}
                    className={
                      result.student.roll === user?.roll
                        ? "bg-primary/10 md:table-row"
                        : "md:table-row"
                    }
                  >
                    {/* Mobile view - collapsed card style */}
                    <TableCell className="md:hidden p-0">
                      <div className="border rounded-lg p-3 mb-2">
                        <div className="flex justify-between items-start">
                          <div>
                            <span className="font-medium">র‌্যাঙ্ক: </span>
                            <span>{idx + 1}</span>
                          </div>
                        </div>
                        <div className="mt-2">
                          <div>
                            <span className="font-medium">রোল: </span>
                            {maskMobileNumber(result.student.roll)}
                          </div>
                          <div>
                            <span className="font-medium">নাম: </span>
                            {result.student.name}
                          </div>
                          <div>
                            <span className="font-medium">স্কোর: </span>
                            <span className="font-bold">
                              {result.score
                                ? parseFloat(String(result.score)).toFixed(2)
                                : 0}
                            </span>
                          </div>
                          <div className="flex gap-2 mt-1">
                            <span className="text-green-600">
                              <span className="font-medium">সঠিক: </span>
                              {result.correct_answers || 0}
                            </span>
                            <span className="text-destructive">
                              <span className="font-medium">ভুল: </span>
                              {result.wrong_answers || 0}
                            </span>
                            <span className="text-muted-foreground">
                              <span className="font-medium">
                                উত্তর না দেওয়া:{" "}
                              </span>
                              {result.unattempted || 0}
                            </span>
                          </div>
                          <div>
                            <span className="font-medium">সময়: </span>
                            {new Date(result.submitted_at).toLocaleString(
                              "bn-BD",
                              {
                                timeZone: "Asia/Dhaka",
                              },
                            )}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    {/* Desktop view - normal table cells */}
                    <TableCell className="hidden md:table-cell">
                      {idx + 1}
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      {maskMobileNumber(result.student.roll)}
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      {result.student.name}
                    </TableCell>
                    <TableCell className="hidden md:table-cell text-right font-bold">
                      {result.score
                        ? parseFloat(String(result.score)).toFixed(2)
                        : 0}
                    </TableCell>
                    <TableCell className="hidden md:table-cell text-center text-green-600">
                      {result.correct_answers || 0}
                    </TableCell>
                    <TableCell className="hidden md:table-cell text-center text-destructive">
                      {result.wrong_answers || 0}
                    </TableCell>
                    <TableCell className="hidden md:table-cell text-center text-muted-foreground">
                      {result.unattempted || 0}
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      {new Date(result.submitted_at).toLocaleString("bn-BD", {
                        timeZone: "Asia/Dhaka",
                      })}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
