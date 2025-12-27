"use client";

import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { Batch } from "@/lib/types";
import { FileText, Trophy } from "lucide-react";

interface StudentBatchCardProps {
  batch: Batch;
}

export function StudentBatchCard({ batch }: StudentBatchCardProps) {
  const isBase64 = batch.icon_url?.startsWith("data:image");

  return (
    <Card className="overflow-hidden">
      {batch.icon_url ? (
        <div className="relative aspect-[16/9] w-full">
          <Image
            src={batch.icon_url}
            alt={batch.name}
            fill
            className="object-cover"
            priority={false}
          />
        </div>
      ) : (
        <div className="aspect-[16/9] w-full bg-muted flex items-center justify-center">
          <p className="text-sm text-muted-foreground">No Image</p>
        </div>
      )}
      <CardHeader>
        <CardTitle>{batch.name}</CardTitle>
        <CardDescription>
          {batch.description
            ? batch.description.substring(0, 60) +
              (batch.description.length > 60 ? "..." : "")
            : "No description"}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-2">
        <div className="flex items-center gap-2">
          <span
            className={`px-2 py-1 rounded text-xs font-medium ${
              batch.status === "live"
                ? "bg-green-500/20 text-green-700"
                : "bg-gray-500/20 text-gray-700"
            }`}
          >
            {batch.status === "live" ? "লাইভ" : "শেষ"}
          </span>
          {batch.is_public && (
            <span className="px-2 py-1 rounded text-xs font-medium bg-primary/10 text-primary">
              পাবলিক
            </span>
          )}
        </div>
        <div className="text-sm text-muted-foreground">
          তৈরি হয়েছে:{" "}
          {new Date(batch.created_at).toLocaleDateString("bn-BD", {
            timeZone: "Asia/Dhaka",
          })}
        </div>
      </CardContent>
      <CardFooter className="flex justify-start gap-2">
        <Link href={`/dashboard/batches/${batch.id}`}>
          <Button variant="outline" size="sm">
            <FileText className="h-4 w-4 mr-2" />
            পরীক্ষা দেখুন
          </Button>
        </Link>
        <Link href={`/dashboard/batches/${batch.id}/leaderboard`}>
          <Button variant="secondary" size="sm">
            <Trophy className="h-4 w-4 mr-2" />
            লিডারবোর্ড
          </Button>
        </Link>
      </CardFooter>
    </Card>
  );
}
