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
import { Pencil, Trash2, Users, FileText, Download } from "lucide-react";

interface BatchCardProps {
  batch: Batch;
  studentCount?: number;
  examCount?: number;
  onEdit?: (batch: Batch) => void;
  onDelete?: (batchId: string) => void;
  onExport?: (batchId: string) => void;
}

export function BatchCard({
  batch,
  studentCount,
  examCount,
  onEdit,
  onDelete,
  onExport,
}: BatchCardProps) {
  const isBase64 = batch.icon_url?.startsWith("data:image");

  return (
    <Card className="overflow-hidden">
      {batch.icon_url ? (
        <div className="relative aspect-[16/9] w-full">
          {isBase64 ? (
            <img
              src={batch.icon_url}
              alt={batch.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <Image
              src={batch.icon_url}
              alt={batch.name}
              fill
              className="object-cover"
              priority={false}
            />
          )}
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
        <div className="flex items-center gap-2 flex-wrap">
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
          {studentCount !== undefined && (
            <span className="flex items-center gap-1 px-2 py-1 rounded text-xs font-medium bg-muted text-muted-foreground">
              <Users className="h-3 w-3" />
              {studentCount}
            </span>
          )}
          {examCount !== undefined && (
            <span className="flex items-center gap-1 px-2 py-1 rounded text-xs font-medium bg-muted text-muted-foreground">
              <FileText className="h-3 w-3" />
              {examCount}
            </span>
          )}
        </div>
        <div className="text-sm text-muted-foreground pt-2">
          তৈরি হয়েছে:{" "}
          {new Date(batch.created_at).toLocaleDateString("bn-BD", {
            timeZone: "Asia/Dhaka",
          })}
        </div>
      </CardContent>
      <CardFooter className="flex justify-between">
        <Link href={`/admin/batches/${batch.id}`}>
          <Button variant="outline" size="sm">
            পরীক্ষা দেখুন
          </Button>
        </Link>
        <div className="space-x-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => onExport?.(batch.id)}
          >
            <Download className="h-4 w-4" />
          </Button>
          <Button variant="secondary" size="sm" onClick={() => onEdit?.(batch)}>
            <Pencil className="h-4 w-4" />
          </Button>
          <Button
            variant="destructive"
            size="sm"
            onClick={() => onDelete?.(batch.id)}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
}
