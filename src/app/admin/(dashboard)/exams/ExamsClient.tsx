"use client";

import { useState, useMemo } from "react";
import { useAdminAuth } from "@/context/AdminAuthContext";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { AdminExamCard } from "@/components";
import CustomLoader from "@/components/CustomLoader";
import type { Exam, Batch } from "@/lib/types";
import { ChevronDown } from "lucide-react";

export function ExamsClient({
  initialExams,
  initialBatches,
}: {
  initialExams: Exam[];
  initialBatches: Batch[];
}) {
  const { admin } = useAdminAuth();
  const [exams, setExams] = useState<Exam[]>(initialExams);

  // For admin, show all exams, not just running ones
  const allExams = useMemo(() => {
    return exams;
  }, [exams]);

  const publicExams = useMemo(
    () => allExams.filter((exam) => !exam.batch_id),
    [allExams],
  );

  const batchedExams = useMemo(
    () =>
      initialBatches
        .map((batch) => ({
          ...batch,
          exams: allExams.filter((exam) => exam.batch_id === batch.id),
        }))
        .filter((batch) => batch.exams.length > 0),
    [allExams, initialBatches],
  );

  if (!admin) {
    return (
      <div className="container mx-auto p-1 md:p-2 lg:p-4 flex items-center justify-center min-h-[50vh]">
        <CustomLoader />
      </div>
    );
  }

  const renderExamGrid = (examsToRender: Exam[]) => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {examsToRender.map((exam) => (
        <AdminExamCard
          key={exam.id}
          exam={exam}
          onDelete={() =>
            setExams((prev) => prev.filter((e) => e.id !== exam.id))
          }
          onUpdate={(updatedExam) =>
            setExams((prev) =>
              prev.map((e) => (e.id === updatedExam.id ? updatedExam : e)),
            )
          }
        />
      ))}
    </div>
  );

  return (
    <div className="container mx-auto p-2 md:p-4 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>সকল পরীক্ষা (অ্যাডমিন)</CardTitle>
          <CardDescription>
            সকল পাবলিক ও ব্যাচ-ভিত্তিক পরীক্ষাগুলি এখানে দেখুন এবং পরিচালনা করুন
          </CardDescription>
        </CardHeader>
        <CardContent className="p-2 md:p-6">
          <div className="space-y-4">
            <Collapsible className="rounded-lg border" defaultOpen={true}>
              <CollapsibleTrigger className="flex w-full items-center justify-between p-2 md:p-4 font-semibold">
                <span>পাবলিক পরীক্ষা ({publicExams.length})</span>
                <ChevronDown className="h-5 w-5 transition-transform duration-300 [&[data-state=open]]:rotate-180" />
              </CollapsibleTrigger>
              <CollapsibleContent className="p-2 md:p-4 pt-0">
                {publicExams.length > 0 ? (
                  renderExamGrid(publicExams)
                ) : (
                  <p className="text-muted-foreground text-sm">
                    কোনো পাবলিক পরীক্ষা নেই।
                  </p>
                )}
              </CollapsibleContent>
            </Collapsible>

            {batchedExams.map((batch) => (
              <Collapsible
                key={batch.id}
                className="rounded-lg border"
                defaultOpen={true}
              >
                <CollapsibleTrigger className="flex w-full items-center justify-between p-2 md:p-4 font-semibold">
                  <span>
                    {batch.name} ({batch.exams.length})
                  </span>
                  <ChevronDown className="h-5 w-5 transition-transform duration-300 [&[data-state=open]]:rotate-180" />
                </CollapsibleTrigger>
                <CollapsibleContent className="p-2 md:p-4 pt-0">
                  {renderExamGrid(batch.exams)}
                </CollapsibleContent>
              </Collapsible>
            ))}
          </div>
        </CardContent>
      </Card>
      <hr className="h-16 border-transparent" />
    </div>
  );
}
