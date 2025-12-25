"use client";

import { useState, useEffect } from "react";
import { apiRequest } from "@/lib/api";
import { useParams } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { PageHeader, CustomLoader } from "@/components";
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
import type { Batch, Exam } from "@/lib/types";

export const runtime = "edge";

interface LeaderboardEntry {
  student_id: string;
  student_name: string;
  student_roll: string;
  total_score: number;
}

interface ApiResult {
  student_id: string;
  exam_id: string;
  student_name: string;
  student_roll: string;
  correct_answers: string;
  wrong_answers: string;
}

export default function BatchLeaderboardPage() {
  const { user } = useAuth();
  const params = useParams();
  const { toast } = useToast();

  const batch_id = params.batch_id as string;
  const [batch, setBatch] = useState<Batch | null>(null);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!batch_id) return;

    const loadData = async () => {
      setLoading(true);
      try {
        // Fetch batch details
        const batchResult = await apiRequest<Batch>("batches", "GET", null, {
          id: batch_id,
        });
        if (!batchResult.success || !batchResult.data)
          throw new Error(batchResult.message);
        setBatch(batchResult.data);

        // Fetch exams for the batch
        const examsResult = await apiRequest<Exam[]>("exams", "GET", null, {
          batch_id,
        });
        if (!examsResult.success || !examsResult.data)
          throw new Error(examsResult.message);
        const exams = examsResult.data;

        const examIds = exams.map((exam) => exam.id);
        const negativeMarksMap = new Map(
          exams.map((e) => [e.id, e.negative_marks_per_wrong ?? 0]),
        );

        if (examIds.length === 0) {
          setLeaderboard([]);
          setLoading(false);
          return;
        }

        // Fetch all results for these exams
        // We need a way to fetch results for multiple exams or a batch
        // I'll update results.php to support batch_id
        const resultsResult = await apiRequest<ApiResult[]>(
          "results",
          "GET",
          null,
          {
            batch_id,
          },
        );
        if (!resultsResult.success || !resultsResult.data)
          throw new Error(resultsResult.message);
        const results = resultsResult.data;

        // Process results
        const studentScores: {
          [key: string]: { name: string; roll: string; total_score: number };
        } = {};

        results.forEach((result) => {
          const studentUid = result.student_id;
          if (!studentUid) return;

          const negativeMarks = negativeMarksMap.get(result.exam_id) || 0;
          const score =
            (parseFloat(result.correct_answers) || 0) -
            (parseFloat(result.wrong_answers) || 0) * negativeMarks;

          if (!studentScores[studentUid]) {
            studentScores[studentUid] = {
              name: result.student_name,
              roll: result.student_roll,
              total_score: 0,
            };
          }
          studentScores[studentUid].total_score += score;
        });

        const finalLeaderboard = Object.entries(studentScores).map(
          ([uid, data]) => ({
            student_id: uid,
            student_name: data.name,
            student_roll: data.roll,
            total_score: data.total_score,
          }),
        );

        finalLeaderboard.sort((a, b) => b.total_score - a.total_score);

        setLeaderboard(finalLeaderboard);
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
  }, [batch_id, toast]);

  if (loading) {
    return <CustomLoader />;
  }

  return (
    <div className="container mx-auto p-2 md:p-4 space-y-6">
      <PageHeader
        title={`${batch?.name || "ব্যাচ"} - লিডারবোর্ড`}
        description="এই ব্যাচের সকল পরীক্ষার সম্মিলিত ফলাফল"
      />
      <Card>
        <CardHeader>
          <CardTitle>সার্বিক ফলাফল তালিকা</CardTitle>
          <CardDescription>
            সর্বোচ্চ মোট স্কোর থেকে সর্বনিম্ন স্কোরের ক্রমানুসারে সাজানো
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
                    মোট স্কোর
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {leaderboard.length > 0 ? (
                  leaderboard.map((entry, idx) => (
                    <TableRow
                      key={entry.student_id}
                      className={
                        entry.student_id === user?.uid ? "bg-primary/10" : ""
                      }
                    >
                      <TableCell className="font-medium whitespace-nowrap">
                        {idx + 1}
                      </TableCell>
                      <TableCell className="min-w-[120px]">
                        {entry.student_name}
                      </TableCell>
                      <TableCell className="whitespace-nowrap">
                        {entry.student_roll}
                      </TableCell>
                      <TableCell className="text-right font-bold whitespace-nowrap">
                        {parseFloat(String(entry.total_score)).toFixed(2)}
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
