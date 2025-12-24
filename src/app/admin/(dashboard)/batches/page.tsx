import { apiRequest } from "@/lib/api";
import type { Batch } from "@/lib/types";
import { BatchesClient } from "./BatchesClient";

export default async function AdminBatchesPage() {
  const result = await apiRequest<Batch[]>("batches");

  if (!result.success || !result.data) {
    console.error("ব্যাচ আনতে সমস্যা হয়েছে:", result.message);
    return <p>ব্যাচ আনতে সমস্যা হয়েছে: {result.message}</p>;
  }

  return <BatchesClient initialBatches={result.data} />;
}
