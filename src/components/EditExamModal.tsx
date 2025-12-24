"use client";

import { useState, useEffect, useRef, FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { Exam } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";
import { updateExam } from "@/lib/actions";
import { CustomLoader } from "@/components";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { Checkbox } from "./ui/checkbox";
import { Label } from "./ui/label";
import { ScrollArea } from "./ui/scroll-area";
import QuestionSelector from "./QuestionSelector";
import { Plus, Trash2 } from "lucide-react";

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

interface EditExamModalProps {
  exam: Exam | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (updatedExam: Exam) => void;
}

const hours12 = Array.from({ length: 12 }, (_, i) =>
  (i + 1).toString().padStart(2, "0"),
);
const minutes = Array.from({ length: 60 }, (_, i) =>
  i.toString().padStart(2, "0"),
);

export function EditExamModal({ exam, isOpen, onClose, onSuccess }: EditExamModalProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [mode, setMode] = useState<"live" | "practice">("live");
  const formRef = useRef<HTMLFormElement>(null);
  const [shuffle, setShuffle] = useState(false);
  const [isCustomExam, setIsCustomExam] = useState(false);
  const [useQuestionBank, setUseQuestionBank] = useState(false);
  const [mandatorySubjects, setMandatorySubjects] = useState<string[]>([]);
  const [optionalSubjects, setOptionalSubjects] = useState<string[]>([]);
  const [selectedQuestionIds, setSelectedQuestionIds] = useState<string[]>([]);

  const [startDate, setStartDate] = useState<Date | undefined>(undefined);
  const [startHour, setStartHour] = useState("12");
  const [startMinute, setStartMinute] = useState("00");
  const [startPeriod, setStartPeriod] = useState<"AM" | "PM">("AM");

  const [endDate, setEndDate] = useState<Date | undefined>(undefined);
  const [endHour, setEndHour] = useState("12");
  const [endMinute, setEndMinute] = useState("00");
  const [endPeriod, setEndPeriod] = useState<"AM" | "PM">("AM");

  useEffect(() => {
    if (exam) {
      formRef.current?.reset();
      setMode((exam?.is_practice ? "practice" : "live") as "live" | "practice");
      setShuffle(exam?.shuffle_questions || false);
      setIsCustomExam(!!exam.total_subjects && exam.total_subjects > 0);
      setUseQuestionBank(exam.question_ids && exam.question_ids.length > 0);
      setMandatorySubjects(exam.mandatory_subjects || []);
      setOptionalSubjects(exam.optional_subjects || []);
      setSelectedQuestionIds(exam.question_ids || []);

      if (exam.start_at) {
        const d = new Date(exam.start_at);
        setStartDate(d);
        const hour24 = d.getHours();
        setStartPeriod(hour24 >= 12 ? "PM" : "AM");
        setStartHour(
          (hour24 % 12 === 0 ? 12 : hour24 % 12).toString().padStart(2, "0"),
        );
        setStartMinute(d.getMinutes().toString().padStart(2, "0"));
      } else {
        setStartDate(undefined);
        setStartHour("12");
        setStartMinute("00");
        setStartPeriod("AM");
      }

      if (exam.end_at) {
        const d = new Date(exam.end_at);
        setEndDate(d);
        const hour24 = d.getHours();
        setEndPeriod(hour24 >= 12 ? "PM" : "AM");
        setEndHour(
          (hour24 % 12 === 0 ? 12 : hour24 % 12).toString().padStart(2, "0"),
        );
        setEndMinute(d.getMinutes().toString().padStart(2, "0"));
      } else {
        setEndDate(undefined);
        setEndHour("12");
        setEndMinute("00");
        setEndPeriod("AM");
      }
    }
  }, [exam]);

  const handleNumberInput = (e: FormEvent<HTMLInputElement>) => {
    const input = e.target as HTMLInputElement;
    input.value = bengaliToEnglishNumber(input.value);
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

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-h-[90vh] w-[95vw] rounded-2xl md:max-w-2xl p-4 md:p-6 overflow-y-auto flex flex-col">
        <DialogHeader className="shrink-0">
          <DialogTitle>পরীক্ষা সম্পাদন করুন</DialogTitle>
          <DialogDescription>নিচে পরীক্ষার বিবরণ আপডেট করুন।</DialogDescription>
        </DialogHeader>
        <div className="flex-1 overflow-y-auto">
          <form
            ref={formRef}
            action={async (formData) => {
              setIsSubmitting(true);
              if (exam?.id) {
                formData.append("id", exam.id);
              }
              if (exam?.batch_id) {
                formData.append("batch_id", exam.batch_id);
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
              
              formData.set("question_ids", JSON.stringify(selectedQuestionIds));

              const result = await updateExam(formData);
              if (result.success) {
                toast({ title: "পরীক্ষা সফলভাবে আপডেট করা হয়েছে!" });
                if (onSuccess && result.data) {
                  onSuccess(result.data as Exam);
                }
                onClose();
              } else {
                toast({
                  title: "পরীক্ষা আপডেট করতে সমস্যা হয়েছে",
                  description: result.message,
                  variant: "destructive",
                });
              }
              setIsSubmitting(false);
            }}
            className="space-y-4"
          >
            <div className="space-y-2">
              <Label htmlFor="exam-name-edit">পরীক্ষার নাম</Label>
              <Input
                id="exam-name-edit"
                type="text"
                name="name"
                defaultValue={exam?.name || ""}
                placeholder="পরীক্ষার নাম"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="duration_minutes-edit">সময় (মিনিট)</Label>
              <Input
                id="duration_minutes-edit"
                type="number"
                name="duration_minutes"
                defaultValue={String(exam?.duration_minutes || "")}
                placeholder="সময় (মিনিট)"
                onInput={handleNumberInput}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="marks_per_question-edit">
                প্রশ্ন প্রতি মার্ক
              </Label>
              <Input
                id="marks_per_question-edit"
                type="number"
                step="0.1"
                name="marks_per_question"
                defaultValue={String(exam?.marks_per_question || "1")}
                placeholder="প্রশ্ন প্রতি মার্ক"
                onInput={handleNumberInput}
              />
            </div>

            <div className="flex flex-col md:flex-row md:items-center gap-3">
              <Label>পরীক্ষার মোড</Label>
              <Select
                value={mode}
                onValueChange={(value) => setMode(value as "live" | "practice")}
              >
                <SelectTrigger className="w-full md:w-[220px]">
                  <SelectValue placeholder="পরীক্ষার মোড নির্বাচন করুন" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="live">লাইভ (Time-limited)</SelectItem>
                  <SelectItem value="practice">প্রাকটিস (আনলিমিটেড)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {mode === "live" && (
              <div className="space-y-4 p-4 bg-muted/30 rounded-lg">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-sm font-semibold">শুরুর তারিখ</Label>
                    <Input
                      type="date"
                      value={
                        startDate ? startDate.toLocaleDateString("en-CA") : ""
                      }
                      onChange={(e) =>
                        setStartDate(
                          e.target.value ? new Date(e.target.value) : undefined,
                        )
                      }
                      className="w-full"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-semibold">শুরুর সময়</Label>
                    <div className="flex gap-1 items-center">
                      <Select value={startHour} onValueChange={setStartHour}>
                        <SelectTrigger className="w-20">
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
                      <span className="text-lg font-bold text-muted-foreground">:</span>
                      <Select value={startMinute} onValueChange={setStartMinute}>
                        <SelectTrigger className="w-20">
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
                        onValueChange={(v) => setStartPeriod(v as "AM" | "PM")}
                      >
                        <SelectTrigger className="w-24">
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
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-sm font-semibold">শেষের তারিখ</Label>
                    <Input
                      type="date"
                      value={
                        endDate ? endDate.toLocaleDateString("en-CA") : ""
                      }
                      onChange={(e) =>
                        setEndDate(
                          e.target.value ? new Date(e.target.value) : undefined,
                        )
                      }
                      className="w-full"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-semibold">শেষের সময়</Label>
                    <div className="flex gap-1 items-center">
                      <Select value={endHour} onValueChange={setEndHour}>
                        <SelectTrigger className="w-20">
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
                      <span className="text-lg font-bold text-muted-foreground">:</span>
                      <Select value={endMinute} onValueChange={setEndMinute}>
                        <SelectTrigger className="w-20">
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
                        onValueChange={(v) => setEndPeriod(v as "AM" | "PM")}
                      >
                        <SelectTrigger className="w-24">
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
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="negative_marks-edit">নেগেটিভ মার্ক</Label>
              <Input
                id="negative_marks-edit"
                type="number"
                step="0.01"
                name="negative_marks_per_wrong"
                defaultValue={String(exam?.negative_marks_per_wrong || "")}
                placeholder="নেগেটিভ মার্ক"
                onInput={handleNumberInput}
              />
            </div>
            <input
              name="is_practice"
              type="hidden"
              value={mode === "practice" ? "true" : "false"}
            />
            <input
              type="hidden"
              name="file_id"
              defaultValue={exam?.file_id || ""}
            />
            <div className="flex items-center space-x-2 pt-2">
              <Checkbox
                id="use-question-bank-toggle-edit"
                checked={useQuestionBank}
                onCheckedChange={(checked) =>
                  setUseQuestionBank(checked as boolean)
                }
              />
              <Label htmlFor="use-question-bank-toggle-edit">প্রশ্ন ব্যাংক থেকে প্রশ্ন বাছুন</Label>
            </div>

            {useQuestionBank && (
              <div className="space-y-2 p-4 border rounded-md bg-muted/30">
                <Label className="text-sm font-semibold">প্রশ্ন নির্বাচন</Label>
                <QuestionSelector
                  selectedIds={selectedQuestionIds}
                  onChange={setSelectedQuestionIds}
                  minimal
                />
              </div>
            )}

            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="shuffle_questions_edit"
                  name="shuffle_questions"
                  checked={shuffle}
                  onCheckedChange={(checked) => setShuffle(checked as boolean)}
                  value="true"
                />
                <Label htmlFor="shuffle_questions_edit">
                  প্রশ্নগুলো এলোমেলো করুন
                </Label>
              </div>
            </div>

            <div className="flex items-center space-x-2 pt-2">
              <Checkbox
                id="custom-exam-toggle-edit"
                checked={isCustomExam}
                onCheckedChange={(checked) =>
                  setIsCustomExam(checked as boolean)
                }
              />
              <Label htmlFor="custom-exam-toggle-edit">কাস্টম এক্সাম</Label>
            </div>

            {isCustomExam && (
              <div className="space-y-4 p-4 border rounded-md">
                <div className="space-y-2">
                  <Label htmlFor="total_subjects-edit">মোট বিষয়</Label>
                  <Input
                    id="total_subjects-edit"
                    name="total_subjects"
                    type="number"
                    min="1"
                    step="1"
                    placeholder="e.g., 4"
                    defaultValue={exam?.total_subjects || ""}
                    onInput={handleNumberInput}
                  />
                </div>

                <div className="space-y-2">
                  <Label>দাগানো বাধ্যতামূলক</Label>
                  <div className="grid grid-cols-2 gap-2">
                    {subjects.map((subject) => (
                      <div
                        key={`mandatory-edit-${subject.id}`}
                        className="flex items-center space-x-2"
                      >
                        <Checkbox
                          id={`mandatory-edit-${subject.id}`}
                          name="mandatory_subjects"
                          value={subject.id}
                          checked={mandatorySubjects.includes(subject.id)}
                          onCheckedChange={(checked) => {
                            setMandatorySubjects((prev) =>
                              checked
                                ? [...prev, subject.id]
                                : prev.filter((s) => s !== subject.id),
                            );
                          }}
                        />
                        <Label htmlFor={`mandatory-edit-${subject.id}`}>
                          {subject.name} ({subject.id})
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>অন্যান্য বিষয়</Label>
                  <div className="grid grid-cols-2 gap-2">
                    {subjects.map((subject) => (
                      <div
                        key={`optional-edit-${subject.id}`}
                        className="flex items-center space-x-2"
                      >
                        <Checkbox
                          id={`optional-edit-${subject.id}`}
                          name="optional_subjects"
                          value={subject.id}
                          checked={optionalSubjects.includes(subject.id)}
                          onCheckedChange={(checked) => {
                            setOptionalSubjects((prev) =>
                              checked
                                ? [...prev, subject.id]
                                : prev.filter((s) => s !== subject.id),
                            );
                          }}
                        />
                        <Label htmlFor={`optional-edit-${subject.id}`}>
                          {subject.name} ({subject.id})
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            <Button type="submit" disabled={isSubmitting} className="w-full">
              {isSubmitting ? (
                <CustomLoader minimal />
              ) : (
                "পরীক্ষা আপডেট করুন"
              )}
            </Button>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
}
