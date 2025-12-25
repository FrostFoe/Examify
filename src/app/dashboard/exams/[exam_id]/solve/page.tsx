"use client";

import { useState, useEffect, useMemo } from "react";
import { apiRequest } from "@/lib/api";
import {
  fetchQuestions,
  normalizeQuestion,
  type RawQuestion,
} from "@/lib/fetchQuestions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import type { Exam, Question } from "@/lib/types";
import LatexRenderer from "@/components/LatexRenderer";
import CustomLoader from "@/components/CustomLoader";
import {
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  BookOpen,
  Zap,
} from "lucide-react";

export const runtime = "edge";

export default function SolvePage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const exam_id = params.exam_id as string;
  const { toast } = useToast();

  const [exam, setExam] = useState<Exam | null>(null);
  const [allQuestions, setAllQuestions] = useState<Question[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadedUserAnswers, setLoadedUserAnswers] = useState<{
    [key: string]: number;
  } | null>(null);
  const [filter, setFilter] = useState<"all" | "correct" | "wrong" | "skipped">(
    "all",
  );

  useEffect(() => {
    if (exam_id) {
      fetchExamAndAnswers();
    }
  }, [exam_id, user, searchParams]);

  const fetchExamAndAnswers = async () => {
    setLoading(true);
    try {
      const examResult = await apiRequest<Exam>("exams", "GET", null, {
        id: exam_id,
      });

      if (!examResult.success || !examResult.data) {
        toast({
          title: "পরীক্ষা লোড করতে সমস্যা হয়েছে",
          variant: "destructive",
        });
        return;
      }
      const examData = examResult.data;
      setExam(examData);

      let finalQuestions: Question[] = [];

      // Check if questions are already embedded in the exam data (e.g., custom exams)
      if (
        examData.questions &&
        Array.isArray(examData.questions) &&
        examData.questions.length > 0
      ) {
        finalQuestions = examData.questions.map((q: RawQuestion) => {
          const normalized = normalizeQuestion(q);
          return {
            ...normalized,
            // Ensure compatibility with Question
            answer:
              typeof normalized.answer === "number" ? normalized.answer : -1,
            options: normalized.options || [],
          } as unknown as Question;
        });
      } else {
        // Fallback: Fetch questions using file_id (legacy/CSV based exams)
        const fetched = await fetchQuestions(examData.file_id, examData.id);
        if (Array.isArray(fetched) && fetched.length > 0) {
          finalQuestions = fetched.map((q: RawQuestion) => {
            return {
              ...q,
              answer: typeof q.answer === "number" ? q.answer : -1,
              options: q.options || [],
            } as unknown as Question;
          });
        }
      }

      if (finalQuestions.length > 0) {
        setAllQuestions(finalQuestions);
      } else {
        toast({
          title: "প্রশ্ন লোড করতে সমস্যা হয়েছে",
          variant: "destructive",
        });
      }

      if (exam_id && user?.uid) {
        const storageKey = `exam_answers_${user.uid}_${exam_id}`;

        const savedData = localStorage.getItem(storageKey);
        if (savedData) {
          try {
            const parsedData = JSON.parse(savedData);
            setLoadedUserAnswers(parsedData.answers || parsedData);
          } catch (e) {
            console.error("Failed to parse saved answers", e);
          }
        }
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setQuestions(allQuestions);
  }, [allQuestions]);

  const {
    correctAnswers,
    wrongAnswers,
    unattempted,
    finalScore,
    negativeMarks,
    marksFromCorrect,
  } = useMemo(() => {
    if (!loadedUserAnswers || questions.length === 0) {
      return {
        correctAnswers: 0,
        wrongAnswers: 0,
        unattempted: 0,
        finalScore: 0,
        negativeMarks: 0,
        marksFromCorrect: 0,
      };
    }
    let correct = 0;
    let wrong = 0;
    let totalMarksFromCorrect = 0;
    let totalNegative = 0;
    const answeredIds = Object.keys(loadedUserAnswers);

    questions.forEach((q) => {
      const qMarks =
        q.question_marks !== null &&
        q.question_marks !== undefined &&
        q.question_marks !== ""
          ? parseFloat(String(q.question_marks))
          : parseFloat(String(exam?.marks_per_question || 1));
      const qNeg = parseFloat(String(exam?.negative_marks_per_wrong || 0));

      const qId = String(q.id);
      if (qId && answeredIds.includes(qId)) {
        if (loadedUserAnswers[qId] === q.answer) {
          correct++;
          totalMarksFromCorrect += qMarks;
        } else {
          wrong++;
          totalNegative += qNeg;
        }
      }
    });

    const unattemptedCount = questions.length - (correct + wrong);
    const score = totalMarksFromCorrect - totalNegative;

    return {
      correctAnswers: correct,
      wrongAnswers: wrong,
      unattempted: unattemptedCount,
      finalScore: score,
      negativeMarks: totalNegative,
      marksFromCorrect: totalMarksFromCorrect,
    };
  }, [loadedUserAnswers, questions, exam]);

  const filteredQuestions = useMemo(() => {
    if (filter === "all" || !loadedUserAnswers) {
      return questions;
    }

    return questions.filter((question) => {
      const qId = String(question.id);
      const userAnswer = loadedUserAnswers[qId];
      const isSkipped = userAnswer === undefined;
      const isCorrect = userAnswer === question.answer;

      if (filter === "correct") {
        return !isSkipped && isCorrect;
      }
      if (filter === "wrong") {
        return !isSkipped && !isCorrect;
      }
      if (filter === "skipped") {
        return isSkipped;
      }
      return false;
    });
  }, [filter, questions, loadedUserAnswers]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <CustomLoader />
      </div>
    );
  }

  if (!exam || questions.length === 0) {
    return <p>কোনো সমাধান পাওয়া যায়নি।</p>;
  }

  const totalNegativeMarksFromWrong =
    wrongAnswers * parseFloat(String(exam?.negative_marks_per_wrong || 0));

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-background/50 flex flex-col items-center justify-start p-2 md:p-4">
      <div className="w-full max-w-2xl space-y-6">
        <Card className="border-0 shadow-2xl overflow-hidden bg-gradient-to-r from-primary/10 to-primary/5">
          <CardContent className="p-8 text-center space-y-4">
            <div className="flex justify-center">
              <div className="relative">
                <div className="absolute inset-0 bg-success/20 blur-2xl rounded-full"></div>
                <CheckCircle2 className="h-16 w-16 text-success relative" />
              </div>
            </div>
            <div>
              <h1 className="text-4xl font-bold mb-2">পরীক্ষা সম্পন্ন!</h1>
              <p className="text-muted-foreground text-lg">
                আপনার ফলাফল নিচে দেখুন
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-xl">
          <CardContent className="p-8 text-center">
            <p className="text-sm font-semibold text-muted-foreground mb-2">
              আপনার মোট স্কোর
            </p>
            <div className="space-y-2">
              <div className="text-4xl md:text-6xl font-black bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
                {finalScore.toFixed(2)}
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
          <Card className="border-muted/20 shadow-sm">
            <CardContent className="p-3 md:p-6 space-y-1 md:space-y-2">
              <div className="flex items-center gap-1 md:gap-2 text-success">
                <CheckCircle2 className="h-4 w-4 md:h-5 md:w-5" />
                <span className="text-[9px] md:text-xs font-bold uppercase tracking-wider">
                  সঠিক
                </span>
              </div>
              <p className="text-lg md:text-3xl font-black text-success">
                {correctAnswers}
              </p>
              <p className="text-[8px] md:text-xs text-muted-foreground font-medium truncate">
                মার্ক: +{marksFromCorrect.toFixed(1)}
              </p>
            </CardContent>
          </Card>

          <Card className="border-muted/20 shadow-sm">
            <CardContent className="p-3 md:p-6 space-y-1 md:space-y-2">
              <div className="flex items-center gap-1 md:gap-2 text-destructive">
                <AlertCircle className="h-4 w-4 md:h-5 md:w-5" />
                <span className="text-[9px] md:text-xs font-bold uppercase tracking-wider">
                  ভুল
                </span>
              </div>
              <p className="text-lg md:text-3xl font-black text-destructive">
                {wrongAnswers}
              </p>
              <p className="text-[8px] md:text-xs text-muted-foreground font-medium truncate">
                পেনাল্টি: -{totalNegativeMarksFromWrong.toFixed(1)}
              </p>
            </CardContent>
          </Card>

          <Card className="border-muted/20 shadow-sm">
            <CardContent className="p-3 md:p-6 space-y-1 md:space-y-2">
              <div className="flex items-center gap-1 md:gap-2 text-warning">
                <HelpCircle className="h-4 w-4 md:h-5 md:w-5" />
                <span className="text-[9px] md:text-xs font-bold uppercase tracking-wider">
                  স্কিপ
                </span>
              </div>
              <p className="text-lg md:text-3xl font-black text-warning">
                {unattempted}
              </p>
              <p className="text-[8px] md:text-xs text-muted-foreground font-medium truncate">
                মার্ক: 0.0
              </p>
            </CardContent>
          </Card>

          <Card className="border-muted/20 shadow-sm">
            <CardContent className="p-3 md:p-6 space-y-1 md:space-y-2">
              <div className="flex items-center gap-1 md:gap-2 text-primary">
                <Zap className="h-4 w-4 md:h-5 md:w-5" />
                <span className="text-[9px] md:text-xs font-bold uppercase tracking-wider">
                  নেগেটিভ
                </span>
              </div>
              <p className="text-lg md:text-3xl font-black text-primary">
                {negativeMarks.toFixed(1)}
              </p>
              <p className="text-[8px] md:text-xs text-muted-foreground font-medium truncate">
                প্রতি ভুল {exam?.negative_marks_per_wrong || 0}
              </p>
            </CardContent>
          </Card>
        </div>
        <Alert
          className={`mb-8 ${
            finalScore >= questions.length * 0.75
              ? "bg-success/5"
              : finalScore >= questions.length * 0.5
                ? "bg-warning/5"
                : "bg-destructive/5"
          }`}
        >
          <BookOpen className="h-4 w-4" />
          <AlertDescription
            className="text-sm"
          >
            <strong>ফিডব্যাক:</strong>{" "}
            {finalScore >= questions.length * 0.75
              ? " চমৎকার! আপনি খুব ভালো করেছেন। এই মানের পরীক্ষা চালিয়ে যান।"
              : finalScore >= questions.length * 0.5
                ? " ভালো! আরও বেশি অনুশীলন করুন এবং পরবর্তী পরীক্ষায় আরও ভালো করতে পারবেন।"
                : " আরও বেশি মনোযোগ দিয়ে পড়ুন এবং পরবর্তী পরীক্ষায় আরও ভালো করুন।"}{" "}
            ।
          </AlertDescription>
        </Alert>

        <div className="space-y-6 mt-8">
          <Card className="border-0 shadow-sm">
            <CardHeader className="flex flex-col md:flex-row justify-between items-center gap-4 p-4 md:p-6">
              <h2 className="text-xl font-bold">বিস্তারিত ফলাফল</h2>
              <div className="flex items-center gap-1 p-1 bg-muted rounded-xl w-full md:w-auto overflow-x-auto scrollbar-hide">
                <Button
                  size="sm"
                  variant={filter === "all" ? "default" : "ghost"}
                  onClick={() => setFilter("all")}
                  className="flex-1 md:flex-none rounded-lg text-[10px] md:text-xs h-8 px-3 font-bold"
                >
                  সবগুলো
                </Button>
                <Button
                  size="sm"
                  variant={filter === "correct" ? "default" : "ghost"}
                  onClick={() => setFilter("correct")}
                  className="flex-1 md:flex-none rounded-lg text-[10px] md:text-xs h-8 px-3 font-bold"
                >
                  সঠিক
                </Button>
                <Button
                  size="sm"
                  variant={filter === "wrong" ? "default" : "ghost"}
                  onClick={() => setFilter("wrong")}
                  className="flex-1 md:flex-none rounded-lg text-[10px] md:text-xs h-8 px-3 font-bold"
                >
                  ভুল
                </Button>
                <Button
                  size="sm"
                  variant={filter === "skipped" ? "default" : "ghost"}
                  onClick={() => setFilter("skipped")}
                  className="flex-1 md:flex-none rounded-lg text-[10px] md:text-xs h-8 px-3 font-bold"
                >
                  স্কিপ
                </Button>
              </div>
            </CardHeader>
          </Card>

          {filteredQuestions.length > 0 ? (
            filteredQuestions.map((question) => {
              const qId = String(question.id);
              const userAnswer = loadedUserAnswers
                ? loadedUserAnswers[qId]
                : undefined;
              const correctAnswer = question.answer;
              const isCorrect = userAnswer === correctAnswer;
              const isSkipped = userAnswer === undefined;

              return (
                <Card
                  key={qId}
                  className={`mb-4 ${
                    isCorrect && !isSkipped
                      ? "bg-success/5 border-l-4 border-success"
                      : isSkipped
                        ? "bg-warning/5 border-l-4 border-warning"
                        : "bg-destructive/5 border-l-4 border-destructive"
                  }`}
                >
                  <CardHeader>
                    <div className="flex justify-between items-start gap-4">
                          <div className="space-y-2 flex-1 min-w-0">
                            <Badge
                              variant={
                                isCorrect && !isSkipped
                                  ? "default"
                                  : isSkipped
                                    ? "outline"
                                    : "destructive"
                              }
                              className={
                                isCorrect && !isSkipped
                                  ? "bg-success"
                                  : isSkipped
                                    ? "text-warning border-warning"
                                    : ""
                              }
                            >
                              {isCorrect && !isSkipped
                                ? "সঠিক"
                                : isSkipped
                                  ? "উত্তর করা হয়নি"
                                  : "ভুল"}
                            </Badge>
                            <h3 className="text-lg font-semibold break-words">
                              <div className="flex items-center gap-2 mb-1 flex-wrap">
                                <span className="mr-1">
                                  প্রশ্ন {filteredQuestions.indexOf(question) + 1}.
                                </span>
                                {(question.subject ||
                                  question.paper ||
                                  question.chapter ||
                                  question.highlight) && (
                                  <div className="flex flex-wrap gap-1">
                                    {question.subject && (
                                      <Badge
                                        variant="outline"
                                        className="text-[10px] h-4 px-1.5 bg-blue-50 text-blue-600 border-blue-200 font-normal"
                                      >
                                        {question.subject}
                                      </Badge>
                                    )}
                                    {question.paper && (
                                      <Badge
                                        variant="outline"
                                        className="text-[10px] h-4 px-1.5 bg-green-50 text-green-600 border-green-200 font-normal"
                                      >
                                        {question.paper}
                                      </Badge>
                                    )}
                                    {question.chapter && (
                                      <Badge
                                        variant="outline"
                                        className="text-[10px] h-4 px-1.5 bg-purple-50 text-purple-600 border-purple-200 font-normal"
                                      >
                                        {question.chapter}
                                      </Badge>
                                    )}
                                    {question.highlight && (
                                      <Badge
                                        variant="outline"
                                        className="text-[10px] h-4 px-1.5 bg-amber-50 text-amber-600 border-amber-200 font-normal"
                                      >
                                        {question.highlight}
                                      </Badge>
                                    )}
                                  </div>
                                )}
                              </div>
                              <LatexRenderer html={question.question || ""} />
                            </h3>
                            {question.question_image_url &&
                              typeof question.question_image_url === "string" && (
                                <div className="mt-3 rounded-lg overflow-hidden border max-w-full bg-white">
                                  <img
                                    src={question.question_image_url}
                                    alt="Question"
                                    className="w-full h-auto object-contain max-h-[300px]"
                                  />
                                </div>
                              )}
                          </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid gap-2">
                      {(Array.isArray(question.options)
                        ? question.options
                        : Object.values(question.options || {})
                      ).map((option, optIdx) => {
                        if (!option) return null;
                        const isSelected = userAnswer === optIdx;
                        const isRightAnswer = correctAnswer === optIdx;
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

                        let optionClass =
                          "p-3 rounded-lg border flex items-center gap-3 ";
                        if (isRightAnswer) {
                          optionClass +=
                            "bg-success/20 border-success text-success-foreground font-medium";
                        } else if (isSelected && !isRightAnswer) {
                          optionClass +=
                            "bg-destructive/20 border-destructive text-destructive-foreground font-medium";
                        } else {
                          optionClass += "bg-background border-muted";
                        }

                        return (
                          <div key={optIdx} className={optionClass}>
                            <div
                              className={`w-6 h-6 rounded-full border flex items-center justify-center text-sm ${
                                isRightAnswer
                                  ? "border-success bg-success text-white"
                                  : isSelected
                                    ? "border-destructive bg-destructive text-white"
                                    : "border-muted"
                              }`}
                            >
                              {bengaliLetters[optIdx] ||
                                String.fromCharCode(65 + optIdx)}
                            </div>
                            <div className="flex-1 min-w-0">
                              <LatexRenderer html={option || ""} />
                            </div>
                            {isRightAnswer && (
                              <CheckCircle2 className="h-4 w-4 text-success ml-auto" />
                            )}
                            {isSelected && !isRightAnswer && (
                              <AlertCircle className="h-4 w-4 text-destructive ml-auto" />
                            )}
                          </div>
                        );
                      })}
                    </div>

                    {question.explanation && (
                      <div className="mt-4 p-4 bg-muted/50 rounded-lg text-sm min-w-0 break-words">
                        <p className="font-semibold mb-1">ব্যাখ্যা:</p>
                        <div className="flex-1 min-w-0">
                          <LatexRenderer html={question.explanation || ""} />
                        </div>
                        {question.explanation_image_url &&
                          typeof question.explanation_image_url ===
                            "string" && (
                            <div className="mt-3 rounded-lg overflow-hidden border max-w-full bg-white">
                              <img
                                src={question.explanation_image_url}
                                alt="Explanation"
                                className="w-full h-auto object-contain max-h-[200px]"
                                onContextMenu={(e) => e.preventDefault()}
                                onDragStart={(e) => e.preventDefault()}
                                style={{ userSelect: "none" }}
                              />
                            </div>
                          )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })
          ) : (
            <Card>
              <CardContent className="p-6 text-center text-muted-foreground">
                এই ক্যাটাগরিতে কোনো প্রশ্ন পাওয়া যায়নি।
              </CardContent>
            </Card>
          )}
        </div>

        <div className="flex flex-col sm:flex-row gap-3 pt-4 mt-6 pb-4 md:pb-8">
          <Button
            onClick={() => router.back()}
            variant="outline"
            className="w-full sm:flex-1 h-12"
            size="lg"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            পিছনে যান
          </Button>
          <Button
            onClick={() => router.push("/dashboard")}
            className="w-full sm:flex-1 h-12"
            size="lg"
          >
            <BookOpen className="h-4 w-4 mr-2" />
            ড্যাশবোর্ডে যান
          </Button>
        </div>
        <hr className="h-16 border-transparent" />
      </div>
    </div>
  );
}
