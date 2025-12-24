"use client";

import { useState, useRef, type FormEvent, useEffect } from "react";
import { apiRequest } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import Link from "next/link";
import { useToast } from "@/hooks/use-toast";
import ConfirmPasswordDialog from "@/components/ConfirmPasswordDialog";
import { useAdminAuth } from "@/context/AdminAuthContext";
import type { Batch, Exam, User } from "@/lib/types";
import { PlusCircle } from "lucide-react";
import { EditExamModal } from "@/components/EditExamModal";
import { CSVUploadComponent, CustomLoader } from "@/components";
import QuestionSelector from "@/components/QuestionSelector";
import {
  createExam,
  deleteExam,
  enrollStudent,
  removeStudentFromBatch,
} from "@/lib/actions";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";

interface BatchDetailsClientProps {
  initialBatch: Batch;
  initialExams: Exam[];
  initialEnrolledStudents: User[];
}

const subjects = [
  { id: "p", name: "পদার্থবিজ্ঞান" },
  { id: "c", name: "রসায়ন" },
  { id: "m", name: "উচ্চতর গণিত" },
  { id: "b", name: "জীববিজ্ঞান" },
  { id: "bm", name: "জীববিজ্ঞান + উচ্চতর গণিত" },
  { id: "bn", name: "বাংলা" },
  { id: "e", name: "ইংরেজী" },
  { id: "i", name: "আইসিটি" },
  { id: "gk", name: "জিকে" },
  { id: "iq", name: "আইকিউ" },
];

const bengaliToEnglishNumber = (str: string) => {
  const bengaliNumerals = ["০", "১", "২", "৩", "৪", "৫", "৬", "৭", "৮", "৯"];
  let newStr = str;
  for (let i = 0; i < 10; i++) {
    newStr = newStr.replace(new RegExp(bengaliNumerals[i], "g"), i.toString());
  }
  return newStr;
};

const hours12 = Array.from({ length: 12 }, (_, i) =>
  (i + 1).toString().padStart(2, "0"),
);
const minutes = Array.from({ length: 60 }, (_, i) =>
  i.toString().padStart(2, "0"),
);

