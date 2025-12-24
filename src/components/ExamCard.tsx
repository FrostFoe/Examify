"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Zap,
  CheckCircle2,
  Trophy,
  RotateCw,
  FileText,
  Settings,
} from "lucide-react";
import type { Exam, StudentExam } from "@/lib/types";

interface ExamCardProps {
  exam: Exam;
  result?: StudentExam;
}

export function ExamCard({ exam, result }: ExamCardProps) {
  const now = new Date();
  const startAt = exam.start_at ? new Date(exam.start_at) : null;
  const endAt = exam.end_at ? new Date(exam.end_at) : null;
  const isPractice =
    !!exam.is_practice ||
    exam.type === "practice" ||
    exam.category === "practice";

  const notStarted = !isPractice && startAt !== null && now < startAt;

  const handleTakeExam = () => {
    if (notStarted) return;
    window.location.href = `/dashboard/exams/${exam.id}`;
  };

  const handleViewSolution = () => {
    window.location.href = `/dashboard/exams/${exam.id}/solve`;
  };

  return (
    <div className="group block w-full max-w-sm mx-auto border border-neutral-200 dark:border-neutral-800 rounded-lg shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden bg-white dark:bg-neutral-950">
      {/* Image Section - Gradient Background */}
      <div
        className={`relative h-40 md:h-48 flex items-center justify-center overflow-hidden transition-colors duration-300 ${
          result
            ? "bg-gradient-to-br from-green-500/20 to-green-500/5 dark:from-green-500/30 dark:to-green-500/10 group-hover:from-green-500/30 group-hover:to-green-500/10"
            : "bg-gradient-to-br from-primary/20 to-primary/5 dark:from-primary/30 dark:to-primary/10 group-hover:from-primary/30 group-hover:to-primary/10"
        }`}
      >
        <div className="text-center px-4">
          <p
            className={`text-sm font-medium mb-2 ${result ? "text-green-700 dark:text-green-600" : "text-primary/70 dark:text-primary/60"}`}
          >
            {result ? "ফলাফল" : "পরীক্ষা ID"}
          </p>
          <p
            className={`text-3xl md:text-4xl font-light tracking-tight transition-colors truncate ${
              result
                ? "text-green-700 dark:text-green-500 group-hover:text-green-800"
                : "text-primary dark:text-primary group-hover:text-primary/80"
            }`}
          >
            {result && result.score !== null && result.score !== undefined
              ? `${parseFloat(String(result.score)).toFixed(0)}%`
              : exam.id.slice(0, 8).toUpperCase()}
          </p>
        </div>
      </div>

      {/* Content Section */}
      <div className="p-4 md:p-6 text-center">
        {/* Badge */}
        <div
          className={`inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-sm mb-4 ${
            result
              ? "bg-green-100 text-green-800 border border-green-200"
              : "bg-primary/10 dark:bg-primary/20 border border-primary/20 dark:border-primary/30 text-primary dark:text-primary"
          }`}
        >
          {result ? (
            <CheckCircle2 className="w-3 h-3" />
          ) : (
            <Zap className="w-3 h-3" />
          )}
          {result ? "সম্পন্ন" : "পরীক্ষা"}
        </div>

        {/* Title */}
        <h5 className="mt-1 text-lg md:text-xl font-semibold tracking-tight text-neutral-900 dark:text-neutral-50 group-hover:text-primary dark:group-hover:text-primary transition-colors line-clamp-2 min-h-[3rem]">
          {exam.name}
        </h5>
        {exam.course_name && (
          <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1 mb-3 truncate">
            {exam.course_name}
          </p>
        )}

        {/* Date */}
        <p className="text-xs md:text-sm text-neutral-600 dark:text-neutral-400 mb-4">
          তারিখ:{" "}
          {new Date(exam.created_at).toLocaleDateString("bn-BD", {
            timeZone: "Asia/Dhaka",
          })}
        </p>

        <div className="flex flex-col gap-2 w-full">
          {result ? (
            <>
              <div className="grid grid-cols-2 gap-2 w-full">
                <Button
                  onClick={handleViewSolution}
                  variant="secondary"
                  size="sm"
                  className="w-full text-[10px] md:text-xs"
                >
                  <FileText className="h-3 w-3 md:h-4 md:w-4 mr-1 md:mr-2" />
                  উত্তরপত্র
                </Button>
                <Link href={`/dashboard/exams/${exam.id}/leaderboard`} className="w-full">
                  <Button variant="outline" size="sm" className="w-full text-[10px] md:text-xs">
                    <Trophy className="h-3 w-3 md:h-4 md:w-4 mr-1 md:mr-2" />
                    লিডারবোর্ড
                  </Button>
                </Link>
              </div>
              <div className="w-full">
                <Button onClick={handleTakeExam} variant="default" size="sm" className="w-full text-[10px] md:text-xs">
                  <RotateCw className="h-3 w-3 md:h-4 md:w-4 mr-1 md:mr-2" />
                  আবার দিন
                </Button>
              </div>
            </>
          ) : (
            <button
              onClick={handleTakeExam}
              disabled={notStarted}
              className={`inline-flex items-center justify-center shadow-sm font-medium rounded-lg text-sm px-5 py-2.5 focus:outline-none transition-all duration-200 w-full ${
                notStarted
                  ? "text-muted-foreground bg-gray-100 border border-gray-200 cursor-not-allowed"
                  : "text-neutral-50 dark:text-neutral-950 bg-neutral-900 dark:bg-neutral-50 border border-neutral-900 dark:border-neutral-50 hover:bg-neutral-800 dark:hover:bg-neutral-100 focus:ring-4 focus:ring-neutral-300 dark:focus:ring-neutral-600"
              }`}
            >
              {notStarted ? "শুরু হয়নি" : "পরীক্ষা দিন"}
              {!notStarted && (
                <svg
                    className="w-4 h-4 ms-2 rtl:rotate-180"
                    aria-hidden="true"
                    xmlns="http://www.w3.org/2000/svg"
                    width="24"
                    height="24"
                    fill="none"
                    viewBox="0 0 24 24"
                >
                    <path
                    stroke="currentColor"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M19 12H5m14 0-4 4m4-4-4-4"
                    />
                </svg>
              )}
            </button>
          )}
        </div>

        {/* Show scheduling info under button when not started */}
        {notStarted && startAt && (
          <p className="text-xs text-muted-foreground mt-2">
            শুরুর সময়: {formatBnDateTime(startAt)}
            {endAt && <> • শেষ: {formatBnDateTime(endAt)}</>}
          </p>
        )}
      </div>
    </div>
  );
}

function formatBnDateTime(d: Date) {
  try {
    const datePart = new Intl.DateTimeFormat("bn-BD", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      timeZone: "Asia/Dhaka",
    }).format(d);

    const timePart = new Intl.DateTimeFormat("bn-BD", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
      timeZone: "Asia/Dhaka",
    }).format(d);

    return `${datePart} ${timePart}`;
  } catch {
    return d.toLocaleString("bn-BD", { timeZone: "Asia/Dhaka" });
  }
}
