"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { CustomLoader } from "@/components";

export default function Dashboard() {
  const router = useRouter();

  useEffect(() => {
    router.push("/dashboard/exams");
  }, [router]);

  return (
    <div className="w-full h-full flex items-center justify-center">
      <CustomLoader />
    </div>
  );
}