"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { apiRequest } from "@/lib/api";
import { fetchQuestions, type RawQuestion } from "@/lib/fetchQuestions";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { CustomLoader } from "@/components";
import {
  Alert,
  AlertDescription as AlertDescriptionComponent,
} from "@/components/ui/alert";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription as DialogDescriptionComponent,
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import type { Exam, Question } from "@/lib/types";
import {
  QUESTIONS_PER_PAGE,
  QUESTIONS_PER_PAGE_MOBILE,
  CRITICAL_TIME_THRESHOLD,
  TIMER_CLASSES,
  BREAKPOINTS,
} from "@/lib/examConstants";
import { ExamInstructions } from "@/components/ExamInstruction";
import LatexRenderer from "@/components/LatexRenderer";
import {
  Clock,
  Flag,
  ArrowLeft,
  Eye,
  ArrowRight,
  Send,
  CheckCircle2,
  BookOpen,
  Zap,
  ListChecks,
  HelpCircle,
} from "lucide-react";
import type { Batch, User } from "@/lib/types";
import { cn } from "@/lib/utils";

export const runtime = "edge";

function formatTime(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  if (hours > 0) {
    return `${hours}h ${minutes}m ${secs}s`;
  }
  return `${minutes}m ${secs}s`;
}

function shuffleArray<T>(array: T[]): T[] {
  const newArray = [...array];
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
  }
  return newArray;
}

const subjectsMap: { [key: string]: string } = {
  p: "পদার্থবিজ্ঞান",
  c: "রসায়ন",
  m: "উচ্চতর গণিত",
  b: "জীববিজ্ঞান",
  bm: "জীববিজ্ঞান + উচ্চতর গণিত",
  bn: "বাংলা",
  e: "ইংরেজী",
  i: "আইসিটি",
  gk: "জিকে",
  iq: "আইকিউ",
};

const getSubjectName = (id: string) => subjectsMap[id] || id;