export function BatchDetailsClient({
  initialBatch,
  initialExams,
  initialEnrolledStudents,
}: BatchDetailsClientProps) {
  const { toast } = useToast();

  const [batch] = useState<Batch | null>(initialBatch);
  const [exams, setExams] = useState<Exam[]>(initialExams);
  const [isSubmittingExam, setIsSubmittingExam] = useState(false);
  const [isAddExamOpen, setIsAddExamOpen] = useState(false);
  const [mode, setMode] = useState<"live" | "practice">("live");
  const [enrolledStudents, setEnrolledStudents] = useState<User[]>(initialEnrolledStudents);
  const [newStudentRoll, setNewStudentRoll] = useState("");
  const [isSubmittingStudent, setIsSubmittingStudent] = useState(false);
  const [editingExam, setEditingExam] = useState<Exam | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [pendingStudent, setPendingStudent] = useState<User | null>(null);
  const [pendingDelete, setPendingDelete] = useState<{
    type: "exam" | "student";
    id: string;
    label?: string;
  } | null>(null);
  const [isPasswordOpen, setIsPasswordOpen] = useState(false);
  const addExamFormRef = useRef<HTMLFormElement>(null);
  const addStudentFormRef = useRef<HTMLFormElement>(null);
  const [isCustomExam, setIsCustomExam] = useState(false);
  const [useQuestionBank, setUseQuestionBank] = useState(false);
  const [fileId, setFileId] = useState("");
  const [selectedQuestionIds, setSelectedQuestionIds] = useState<string[]>([]);

  const [startDate, setStartDate] = useState<Date | undefined>(new Date());
  const [startHour, setStartHour] = useState("12");
  const [startMinute, setStartMinute] = useState("00");
  const [startPeriod, setStartPeriod] = useState<"AM" | "PM">("AM");

  const [endDate, setEndDate] = useState<Date | undefined>(
    new Date(new Date().getTime() + 60 * 60 * 1000),
  );
  const [endHour, setEndHour] = useState("01");
  const [endMinute, setEndMinute] = useState("00");
  const [endPeriod, setEndPeriod] = useState<"AM" | "PM">("AM");

  const batch_id = batch?.id;

  const { admin } = useAdminAuth();

  useEffect(() => {
    if (mode === "live") {
      const now = new Date();
      setStartDate(now);
      const currentHour = now.getHours();
      setStartPeriod(currentHour >= 12 ? "PM" : "AM");
      setStartHour(
        (currentHour % 12 === 0 ? 12 : currentHour % 12)
          .toString()
          .padStart(2, "0"),
      );
      setStartMinute(now.getMinutes().toString().padStart(2, "0"));

      const oneHourLater = new Date(now.getTime() + 60 * 60 * 1000);
      setEndDate(oneHourLater);
      const endHour24 = oneHourLater.getHours();
      setEndPeriod(endHour24 >= 12 ? "PM" : "AM");
      setEndHour(
        (endHour24 % 12 === 0 ? 12 : endHour24 % 12)
          .toString()
          .padStart(2, "0"),
      );
      setEndMinute(oneHourLater.getMinutes().toString().padStart(2, "0"));
    }
  }, [mode]);

  const handleNumberInput = (e: FormEvent<HTMLInputElement>) => {
    const input = e.target as HTMLInputElement;
    input.value = bengaliToEnglishNumber(input.value);
  };

  const requestDeleteExam = (examId: string, examName?: string) => {
    setPendingDelete({ type: "exam", id: examId, label: examName });
    setIsPasswordOpen(true);
  };

  const requestDeleteStudent = (studentId: string, studentName?: string) => {
    setPendingDelete({ type: "student", id: studentId, label: studentName });
    setIsPasswordOpen(true);
  };

  const handleConfirmDelete = async (password: string) => {
    if (!pendingDelete) return;

    if (!admin) {
      toast({ variant: "destructive", title: "অধিকার নেই" });
      setIsPasswordOpen(false);
      setPendingDelete(null);
      return;
    }

    const formData = new FormData();
    formData.append("id", pendingDelete.id);
    formData.append("password", password);
    formData.append("admin_uid", admin.uid);

    if (batch_id) {
      formData.append("batch_id", batch_id);
    }
    if (pendingDelete.type === "exam") {
      const result = await deleteExam(formData);
      if (result.success) {
        toast({ title: "পরীক্ষা সফলভাবে মুছে ফেলা হয়েছে" });
        // Remove from exams list immediately
        setExams((prev) => prev.filter((e) => e.id !== pendingDelete.id));
      } else {
        toast({
          title: "পরীক্ষা মুছে ফেলতে সমস্যা হয়েছে",
          description: result.message,
          variant: "destructive",
        });
      }
    } else if (pendingDelete.type === "student") {
      formData.append("user_id", pendingDelete.id);
      const result = await removeStudentFromBatch(formData);
      if (result.success) {
        toast({ title: "ছাত্রছাত্রী সফলভাবে মুছে ফেলা হয়েছে" });
        // Remove from students list immediately
        setEnrolledStudents((prev) =>
          prev.filter((s) => s.uid !== pendingDelete.id)
        );
      } else {
        toast({
          title: "ছাত্রছাত্রী মুছে ফেলতে সমস্যা হয়েছে",
          description: result.message,
          variant: "destructive",
        });
      }
    }

    setPendingDelete(null);
    setIsPasswordOpen(false);
  };

  const handleAddStudent = async (e: FormEvent) => {
    e.preventDefault();
    if (!newStudentRoll.trim() || !batch_id) {
      toast({
        title: "ছাত্রছাত্রীর রোল এবং ব্যাচ আইডি আবশ্যক",
        variant: "destructive",
      });
      return;
    }

    setIsSubmittingStudent(true);

    const result = await apiRequest<User>("students", "GET", null, {
      roll: newStudentRoll.trim(),
    });

    if (!result.success || !result.data) {
      toast({
        title: "ছাত্রছাত্রী খুঁজে পাওয়া যায়নি",
        description: `রোল ${newStudentRoll.trim()} সহ কোনো ছাত্রছাত্রী পাওয়া যায়নি।`,
        variant: "destructive",
      });
      setIsSubmittingStudent(false);
      return;
    }
    const user = result.data;

    if (user.enrolled_batches && user.enrolled_batches.includes(batch_id)) {
      toast({
        title: "ছাত্রছাত্রী ইতিমধ্যে ভর্তি আছে",
        description: `রোল ${newStudentRoll.trim()} সহ ছাত্রছাত্রী এই ব্যাচে ইতিমধ্যে ভর্তি আছে।`,
        variant: "destructive",
      });
      setIsSubmittingStudent(false);
      return;
    }

    // Show confirmation dialog
    setPendingStudent(user);
    setShowConfirmation(true);
    setIsSubmittingStudent(false);
  };

  const handleConfirmAddStudent = async () => {
    if (!pendingStudent || !batch_id) return;

    setIsSubmittingStudent(true);
    setShowConfirmation(false);

    const formData = new FormData();
    formData.append("user_id", pendingStudent.uid);
    formData.append("batch_id", batch_id);

    const result = await enrollStudent(formData);
    if (result.success) {
      toast({
        title: "ছাত্রছাত্রী সফলভাবে যোগ করা হয়েছে",
        description: `${pendingStudent.name} (রোল: ${pendingStudent.roll}) ব্যাচে যুক্ত হয়েছেন।`,
      });
      setNewStudentRoll("");
      addStudentFormRef.current?.reset();
    } else {
      toast({
        title: "ছাত্রছাত্রী যোগ করতে সমস্যা হয়েছে",
        description: result.message,
        variant: "destructive",
      });
    }

    setPendingStudent(null);
    setIsSubmittingStudent(false);
  };

  const combineDateTime = (
    date?: Date,
    hour?: string,
    minute?: string,
    period?: "AM" | "PM",
  ) => {
    if (!date || !hour || !minute || !period) return null;
    let h24 = parseInt(hour, 10);
    if (period === "PM" && h24 !== 12) {
      h24 += 12;
    }
    if (period === "AM" && h24 === 12) {
      h24 = 0;
    }
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    const hours = String(h24).padStart(2, "0");
    const mins = String(minute).padStart(2, "0");

    return `${year}-${month}-${day} ${hours}:${mins}:00`;
  };

  if (!batch) {
    return (
      <div className="flex justify-center items-center h-full">
        <CustomLoader />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-2 md:p-4 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>ব্যাচের তথ্য - {batch.name}</CardTitle>
          <CardDescription>ব্যাচের বিবরণ এবং অবস্থা দেখুন।</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">ব্যাচের নাম</p>
              <p className="text-lg font-semibold">{batch.name}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">অবস্থা</p>
              <span
                className={`inline-block px-3 py-1 rounded text-sm font-medium ${
                  batch.status === "live"
                    ? "bg-green-500/20 text-green-700"
                    : "bg-gray-500/20 text-gray-700"
                }`}
              >
                {batch.status === "live" ? "লাইভ" : "শেষ"}
              </span>
            </div>
            {batch.description && (
              <div className="md:col-span-2">
                <p className="text-sm text-muted-foreground">বিবরণ</p>
                <p className="text-base">{batch.description}</p>
              </div>
            )}
            {batch.icon_url && (
              <div className="md:col-span-2">
                <p className="text-sm text-muted-foreground">আইকন</p>
                <img
                  src={batch.icon_url}
                  alt={batch.name}
                  className="h-16 w-16 object-cover rounded"
                />
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>পরীক্ষা পরিচালনা</CardTitle>
            <CardDescription>
              এই ব্যাচের জন্য পরীক্ষা তৈরি এবং পরিচালনা করুন।
            </CardDescription>
          </CardHeader>
          <CardContent className="p-3 md:p-6">
            <Collapsible open={isAddExamOpen} onOpenChange={setIsAddExamOpen}>
              <CollapsibleTrigger asChild>
                <Button size="sm" className="w-full justify-start gap-2">
                  <PlusCircle className="h-4 w-4" />
                  নতুন পরীক্ষা যোগ করুন
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="py-4">
                <form
                  ref={addExamFormRef}
                  action={async (formData) => {
                    setIsSubmittingExam(true);
                    if (batch_id) {
                      formData.append("batch_id", batch_id);
                    }
                    const startAtISO = combineDateTime(
                      startDate,
                      startHour,
                      startMinute,
                      startPeriod,
                    );
                    const endAtISO = combineDateTime(
                      endDate,
                      endHour,
                      endMinute,
                      endPeriod,
                    );
                    if (startAtISO) formData.set("start_at", startAtISO);
                    if (endAtISO) formData.set("end_at", endAtISO);

                    formData.set(
                      "question_ids",
                      JSON.stringify(selectedQuestionIds),
                    );

                    const result = await createExam(formData);
                    if (result.success) {
                      toast({ title: "পরীক্ষা সফলভাবে যোগ করা হয়েছে" });
                      addExamFormRef.current?.reset();
                      setSelectedQuestionIds([]);
                      setIsAddExamOpen(false);
                      // Update exams list immediately
                      if (result.data) {
                        setExams((prev) => [result.data as Exam, ...prev]);
                      }
                    } else {
                      toast({
                        title: "পরীক্ষা যোগ করতে সমস্যা হয়েছে",
                        description: result.message,
                        variant: "destructive",
                      });
                    }
                    setIsSubmittingExam(false);
                  }}
                  className="space-y-4 p-4 border rounded-md"
                >
                  <div className="flex flex-col md:flex-row md:items-center gap-3">
                    <Label htmlFor="mode">পরীক্ষার মোড</Label>
                    <Select
                      value={mode}
                      onValueChange={(value) =>
                        setMode(value as "live" | "practice")
                      }
                    >
                      <SelectTrigger id="mode" className="w-full md:w-[220px]">
                        <SelectValue placeholder="পরীক্ষার মোড নির্বাচন করুন" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="live">
                          লাইভ (Time-limited)
                        </SelectItem>
                        <SelectItem value="practice">
                          প্রাকটিস (আনলিমিটেড)
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label htmlFor="exam-name">পরীক্ষার নাম</Label>
                      <Input
                        id="exam-name"
                        name="name"
                        placeholder="পরীক্ষার নাম"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="duration">সময় (মিনিট)</Label>
                      <Input
                        id="duration"
                        name="duration_minutes"
                        defaultValue="40"
                        placeholder="সময় (মিনিট)"
                        type="number"
                        onInput={handleNumberInput}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="marks_per_question">
                        প্রশ্ন প্রতি মার্ক
                      </Label>
                      <Input
                        id="marks_per_question"
                        name="marks_per_question"
                        type="number"
                        step="0.1"
                        defaultValue="1"
                        placeholder="প্রশ্ন প্রতি মার্ক"
                        onInput={handleNumberInput}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="negative_marks">নেগেটিভ মার্ক</Label>
                      <Input
                        id="negative_marks"
                        name="negative_marks_per_wrong"
                        defaultValue="0.25"
                        placeholder="নেগেটিভ মার্ক"
                        type="number"
                        step="0.01"
                        onInput={handleNumberInput}
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 gap-3 items-center">
                    {mode === "live" && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>শুরুর সময়</Label>
                          <Input
                            type="date"
                            value={
                              startDate
                                ? startDate.toLocaleDateString("en-CA")
                                : ""
                            }
                            onChange={(e) =>
                              setStartDate(
                                e.target.value
                                  ? new Date(e.target.value)
                                  : undefined,
                              )
                            }
                            className="w-full"
                          />
                          <div className="grid grid-cols-3 gap-2">
                            <Select
                              value={startHour}
                              onValueChange={setStartHour}
                            >
                              <SelectTrigger className="w-full">
                                <SelectValue placeholder="ঘন্টা" />
                              </SelectTrigger>
                              <SelectContent>
                                {hours12.map((h) => (
                                  <SelectItem key={h} value={h}>
                                    {h}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <Select
                              value={startMinute}
                              onValueChange={setStartMinute}
                            >
                              <SelectTrigger className="w-full">
                                <SelectValue placeholder="মিনিট" />
                              </SelectTrigger>
                              <SelectContent>
                                {minutes.map((m) => (
                                  <SelectItem key={m} value={m}>
                                    {m}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <Select
                              value={startPeriod}
                              onValueChange={(v) =>
                                setStartPeriod(v as "AM" | "PM")
                              }
                            >
                              <SelectTrigger className="w-full">
                                <SelectValue placeholder="AM/PM" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="AM">AM</SelectItem>
                                <SelectItem value="PM">PM</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label>শেষ হওয়ার সময়</Label>
                          <Input
                            type="date"
                            value={
                              endDate ? endDate.toLocaleDateString("en-CA") : ""
                            }
                            onChange={(e) =>
                              setEndDate(
                                e.target.value
                                  ? new Date(e.target.value)
                                  : undefined,
                              )
                            }
                            className="w-full"
                          />
                          <div className="grid grid-cols-3 gap-2">
                            <Select value={endHour} onValueChange={setEndHour}>
                              <SelectTrigger className="w-full">
                                <SelectValue placeholder="ঘন্টা" />
                              </SelectTrigger>
                              <SelectContent>
                                {hours12.map((h) => (
                                  <SelectItem key={h} value={h}>
                                    {h}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <Select
                              value={endMinute}
                              onValueChange={setEndMinute}
                            >
                              <SelectTrigger className="w-full">
                                <SelectValue placeholder="মিনিট" />
                              </SelectTrigger>
                              <SelectContent>
                                {minutes.map((m) => (
                                  <SelectItem key={m} value={m}>
                                    {m}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <Select
                              value={endPeriod}
                              onValueChange={(v) =>
                                setEndPeriod(v as "AM" | "PM")
                              }
                            >
                              <SelectTrigger className="w-full">
                                <SelectValue placeholder="AM/PM" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="AM">AM</SelectItem>
                                <SelectItem value="PM">PM</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                      </div>
                    )}
                    <input
                      name="is_practice"
                      type="hidden"
                      value={mode === "practice" ? "true" : "false"}
                    />
                    <input type="hidden" name="file_id" value={fileId} />

                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="use-question-bank-toggle-batch"
                          checked={useQuestionBank}
                          onCheckedChange={(checked) =>
                            setUseQuestionBank(checked as boolean)
                          }
                        />
                        <Label htmlFor="use-question-bank-toggle-batch">
                          প্রশ্ন ব্যাংক থেকে প্রশ্ন বাছুন
                        </Label>
                      </div>

                      {useQuestionBank && (
                        <div className="pt-2">
                          <QuestionSelector
                            selectedIds={selectedQuestionIds}
                            onChange={setSelectedQuestionIds}
                            minimal
                          />
                        </div>
                      )}
                    </div>

                    <div className="mt-6">
                      <h3 className="text-lg font-medium mb-3">
                        Or upload questions from CSV
                      </h3>
                      <CSVUploadComponent
                        isBank={false}
                        onUploadSuccess={(result) => {
                          setFileId((result.file_id as string) || "");
                        }}
                      />
                    </div>
                  </div>

                  <div className="flex items-center space-x-4 pt-2">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="shuffle-questions-toggle-batch"
                        name="shuffle_questions"
                        value="true"
                      />
                      <Label htmlFor="shuffle-questions-toggle-batch">
                        প্রশ্নগুলো এলোমেলো করুন
                      </Label>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2 pt-2">
                    <Checkbox
                      id="custom-exam-toggle-batch"
                      checked={isCustomExam}
                      onCheckedChange={(checked) =>
                        setIsCustomExam(checked as boolean)
                      }
                    />
                    <Label htmlFor="custom-exam-toggle-batch">
                      কাস্টম এক্সাম
                    </Label>
                  </div>

                  {isCustomExam && (
                    <div className="space-y-4 p-4 border rounded-md">
                      <div className="space-y-2">
                        <Label htmlFor="total_subjects">মোট বিষয়</Label>
                        <Input
                          id="total_subjects"
                          name="total_subjects"
                          type="number"
                          min="1"
                          step="1"
                          placeholder="e.g., 4"
                          onInput={handleNumberInput}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>দাগানো বাধ্যতামূলক</Label>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                          {subjects.map((subject) => (
                            <div
                              key={`mandatory-batch-${subject.id}`}
                              className="flex items-center space-x-2"
                            >
                              <Checkbox
                                id={`mandatory-batch-${subject.id}`}
                                name="mandatory_subjects"
                                value={subject.id}
                              />
                              <Label htmlFor={`mandatory-batch-${subject.id}`}>
                                {subject.name} ({subject.id})
                              </Label>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label>অন্যান্য বিষয়</Label>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                          {subjects.map((subject) => (
                            <div
                              key={`optional-batch-${subject.id}`}
                              className="flex items-center space-x-2"
                            >
                              <Checkbox
                                id={`optional-batch-${subject.id}`}
                                name="optional_subjects"
                                value={subject.id}
                              />
                              <Label htmlFor={`optional-batch-${subject.id}`}>
                                {subject.name} ({subject.id})
                              </Label>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                  <Button
                    type="submit"
                    disabled={isSubmittingExam}
                    className="w-full"
                  >
                    {isSubmittingExam ? (
                      <>
                        <CustomLoader />
                        যোগ করা হচ্ছে...
                      </>
                    ) : (
                      "নতুন পরীক্ষা যোগ করুন"
                    )}
                  </Button>
                </form>
              </CollapsibleContent>
            </Collapsible>
            <div className="relative w-full overflow-auto scrollbar-hide pt-4 mt-4">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>পরীক্ষার নাম</TableHead>
                    <TableHead className="text-right">কার্যক্রম</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {exams.map((exam) => (
                    <TableRow key={exam.id}>
                      <TableCell className="font-medium">{exam.name}</TableCell>
                      <TableCell className="flex flex-wrap items-center justify-end gap-2">
                        <Link href={`/admin/exams/${exam.id}/questions`}>
                          <Button variant="outline" size="sm">
                            প্রশ্ন
                          </Button>
                        </Link>
                        <Link href={`/admin/exams/${exam.id}/results`}>
                          <Button variant="outline" size="sm">
                            ফলাফল
                          </Button>
                        </Link>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setEditingExam(exam);
                            setIsEditModalOpen(true);
                          }}
                        >
                          Edit
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => requestDeleteExam(exam.id, exam.name)}
                        >
                          মুছুন
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>ছাত্রছাত্রী পরিচালনা</CardTitle>
            <CardDescription>
              এই ব্যাচে ছাত্রছাত্রীদের যোগ করুন বা মুছে ফেলুন।
            </CardDescription>
          </CardHeader>
          <CardContent className="p-3 md:p-6">
            <form
              ref={addStudentFormRef}
              onSubmit={handleAddStudent}
              className="space-y-4 mb-6"
            >
              <Input
                type="text"
                placeholder="নতুন ছাত্রছাত্রীর রোল"
                value={newStudentRoll}
                onChange={(e) => setNewStudentRoll(e.target.value)}
                disabled={isSubmittingStudent}
                required
              />
              <Button
                type="submit"
                disabled={isSubmittingStudent}
                className="w-full"
              >
                {isSubmittingStudent ? (
                  <>
                    <CustomLoader />
                    যোগ করা হচ্ছে...
                  </>
                ) : (
                  "ছাত্রছাত্রী যোগ করুন"
                )}
              </Button>
            </form>

            <div className="relative w-full overflow-auto scrollbar-hide">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>স্টুডেন্ট রোল</TableHead>
                    <TableHead className="text-right">কার্যক্রম</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {enrolledStudents.map((student) => (
                    <TableRow key={student.uid}>
                      <TableCell className="font-medium">
                        {student.roll}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() =>
                            requestDeleteStudent(student.uid, student.roll)
                          }
                        >
                          মুছে ফেলুন
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
      <EditExamModal
        exam={editingExam}
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onSuccess={(updatedExam) => {
          setExams((prev) =>
            prev.map((e) => (e.id === updatedExam.id ? updatedExam : e))
          );
        }}
      />

      <AlertDialog open={showConfirmation} onOpenChange={setShowConfirmation}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>ছাত্রছাত্রী যোগ করার নিশ্চয়তা</AlertDialogTitle>
            <AlertDialogDescription>
              আপনি কি নিম্নলিখিত ছাত্রছাত্রীকে ব্যাচে যোগ করতে নিশ্চিত?
            </AlertDialogDescription>
            {pendingStudent && (
              <div className="mt-4 space-y-2 pt-4 text-sm">
                <div>
                  <strong>নাম:</strong> {pendingStudent.name}
                </div>
                <div>
                  <strong>রোল:</strong> {pendingStudent.roll}
                </div>
                <div>
                  <strong>UUID:</strong> {pendingStudent.uid}
                </div>
              </div>
            )}
          </AlertDialogHeader>
          <div className="flex gap-3">
            <AlertDialogCancel>বাতিল করুন</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmAddStudent}
              className="bg-primary hover:bg-primary/90"
            >
              যোগ করুন
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>
      <ConfirmPasswordDialog
        open={isPasswordOpen}
        onOpenChange={(open) => {
          setIsPasswordOpen(open);
          if (!open) setPendingDelete(null);
        }}
        title="মুছে ফেলার নিশ্চিতকরণ"
        description={
          pendingDelete
            ? `আপনি ${pendingDelete.type === "exam" ? "পরীক্ষা" : "ছাত্রছাত্রী"} (${pendingDelete.label || pendingDelete.id}) মুছে ফেলতে যাচ্ছেন — এটি স্থায়ী। অ্যাডমিন পাসওয়ার্ড দিন।`
            : undefined
        }
        confirmLabel="মুছে ফেলুন"
        onConfirm={handleConfirmDelete}
      />
      <hr className="h-8 border-transparent" />
    </div>
  );
}
