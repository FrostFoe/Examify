"use client";

import { useState, useEffect } from "react";
import { apiRequest } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { StudentBatchCard } from "@/components/StudentBatchCard";
import { PageHeader, EmptyState, CustomLoader } from "@/components";
import { BookOpen, Users, Globe } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { Batch } from "@/lib/types";

export default function StudentBatchesPage() {
  const { user, loading: authLoading } = useAuth();
  const [enrolledBatches, setEnrolledBatches] = useState<Batch[]>([]);
  const [publicBatches, setPublicBatches] = useState<Batch[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && user?.uid) {
      fetchStudentBatches();
    }
    if (!authLoading) {
      fetchPublicBatches();
    }
  }, [user, authLoading]);

  const fetchStudentBatches = async () => {
    if (!user?.uid) {
      setLoading(false);
      return;
    }

    setLoading(true);
    const result = await apiRequest<Batch[]>("batches", "GET", null, {
      enrolled_by: user.uid,
      is_public: "false",
    });

    if (result.success && result.data) {
      setEnrolledBatches(result.data);
    }
    setLoading(false);
  };

  const fetchPublicBatches = async () => {
    setLoading(true);
    try {
      const result = await apiRequest<Batch[]>("batches", "GET", null, {
        is_public: "true",
      });
      setPublicBatches(result.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading || authLoading) {
    return <CustomLoader />;
  }

  return (
    <div className="container mx-auto p-2 md:p-4 space-y-6">
      <PageHeader
        title="সকল ব্যাচ"
        description="আপনার ভর্তি হওয়া এবং পাবলিক ব্যাচগুলোর তালিকা।"
      />

      <Tabs defaultValue="my-batches" className="w-full">
        <TabsList className="grid w-full grid-cols-2 max-w-md mx-auto">
          <TabsTrigger value="my-batches">
            <Users className="h-4 w-4 mr-2" />
            আমার ব্যাচ
          </TabsTrigger>
          <TabsTrigger value="public-batches">
            <Globe className="h-4 w-4 mr-2" />
            পাবলিক ব্যাচ
          </TabsTrigger>
        </TabsList>
        <TabsContent value="my-batches" className="mt-6">
          {user ? (
            enrolledBatches.length > 0 ? (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {enrolledBatches.map((batch) => (
                  <StudentBatchCard key={batch.id} batch={batch} />
                ))}
              </div>
            ) : (
              <EmptyState
                icon={<BookOpen className="h-12 w-12 text-primary" />}
                title="কোনো ব্যাচে ভর্তি হননি"
                description="আপনি কোনো ব্যাচে ভর্তি নন। পাবলিক ব্যাচ ট্যাবে সকল ব্যাচগুলো দেখুন।"
              />
            )
          ) : (
            <EmptyState
              icon={<BookOpen className="h-12 w-12 text-primary" />}
              title="লগইন করুন"
              description="আপনার ভর্তি হওয়া ব্যাচগুলো দেখতে লগইন করুন।"
            />
          )}
        </TabsContent>
        <TabsContent value="public-batches" className="mt-6">
          {publicBatches.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {publicBatches.map((batch) => (
                <StudentBatchCard key={batch.id} batch={batch} />
              ))}
            </div>
          ) : (
            <EmptyState
              icon={<BookOpen className="h-12 w-12 text-primary" />}
              title="কোনো পাবলিক ব্যাচ পাওয়া যায়নি"
              description="শীঘ্রই পাবলিক ব্যাচ যোগ করা হবে।"
            />
          )}
        </TabsContent>
      </Tabs>
      <hr className="h-20 border-transparent" />
    </div>
  );
}