function SubjectSelectionScreen({
  exam,
  onStart,
  questionCount,
}: {
  exam: Exam;
  onStart: (selectedSubjects: string[]) => void;
  questionCount: number;
}) {
  const mandatorySubjects = exam.mandatory_subjects || [];
  const optionalSubjects = exam.optional_subjects || [];
  const totalSubjectsToAnswer = exam.total_subjects || 0;

  const numMandatory = mandatorySubjects.length;
  const numToSelectFromOptional = totalSubjectsToAnswer - numMandatory;

  const [selectedOptional, setSelectedOptional] = useState<string[]>([]);

  const handleOptionalSelect = (subjectId: string) => {
    setSelectedOptional((prev) => {
      if (prev.includes(subjectId)) {
        return prev.filter((s) => s !== subjectId);
      }
      if (prev.length < numToSelectFromOptional) {
        return [...prev, subjectId];
      }
      return prev;
    });
  };

  const canStart = selectedOptional.length === numToSelectFromOptional;

  const handleStartClick = () => {
    if (canStart) {
      onStart([...mandatorySubjects, ...selectedOptional]);
    }
  };

  const parseDateField = (keys: string[]) => {
    const examRecord = exam as Record<string, unknown> | null;
    for (const k of keys) {
      const v = examRecord ? examRecord[k] : undefined;
      if (!v) continue;
      const d = new Date(String(v));
      if (!isNaN(d.getTime())) return d;
    }
    return null;
  };

  const startDate = parseDateField([
    "start_at",
    "start_time",
    "starts_at",
    "start",
    "startDate",
  ]);
  const endDate = parseDateField([
    "end_at",
    "end_time",
    "ends_at",
    "end",
    "endDate",
  ]);
  const isPractice = exam?.is_practice;

  return (
    <div className="container mx-auto p-4 flex items-center justify-center min-h-screen">
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-center">
            {exam.name}
          </CardTitle>
          <CardDescription className="text-center">
            অনুগ্রহ করে আপনার বিষয় নির্বাচন করুন
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <Card className="mb-4">
            <CardContent className="pt-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-center text-center gap-2">
                <div>
                  {isPractice ? (
                    <div className="text-sm font-semibold">
                      এটি একটি প্রাকটিস পরীক্ষা — আনলিমিটেড প্রবেশাধিকার
                    </div>
                  ) : (
                    <div className="space-y-1 text-sm">
                      {startDate && (
                        <div>
                          <strong>শুরুর সময়:</strong>{" "}
                          {startDate.toLocaleString("bn-BD", {
                            timeZone: "Asia/Dhaka",
                          })}
                        </div>
                      )}
                      {endDate && (
                        <div>
                          <strong>সম্ভাব্য শেষ সময়:</strong>{" "}
                          {endDate.toLocaleString("bn-BD", {
                            timeZone: "Asia/Dhaka",
                          })}
                        </div>
                      )}
                      {!startDate && !endDate && (
                        <div>
                          এই পরীক্ষার কোনো নির্দিষ্ট সময়সীমা সেট করা হয়নি।
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
              <BookOpen className="h-5 w-5 text-primary" />
              <div>
                <p className="font-semibold">বিষয়</p>
                <p>{exam.course_name || "সাধারণ"}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
              <ListChecks className="h-5 w-5 text-primary" />
              <div>
                <p className="font-semibold">প্রশ্ন সংখ্যা</p>
                <p>{questionCount} টি</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
              <Clock className="h-5 w-5 text-primary" />
              <div>
                <p className="font-semibold">সময়</p>
                <p>{exam.duration_minutes} মিনিট</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
              <HelpCircle className="h-5 w-5 text-primary" />
              <div>
                <p className="font-semibold">নেগেটিভ মার্ক</p>
                <p>{exam.negative_marks_per_wrong || 0} প্রতি ভুল উত্তরে</p>
              </div>
            </div>
          </div>

          {numMandatory > 0 && (
            <div>
              <h3 className="font-semibold mb-2">বাধ্যতামূলক বিষয়</h3>
              <div className="flex flex-wrap gap-2">
                {mandatorySubjects.map((sub) => (
                  <Badge key={sub} variant="secondary">
                    {getSubjectName(sub)}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {numToSelectFromOptional > 0 && optionalSubjects.length > 0 && (
            <div>
              <h3 className="font-semibold mb-2 text-sm md:text-base">
                ঐচ্ছিক বিষয় (যেকোনো {numToSelectFromOptional}টি)
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4">
                {optionalSubjects.map((sub) => {
                  const isChecked = selectedOptional.includes(sub);
                  const isDisabled =
                    !isChecked &&
                    selectedOptional.length >= numToSelectFromOptional;
                  return (
                    <label
                      key={sub}
                      className={`flex items-center space-x-3 p-3 rounded-xl border-2 transition-all cursor-pointer ${
                        isChecked 
                          ? "border-primary bg-primary/5 ring-1 ring-primary/10" 
                          : isDisabled 
                            ? "opacity-50 cursor-not-allowed border-muted" 
                            : "border-muted hover:border-primary/30"
                      }`}
                    >
                      <Checkbox
                        id={sub}
                        checked={isChecked}
                        onCheckedChange={() => handleOptionalSelect(sub)}
                        disabled={isDisabled}
                        className="rounded-md"
                      />
                      <span
                        className={`text-sm md:text-base font-medium flex-1 ${isDisabled ? "text-muted-foreground" : ""}`}
                      >
                        {getSubjectName(sub)}
                      </span>
                    </label>
                  );
                })}
              </div>
            </div>
          )}

          <Button
            onClick={handleStartClick}
            disabled={!canStart}
            className="w-full h-12 text-lg font-bold"
          >
            পরীক্ষা শুরু করুন
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

export default function TakeExamPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, loading: authContextLoading } = useAuth();
  const exam_id = params.exam_id as string;
  const { toast } = useToast();

  const [exam, setExam] = useState<Exam | null>(null);
  const [allQuestions, setAllQuestions] = useState<Question[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentPageIndex, setCurrentPageIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<{
    [key: string]: number;
  }>({});
  const [markedForReview, setMarkedForReview] = useState<Set<string>>(
    new Set(),
  );
  const [loading, setLoading] = useState(true);
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [showReviewDialog, setShowReviewDialog] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [examStarted, setExamStarted] = useState(false);
  const [selectedSubject, setSelectedSubject] = useState<string>("all");

  // Detect mobile screen size
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < BREAKPOINTS.tablet);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const questionsPerPage = isMobile
    ? QUESTIONS_PER_PAGE_MOBILE
    : QUESTIONS_PER_PAGE;
  
  // Get unique subjects and filter questions
  const uniqueSubjects = useMemo(() => {
    const subjects = new Set<string>();
    allQuestions.forEach((q) => {
      if (q.subject) {
        subjects.add(q.subject);
      }
    });
    return Array.from(subjects).sort();
  }, [allQuestions]);

  // Filter questions based on selected subject
  const filteredQuestions = useMemo(() => {
    if (selectedSubject === "all") {
      return questions;
    }
    return questions.filter((q) => q.subject === selectedSubject);
  }, [questions, selectedSubject]);

  const totalPages = Math.ceil(filteredQuestions.length / questionsPerPage);
  const startIndex = currentPageIndex * questionsPerPage;
  const endIndex = startIndex + questionsPerPage;
  const currentPageQuestions = filteredQuestions.slice(startIndex, endIndex);

  const handleSubmitExam = useCallback(async () => {
    setIsSubmitting(true);
    let correctAnswers = 0;
    let wrongAnswers = 0;
    let totalScore = 0;

    questions.forEach((q) => {
      const selectedOptIndex = selectedAnswers[q.id!];
      const qMarks = (q.question_marks !== null && q.question_marks !== undefined && q.question_marks !== "") 
        ? parseFloat(String(q.question_marks)) 
        : (exam?.marks_per_question || 1);
      const qNeg = exam?.negative_marks_per_wrong || 0;

      if (selectedOptIndex !== undefined) {
        if (selectedOptIndex === q.answer) {
          correctAnswers++;
          totalScore += qMarks;
        } else {
          wrongAnswers++;
          totalScore -= qNeg;
        }
      }
    });

    if (user && exam_id) {
      try {
        const result = await apiRequest(
          "results",
          "POST",
          {
            exam_id: exam_id.toString(),
            student_id: user.uid,
            score: totalScore,
            correct_answers: correctAnswers,
            wrong_answers: wrongAnswers,
            unattempted: questions.length - Object.keys(selectedAnswers).length,
          },
          { action: "submit" },
        );

        if (!result.success) {
          toast({
            title: "স্কোর জমা দিতে সমস্যা হয়েছে",
            description: result.message || "অনুগ্রহ করে আবার চেষ্টা করুন",
            variant: "destructive",
          });
        } else {
          toast({ title: "পরীক্ষা সফলভাবে জমা হয়েছে!" });
        }
      } catch (err) {
        console.error("Error submitting exam:", err);
        toast({
          title: "ত্রুটি",
          description: "পরীক্ষা জমা দিতে সমস্যা হয়েছে",
          variant: "destructive",
        });
      }
    }

    if (user && exam_id) {
      const storageKey = `exam_answers_${user.uid}_${exam_id}`;

      const dataToStore = {
        answers: selectedAnswers,
      };

      localStorage.setItem(storageKey, JSON.stringify(dataToStore));
    }

    setSubmitted(true);
    const solveUrl = `/dashboard/exams/${exam_id}/solve?${searchParams.toString()}`;
    router.push(solveUrl);
  }, [
    exam_id,
    exam,
    questions,
    selectedAnswers,
    user,
    toast,
    router,
    searchParams,
  ]);

  useEffect(() => {
    if (!submitted && timeLeft !== null && !isSubmitting && examStarted) {
      if (timeLeft <= 1) {
        handleSubmitExam();
      }

      const timer = setInterval(() => {
        setTimeLeft((prev) => (prev !== null ? prev - 1 : null));
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [submitted, timeLeft, isSubmitting, examStarted, handleSubmitExam]);

  const showTimeWarning = useMemo(() => {
    if (timeLeft === null || exam?.duration_minutes === undefined) return false;
    const tenPercentTime = exam.duration_minutes * 60 * 0.1;
    return timeLeft <= tenPercentTime && timeLeft > 60;
  }, [timeLeft, exam?.duration_minutes]);

  const showCriticalWarning = useMemo(() => {
    if (timeLeft === null) return false;
    return timeLeft <= 60;
  }, [timeLeft]);

  useEffect(() => {
    if (showTimeWarning) {
      setTimeout(
        () =>
          toast({
            title: "⏱️ সময় শেষ হওয়ার সতর্কতা",
            description: "মাত্র ১০% সময় বাকি আছে। দ্রুত উত্তর সম্পন্ন করুন।",
            variant: "destructive",
          }),
        0,
      );
    }
  }, [showTimeWarning, toast]);

  useEffect(() => {
    if (showCriticalWarning) {
      setTimeout(
        () =>
          toast({
            title: "🚨 জরুরি: সময় শেষ হতে চলেছে",
            description:
              "মাত্র ১ মিনিট বাকি। পরীক্ষা স্বয়ংক্রিয়ভাবে জমা হবে।",
            variant: "destructive",
          }),
        0,
      );
    }
  }, [showCriticalWarning, toast]);

  useEffect(() => {
    if (
      !loading &&
      timeLeft === null &&
      exam?.duration_minutes &&
      examStarted &&
      !searchParams.get("start_custom") // Don't start timer automatically for normal exams
    ) {
      setTimeLeft(exam.duration_minutes * 60);
    }
  }, [loading, timeLeft, exam, examStarted, searchParams]);

  useEffect(() => {
    if (exam_id) {
      fetchExam();
    }
  }, [exam_id]);

  useEffect(() => {
    const checkAuthorization = async () => {
      if (authContextLoading) return;

      setAuthLoading(true);

      try {
        if (!exam) {
          setIsAuthorized(false);
          return;
        }

        if (!exam.batch_id) {
          setIsAuthorized(true);
          return;
        }

        const batchResult = await apiRequest<Batch>("batches", "GET", null, {
          id: exam.batch_id,
        });

        if (
          batchResult.success &&
          batchResult.data &&
          batchResult.data.is_public
        ) {
          setIsAuthorized(true);
          return;
        }

        if (!user?.uid) {
          setIsAuthorized(false);
          return;
        }

        const userResult = await apiRequest<User>("students", "GET", null, {
          uid: user.uid,
        });

        if (!userResult.success || !userResult.data) {
          setIsAuthorized(false);
          return;
        }

        const isEnrolled = userResult.data.enrolled_batches?.includes(
          exam.batch_id,
        );
        setIsAuthorized(!!isEnrolled);
      } catch (err) {
        console.error("Auth check failed:", err);
        setIsAuthorized(false);
      } finally {
        setAuthLoading(false);
      }
    };

    checkAuthorization();
  }, [user?.uid, exam, authContextLoading, router]);

  const fetchExam = async () => {
    setLoading(true);
    try {
      const examResult = await apiRequest<Exam>("exams", "GET", null, {
        id: exam_id,
      });

      if (!examResult.success || !examResult.data) {
        console.error("Error fetching exam:", examResult.message);
        setLoading(false);
        return;
      }

      const examData = examResult.data;
      setExam(examData);

      const fetched = await fetchQuestions(examData.file_id, examData.id);

      if (Array.isArray(fetched) && fetched.length > 0) {
        const convertedQuestions = fetched.map((q: RawQuestion) => {
          let answerIndex = -1;
          const answerString = (q.answer || q.correct || "A").toString().trim();

          const answerNum = parseInt(answerString, 10);
          if (!isNaN(answerNum)) {
            // It's a number-like string (e.g., "1", "2")
            // The API provides 1-based index, so convert to 0-based
            answerIndex = answerNum - 1;
          } else {
            // It's a letter (e.g., "A", "B")
            answerIndex = answerString.toUpperCase().charCodeAt(0) - 65;
          }
          const options =
            q.options && Array.isArray(q.options) && q.options.length > 0
              ? q.options
              : [q.option1, q.option2, q.option3, q.option4, q.option5].filter(
                  (opt): opt is string => !!opt,
                );

          return {
            id: q.id,
            question: q.question || q.question_text || "",
            options: options,
            answer: answerIndex,
            explanation: q.explanation || "",
            type: q.type || null,
            question_image_url: (q as Record<string, unknown>)
              .question_image_url,
            explanation_image_url: (q as Record<string, unknown>)
              .explanation_image_url,
            question_marks: q.question_marks,
            subject: q.subject,
            paper: q.paper,
            chapter: q.chapter,
            highlight: q.highlight,
          };
        });

        const finalQuestions = examData.shuffle_questions
          ? shuffleArray(convertedQuestions)
          : convertedQuestions;
        setAllQuestions(finalQuestions);

        if (!examData.total_subjects) {
          setQuestions(finalQuestions);
        }
      } else {
        toast({
          title: "প্রশ্ন লোড করতে সমস্যা হয়েছে",
          description: "অনুগ্রহ করে পরে আবার চেষ্টা করুন",
          variant: "destructive",
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleAnswerSelect = useCallback(
    (questionId: string, optionIndex: number) => {
      // Lock the answer once it's selected.
      if (selectedAnswers[questionId] !== undefined) {
        return;
      }

      setSelectedAnswers((prev) => ({
        ...prev,
        [questionId]: optionIndex,
      }));
      setMarkedForReview((prev) => {
        const newSet = new Set(prev);
        newSet.delete(questionId);
        return newSet;
      });
    },
    [selectedAnswers],
  );

  const toggleMarkForReview = useCallback((questionId: string) => {
    setMarkedForReview((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(questionId)) {
        newSet.delete(questionId);
      } else {
        newSet.add(questionId);
      }
      return newSet;
    });
  }, []);

  const { attemptedCount } = useMemo(
    () => ({
      attemptedCount: Object.keys(selectedAnswers).length,
      unattemptedCount: filteredQuestions.length - Object.keys(selectedAnswers).length,
    }),
    [selectedAnswers, filteredQuestions.length],
  );

  const getAnswerStatus = (questionId: string) => {
    if (markedForReview.has(questionId)) return "marked";
    if (selectedAnswers[questionId] !== undefined) return "attempted";
    return "unattempted";
  };

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <CustomLoader message="অনুমতি যাচাই করা হচ্ছে..." />
      </div>
    );
  }

  if (!isAuthorized) {
    return (
      <div className="container mx-auto p-2 md:p-4 text-center">
        <Card className="max-w-md mx-auto">
          <CardHeader>
            <CardTitle>অনুমতি নেই</CardTitle>
            <CardDescription>
              এই পরীক্ষায় অংশগ্রহণের জন্য আপনার অনুমতি নেই।
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => router.back()} className="mt-6">
              ফিরে যান
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <CustomLoader />
      </div>
    );
  }

  const isCustomExam = !!exam?.total_subjects && exam.total_subjects > 0;

  if (!examStarted) {
    const parseDateField = (keys: string[]) => {
      const examRecord = exam as Record<string, unknown> | null;
      for (const k of keys) {
        const v = examRecord ? examRecord[k] : undefined;
        if (!v) continue;
        const d = new Date(String(v));
        if (!isNaN(d.getTime())) return d;
      }
      return null;
    };

    const startDate = parseDateField([
      "start_at",
      "start_time",
      "starts_at",
      "start",
      "startDate",
    ]);
    const endDate = parseDateField([
      "end_at",
      "end_time",
      "ends_at",
      "end",
      "endDate",
    ]);

    const now = new Date();
    const isPractice = exam?.is_practice;

    const allowStart =
      isPractice ||
      ((!startDate || now >= startDate) && (!endDate || now <= endDate));

    const handleStart = () => {
      if (!allowStart) {
        if (startDate && now < startDate) {
          toast({
            title: "পরীক্ষা এখনও শুরু হয়নি",
            description: `এই পরীক্ষা ${startDate.toLocaleString("bn-BD", { timeZone: "Asia/Dhaka" })} থেকে শুরু হবে। অনুগ্রহ করে তখন আসুন।`,
          });
        } else if (endDate && now > endDate) {
          toast({
            title: "লাইভ পরীক্ষার সময় শেষ",
            description:
              "লাইভ পরীক্ষার সময় শেষ! প্রাকটিসের জন্য লিংক উন্মুক্ত করার জন্য অপেক্ষা করো।",
            variant: "destructive",
          });
        } else {
          toast({ title: "শুরু করা সম্ভব নয়", variant: "destructive" });
        }
        return;
      }
      setQuestions(allQuestions);
      setTimeLeft((exam?.duration_minutes || 0) * 60);
      setExamStarted(true);
    };

    if (isCustomExam) {
      return (
        <SubjectSelectionScreen
          exam={exam!}
          onStart={handleStartCustomExam}
          questionCount={allQuestions.length}
        />
      );
    }

    return (
      <div className="container mx-auto p-2 md:p-4">
        {(startDate || endDate || isPractice) && (
          <Card className="mb-4">
            <CardContent className="pt-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-center text-center gap-2">
                <div>
                  {isPractice ? (
                    <div className="text-sm font-semibold">
                      এটি একটি প্রাকটিস পরীক্ষা — আনলিমিটেড প্রবেশাধিকার
                    </div>
                  ) : (
                    <div className="space-y-1 text-sm">
                      {startDate && now < startDate && (
                        <div>
                          <strong>শুরুর সময়:</strong>{" "}
                          {startDate.toLocaleString("bn-BD", {
                            timeZone: "Asia/Dhaka",
                          })}
                        </div>
                      )}
                      {endDate && (
                        <div>
                          <strong>সম্ভাব্য শেষ সময়:</strong>{" "}
                          {endDate.toLocaleString("bn-BD", {
                            timeZone: "Asia/Dhaka",
                          })}
                        </div>
                      )}
                      {!startDate && !endDate && (
                        <div>
                          এই পরীক্ষার কোনো নির্দিষ্ট সময়সীমা সেট করা হয়নি।
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  {!allowStart && startDate && now < startDate && (
                    <div className="text-xs text-muted-foreground">
                      পরীক্ষা শুরু হওয়ার আগে আপনার এখানে ফিরে আসতে হবে।
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <ExamInstructions
          exam={exam}
          onStartExam={handleStart}
          questionCount={questions.length}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-background/50">
      <div className="container mx-auto p-2 md:p-4 md:pb-8">
        <div>
          <div className="sticky top-0 z-10 py-4 bg-background/95 backdrop-blur">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4 flex-1">
                <BookOpen className="h-5 w-5" />
                <div className="hidden sm:block">
                  <h2 className="font-semibold">{exam?.name}</h2>
                  <p className="text-xs text-muted-foreground">
                    পৃষ্ঠা {currentPageIndex + 1} / {totalPages}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Zap className="h-4 w-4 text-primary" />
                <span className="text-xs md:text-sm font-semibold">
                  {attemptedCount}/{filteredQuestions.length}
                </span>
              </div>
            </div>
            <Progress
              value={(attemptedCount / filteredQuestions.length) * 100}
              className="mt-3 h-1"
            />

            {/* Subject Tabs */}
            {examStarted && uniqueSubjects.length > 0 && (
              <div className="mt-4 flex gap-2 overflow-x-auto pb-2">
                <Button
                  variant={selectedSubject === "all" ? "default" : "outline"}
                  size="sm"
                  onClick={() => {
                    setSelectedSubject("all");
                    setCurrentPageIndex(0);
                  }}
                  className="whitespace-nowrap text-xs"
                >
                  সব প্রশ্ন ({questions.length})
                </Button>
                {uniqueSubjects.map((subject) => {
                  const subjectQuestionCount = questions.filter(
                    (q) => q.subject === subject
                  ).length;
                  return (
                    <Button
                      key={subject}
                      variant={
                        selectedSubject === subject ? "default" : "outline"
                      }
                      size="sm"
                      onClick={() => {
                        setSelectedSubject(subject);
                        setCurrentPageIndex(0);
                      }}
                      className="whitespace-nowrap text-xs"
                    >
                      {subject} ({subjectQuestionCount})
                    </Button>
                  );
                })}
              </div>
            )}
          </div>
          <Alert variant="destructive" className="mb-4">
            <AlertDescriptionComponent>
              আপনি অতিথি হিসেবে এই পাবলিক পরীক্ষায় অংশগ্রহণ করছেন — আপনার ফলাফল
              সংরক্ষিত হবে না। স্কোর সংরক্ষণ করতে অনুগ্রহ করে{" "}
              <Link href="/login" className="underline">
                লগইন
              </Link>{" "}
              বা{" "}
              <Link href="/register" className="underline">
                নিবন্ধন
              </Link>{" "}
              করুন।
            </AlertDescriptionComponent>
          </Alert>

          <Tabs defaultValue="questions" className="w-full">
            <TabsList className="grid w-full grid-cols-1 mb-6">
              <TabsTrigger
                value="questions"
                className="flex items-center gap-2"
              >
                <BookOpen className="h-4 w-4" />
                <span>প্রশ্ন</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="questions" className="space-y-6">
              {currentPageQuestions.map((question, pageIndex) => {
                const globalIndex = startIndex + pageIndex;
                const status = getAnswerStatus(question.id!);
                const isAnswered = selectedAnswers[question.id!] !== undefined;

                return (
                  <Card
                    key={question.id}
                    id={`question-${question.id}`}
                    className="overflow-hidden"
                  >
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <Badge variant="secondary">
                              প্রশ্ন {globalIndex + 1}
                            </Badge>
                            {isAnswered && (
                              <Badge variant="default" className="bg-success">
                                <CheckCircle2 className="h-3 w-3 mr-1" />
                                উত্তরিত
                              </Badge>
                            )}
                            {status === "marked" && (
                              <Badge variant="outline" className="text-warning">
                                <Flag className="h-3 w-3 mr-1" />
                                পর্যালোচনা
                              </Badge>
                            )}
                            {(question.subject || question.paper || question.chapter || question.highlight) && (
                              <div className="flex flex-wrap gap-1">
                                {question.subject && <Badge variant="outline" className="text-[10px] h-4 px-1.5 bg-blue-50 text-blue-600 border-blue-200 font-normal">{question.subject}</Badge>}
                                {question.paper && <Badge variant="outline" className="text-[10px] h-4 px-1.5 bg-green-50 text-green-600 border-green-200 font-normal">{question.paper}</Badge>}
                                {question.chapter && <Badge variant="outline" className="text-[10px] h-4 px-1.5 bg-purple-50 text-purple-600 border-purple-200 font-normal">{question.chapter}</Badge>}
                                {question.highlight && <Badge variant="outline" className="text-[10px] h-4 px-1.5 bg-amber-50 text-amber-600 border-amber-200 font-normal">{question.highlight}</Badge>}
                              </div>
                            )}
                          </div>
                          <h3 className="text-lg font-semibold leading-relaxed">
                            <LatexRenderer html={question.question} />
                          </h3>
                          {((question as Record<string, unknown>)
                            .question_image_url as string | undefined) && (
                            <div className="mt-3 rounded-lg overflow-hidden border max-w-full bg-white">
                                <img
                                  src={
                                    (question as Record<string, unknown>)
                                      .question_image_url as string
                                  }
                                  alt="Question"
                                  className="w-full h-auto object-contain max-h-[300px]"
                                />
                            </div>
                          )}
                        </div>
                        <Button
                          variant={status === "marked" ? "default" : "ghost"}
                          size="sm"
                          onClick={() => toggleMarkForReview(question.id!)}
                          className={status === "marked" ? "bg-warning" : ""}
                        >
                          <Flag className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardHeader>

                    <CardContent className="space-y-4 p-3">
                      <div className="space-y-3">
                        <div className="space-y-3">
                          {(Array.isArray(question.options)
                            ? question.options
                            : Object.values(
                                question.options ||
                                  ({} as Record<string, string>),
                              )
                          ).map((option: string, optionIndex: number) => {
                            const bengaliLetters = [
                              "ক",
                              "খ",
                              "গ",
                              "ঘ",
                              "ঙ",
                              "চ",
                              "ছ",
                              "জ",
                            ];
                            const letter =
                              bengaliLetters[optionIndex] ||
                              String.fromCharCode(65 + optionIndex);

                            const isSelected =
                              selectedAnswers[question.id!] === optionIndex;

                            return (
                              <label
                                key={optionIndex}
                                className={cn(
                                    "group flex items-center space-x-3 p-2.5 md:p-3.5 rounded-xl border-2 transition-all min-h-[56px] cursor-pointer",
                                    isSelected 
                                        ? "border-primary bg-primary/5 ring-1 ring-primary/10" 
                                        : isAnswered 
                                            ? "border-muted bg-muted/20 opacity-80 cursor-default" 
                                            : "border-muted hover:border-primary/20 hover:bg-muted/30"
                                )}
                                onClick={() => {
                                    if (isAnswered) return;
                                    handleAnswerSelect(
                                      question.id || "",
                                      optionIndex,
                                    );
                                }}
                              >
                                <div className="flex-shrink-0">
                                  <div
                                    className={cn(
                                        "w-9 h-9 md:w-10 md:h-10 rounded-full border-2 flex items-center justify-center font-bold text-sm md:text-base transition-all flex-shrink-0",
                                        isSelected
                                            ? "border-primary bg-primary text-primary-foreground shadow-md shadow-primary/20"
                                            : "border-muted-foreground/20 bg-background text-muted-foreground group-hover:border-primary/40 group-hover:text-primary"
                                    )}
                                  >
                                    {letter}
                                  </div>
                                </div>

                                <input
                                  type="radio"
                                  name={`question-${question.id}`}
                                  value={optionIndex.toString()}
                                  checked={isSelected}
                                  readOnly
                                  className="hidden"
                                />
                                <span className={cn(
                                    "flex-1 text-sm md:text-base font-semibold leading-snug break-words",
                                    isSelected ? "text-primary" : "text-foreground/90"
                                )}>
                                  <LatexRenderer html={option} />
                                </span>
                              </label>
                            );
                          })}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}

              <footer
                id="exam-navigation"
                className="flex items-center justify-between gap-2 pt-4 mt-6"
              >
                <Button
                  variant="outline"
                  onClick={() => {
                    setCurrentPageIndex(Math.max(0, currentPageIndex - 1));
                    window.scrollTo(0, 0);
                  }}
                  disabled={currentPageIndex === 0 || isSubmitting}
                  className="flex-1 h-10 px-2 text-xs md:text-sm"
                >
                  <ArrowLeft className="h-3 w-3 md:h-4 md:w-4 mr-1 md:mr-2" />
                  পূর্ববর্তী
                </Button>

                <div className="text-xs font-bold text-muted-foreground whitespace-nowrap px-2">
                  {currentPageIndex + 1} / {totalPages}
                </div>

                {currentPageIndex < totalPages - 1 ? (
                  <Button
                    onClick={() => {
                      setCurrentPageIndex(
                        Math.min(totalPages - 1, currentPageIndex + 1),
                      );
                      window.scrollTo(0, 0);
                    }}
                    disabled={isSubmitting}
                    className="flex-1 h-10 px-2 text-xs md:text-sm"
                  >
                    পরবর্তী
                    <ArrowRight className="h-3 w-3 md:h-4 md:w-4 ml-1 md:ml-2" />
                  </Button>
                ) : (
                  <Button
                    onClick={handleSubmitExam}
                    disabled={isSubmitting}
                    className="flex-1 h-10 px-2 text-xs md:text-sm shadow-lg shadow-primary/20"
                  >
                    {isSubmitting ? (
                      <CustomLoader minimal />
                    ) : (
                      <>
                        জমা দিন
                        <Send className="h-3 w-3 md:h-4 md:w-4 ml-1 md:ml-2" />
                      </>
                    )}
                  </Button>
                )}
              </footer>
              <hr className="h-20 border-transparent" />
            </TabsContent>
          </Tabs>
        </div>
      </div>
      {timeLeft !== null && (
        <div className="fixed bottom-8 left-4 z-50 flex items-center gap-2">
          <div
            className={`flex items-center gap-2 px-4 py-2 rounded-full font-mono font-bold transition-all text-lg shadow-lg ${
              (timeLeft || 0) <= CRITICAL_TIME_THRESHOLD
                ? TIMER_CLASSES.critical
                : (timeLeft || 0) <= 300
                  ? TIMER_CLASSES.warning
                  : TIMER_CLASSES.normal
            }`}
          >
            <Clock className="h-5 w-5" />
            <span>{formatTime(timeLeft || 1)}</span>
          </div>
        </div>
      )}

      <Button
        onClick={() => setShowReviewDialog(true)}
        variant="default"
        className="fixed bottom-8 right-4 z-50 h-11 w-11 rounded-full shadow-lg"
        aria-label="পর্যালোচনা খুলুন"
      >
        <Eye className="h-6 w-6" />
      </Button>

      <Dialog open={showReviewDialog} onOpenChange={setShowReviewDialog}>
        <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5" />
              সমস্ত প্রশ্ন পর্যালোচলা
            </DialogTitle>
            <DialogDescriptionComponent>
              এক নজরে আপনার পরীক্ষার অবস্থা দেখুন।
            </DialogDescriptionComponent>
          </DialogHeader>
          <div className="grid grid-cols-5 md:grid-cols-8 lg:grid-cols-10 gap-2 overflow-y-auto p-1">
            {questions.map((question, index) => {
              const status = getAnswerStatus(question.id!);
              let statusClass = "bg-muted hover:bg-muted/80";
              if (status === "attempted") {
                statusClass = "bg-success/80 hover:bg-success text-white";
              } else if (status === "marked") {
                statusClass = "bg-warning/80 hover:bg-warning text-white";
              }
              return (
                <Button
                  key={question.id}
                  variant="outline"
                  className={`h-10 w-10 rounded-full ${statusClass}`}
                  onClick={() => {
                    const page = Math.floor(index / questionsPerPage);
                    setCurrentPageIndex(page);
                    setShowReviewDialog(false);
                    setTimeout(() => {
                      document
                        .getElementById(`question-${question.id}`)
                        ?.scrollIntoView({ behavior: "smooth" });
                    }, 100);
                  }}
                >
                  {index + 1}
                </Button>
              );
            })}
          </div>
          <div className="mt-4 flex flex-wrap gap-4 text-xs items-center">
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded-full bg-success"></div>উত্তরিত
            </div>
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded-full bg-muted"></div>অনুত্তরিত
            </div>
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded-full bg-warning"></div>পর্যালোচনা
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
