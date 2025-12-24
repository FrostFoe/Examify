import { apiRequest } from "@/lib/api";
import type { Exam, Batch } from "@/lib/types";
import { ExamsClient } from "./ExamsClient";

async function getExams() {
  const result = await apiRequest<Exam[]>("exams");
  return {
    exams: result.data || [],
    error: result.success ? null : { message: result.message },
  };
}

async function getBatches() {
  const result = await apiRequest<Batch[]>("batches");
  return {
    batches: result.data || [],
    error: result.success ? null : { message: result.message },
  };
}

export default async function AdminExamsPage() {
  const [{ exams, error: examsError }, { batches, error: batchesError }] =
    await Promise.all([getExams(), getBatches()]);

  if (examsError || batchesError) {
    const errorMessages = [];
    if (examsError) errorMessages.push(examsError.message);
    if (batchesError) errorMessages.push(batchesError.message);
    return <p>তথ্য আনতে সমস্যা হয়েছে: {errorMessages.join(", ")}</p>;
  }

  return <ExamsClient initialExams={exams} initialBatches={batches} />;
}
