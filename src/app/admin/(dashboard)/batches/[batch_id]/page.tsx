import { apiRequest } from "@/lib/api";
import type { Batch, Exam, User } from "@/lib/types";
import { BatchDetailsClient } from "./BatchDetailsClient";
import { use } from "react";

export const runtime = "edge";

async function getBatchDetails(batch_id: string) {
  const result = await apiRequest<Batch>("batches", "GET", null, {
    id: batch_id,
  });
  return {
    batch: result.data as Batch,
    error: result.success ? null : { message: result.message },
  };
}

async function getExams(batch_id: string) {
  const result = await apiRequest<Exam[]>("exams", "GET", null, { batch_id });
  return {
    exams: result.data || [],
    error: result.success ? null : { message: result.message },
  };
}

async function getEnrolledStudents(batch_id: string) {
  const result = await apiRequest<User[]>("students", "GET", null, {
    batch_id,
  });
  return {
    students: result.data || [],
    error: result.success ? null : { message: result.message },
  };
}

export default function BatchExamsPage({
  params,
}: {
  params: Promise<{ batch_id: string }>;
}) {
  const { batch_id } = use(params);

  const [batchResult, examsResult, studentsResult] = use(
    Promise.all([
      getBatchDetails(batch_id),
      getExams(batch_id),
      getEnrolledStudents(batch_id),
    ]),
  );

  const { batch, error: batchError } = batchResult;
  const { exams, error: examsError } = examsResult;
  const { students, error: studentsError } = studentsResult;

  if (batchError || examsError || studentsError) {
    const errorMessages = [];
    if (batchError) errorMessages.push(batchError.message);
    if (examsError) errorMessages.push(examsError.message);
    if (studentsError) errorMessages.push(studentsError.message);
    return <p>তথ্য আনতে সমস্যা হয়েছে: {errorMessages.join(", ")}</p>;
  }

  return (
    <BatchDetailsClient
      initialBatch={batch}
      initialExams={exams}
      initialEnrolledStudents={students}
    />
  );
}
