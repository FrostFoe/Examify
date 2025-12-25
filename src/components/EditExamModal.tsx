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
import type { Exam, SubjectConfig } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";
import { updateExam } from "@/lib/actions";
import { CSVUploadComponent, CustomLoader } from "@/components";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { Checkbox } from "./ui/checkbox";
import { Label } from "./ui/label";
import QuestionSelector from "./QuestionSelector";
import { ListChecks } from "lucide-react";
import { combineDhakaDateTime, parseDhakaDateTime } from "@/lib/utils";
import { fetchQuestions } from "@/lib/fetchQuestions";

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

const normalizeSubjects = (
  subs: string[] | SubjectConfig[] | null | undefined,
  type: "mandatory" | "optional",
): SubjectConfig[] => {
  if (!subs) return [];
  if (subs.length === 0) return [];
  if (typeof subs[0] === "string") {
    return (subs as string[]).map((id) => ({
      id,
      count: 0,
      question_ids: [],
      type,
    }));
  }
  return (subs as SubjectConfig[]).map((s) => ({ ...s, type }));
};

export function EditExamModal({
  exam,
  isOpen,
  onClose,
  onSuccess,
}: EditExamModalProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [mode, setMode] = useState<"live" | "practice">("live");
  const formRef = useRef<HTMLFormElement>(null);
  const [shuffle, setShuffle] = useState(false);
  const [isCustomExam, setIsCustomExam] = useState(false);
  const [useQuestionBank, setUseQuestionBank] = useState(false);
  const [availableSubjects, setAvailableSubjects] = useState(subjects);

  // New state for Subject Configs
  const [mandatorySubjects, setMandatorySubjects] = useState<SubjectConfig[]>(
    [],
  );
  const [optionalSubjects, setOptionalSubjects] = useState<SubjectConfig[]>([]);

  // Legacy global selection (still used if not custom exam or as fallback)
  const [selectedQuestionIds, setSelectedQuestionIds] = useState<string[]>([]);

  const [startDate, setStartDate] = useState<Date | undefined>(undefined);
  const [startHour, setStartHour] = useState("12");
  const [startMinute, setStartMinute] = useState("00");
  const [startPeriod, setStartPeriod] = useState<"AM" | "PM">("AM");

  const [endDate, setEndDate] = useState<Date | undefined>(undefined);
  const [endHour, setEndHour] = useState("12");
  const [endMinute, setEndMinute] = useState("00");
  const [endPeriod, setEndPeriod] = useState<"AM" | "PM">("AM");

  const [activeSubjectSelection, setActiveSubjectSelection] = useState<{
    id: string;
    type: "mandatory" | "optional";
  } | null>(null);

  useEffect(() => {
    if (exam) {
      formRef.current?.reset();
      setMode((exam?.is_practice ? "practice" : "live") as "live" | "practice");
      setShuffle(exam?.shuffle_questions || false);
      setIsCustomExam(!!exam.total_subjects && exam.total_subjects > 0);
      setUseQuestionBank(!!(exam.question_ids && exam.question_ids.length > 0));

      const mSubs = normalizeSubjects(exam.mandatory_subjects, "mandatory");
      const oSubs = normalizeSubjects(exam.optional_subjects, "optional");

      setMandatorySubjects(mSubs);
      setOptionalSubjects(oSubs);

      // Populate available subjects from existing config if not in the default list
      const existingSubjects = [...mSubs, ...oSubs];
      setAvailableSubjects((prev) => {
        const combined = [...prev];
        existingSubjects.forEach((s) => {
          if (!combined.find((item) => item.id === s.id)) {
            combined.push({ id: s.id, name: s.name || `Subject ${s.id}` });
          }
        });
        return combined;
      });

      setSelectedQuestionIds(exam.question_ids || []);

      if (exam.start_at) {
        const { date, hour, minute, period } = parseDhakaDateTime(
          exam.start_at,
        );
        setStartDate(date);
        setStartHour(hour);
        setStartMinute(minute);
        setStartPeriod(period);
      } else {
        setStartDate(undefined);
        setStartHour("12");
        setStartMinute("00");
        setStartPeriod("AM");
      }

      if (exam.end_at) {
        const { date, hour, minute, period } = parseDhakaDateTime(exam.end_at);
        setEndDate(date);
        setEndHour(hour);
        setEndMinute(minute);
        setEndPeriod(period);
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

  const handleSubjectToggle = (
    subjectId: string,
    type: "mandatory" | "optional",
    checked: boolean,
  ) => {
    const subject = availableSubjects.find((s) => s.id === subjectId);
    if (type === "mandatory") {
      if (checked) {
        setOptionalSubjects((prev) => prev.filter((s) => s.id !== subjectId));
      }
      setMandatorySubjects((prev) => {
        if (checked) {
          return [
            ...prev,
            {
              id: subjectId,
              name: subject?.name || `Subject ${subjectId}`,
              count: 0,
              question_ids: [],
              type: "mandatory",
            },
          ];
        }
        return prev.filter((s) => s.id !== subjectId);
      });
    } else {
      if (checked) {
        setMandatorySubjects((prev) => prev.filter((s) => s.id !== subjectId));
      }
      setOptionalSubjects((prev) => {
        if (checked) {
          return [
            ...prev,
            {
              id: subjectId,
              name: subject?.name || `Subject ${subjectId}`,
              count: 0,
              question_ids: [],
              type: "optional",
            },
          ];
        }
        return prev.filter((s) => s.id !== subjectId);
      });
    }
  };

  const updateSubjectConfig = (
    subjectId: string,
    type: "mandatory" | "optional",
    field: keyof SubjectConfig,
    value: string | number | string[],
  ) => {
    const updater = (prev: SubjectConfig[]) =>
      prev.map((s) => (s.id === subjectId ? { ...s, [field]: value } : s));

    if (type === "mandatory") setMandatorySubjects(updater);
    else setOptionalSubjects(updater);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    const formData = new FormData(e.currentTarget);
    if (exam?.id) {
      formData.append("id", exam.id);
    }
    if (exam?.batch_id) {
      formData.append("batch_id", exam.batch_id);
    }

    const startAtISO = combineDhakaDateTime(
      startDate,
      startHour,
      startMinute,
      startPeriod,
    );
    const endAtISO = combineDhakaDateTime(
      endDate,
      endHour,
      endMinute,
      endPeriod,
    );

    if (startAtISO) formData.set("start_at", startAtISO);
    if (endAtISO) formData.set("end_at", endAtISO);

    // Aggregate all question IDs
    const allQuestionIds = new Set<string>(selectedQuestionIds);

    if (isCustomExam) {
      mandatorySubjects.forEach((s) =>
        s.question_ids?.forEach((qid) => allQuestionIds.add(qid)),
      );
      optionalSubjects.forEach((s) =>
        s.question_ids?.forEach((qid) => allQuestionIds.add(qid)),
      );

      // Serialize subject configs
      formData.set("mandatory_subjects", JSON.stringify(mandatorySubjects));
      formData.set("optional_subjects", JSON.stringify(optionalSubjects));
    } else {
      // Fallback to simple string array if not custom exam (legacy support)
      formData.set(
        "mandatory_subjects",
        JSON.stringify(mandatorySubjects.map((s) => s.id)),
      );
      formData.set(
        "optional_subjects",
        JSON.stringify(optionalSubjects.map((s) => s.id)),
      );
    }

    formData.set("question_ids", JSON.stringify(Array.from(allQuestionIds)));

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
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-h-[90vh] w-[95vw] rounded-2xl md:max-w-2xl p-4 md:p-6 overflow-y-auto flex flex-col">
          <DialogHeader className="shrink-0">
            <DialogTitle>পরীক্ষা সম্পাদন করুন</DialogTitle>
            <DialogDescription>
              নিচে পরীক্ষার বিবরণ আপডেট করুন।
            </DialogDescription>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto">
            <form ref={formRef} onSubmit={handleSubmit} className="space-y-4">
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
                  onValueChange={(value) =>
                    setMode(value as "live" | "practice")
                  }
                >
                  <SelectTrigger className="w-full md:w-[220px]">
                    <SelectValue placeholder="পরীক্ষার মোড নির্বাচন করুন" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="live">লাইভ (Time-limited)</SelectItem>
                    <SelectItem value="practice">
                      প্রাকটিস (আনলিমিটেড)
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {mode === "live" && (
                <div className="space-y-4 p-4 bg-muted/30 rounded-lg">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-sm font-semibold">
                        শুরুর তারিখ
                      </Label>
                      <Input
                        type="date"
                        value={
                          startDate ? startDate.toLocaleDateString("en-CA") : ""
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
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm font-semibold">
                        শুরুর সময়
                      </Label>
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
                        <span className="text-lg font-bold text-muted-foreground">
                          :
                        </span>
                        <Select
                          value={startMinute}
                          onValueChange={setStartMinute}
                        >
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
                          onValueChange={(v) =>
                            setStartPeriod(v as "AM" | "PM")
                          }
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
                      <Label className="text-sm font-semibold">
                        শেষের তারিখ
                      </Label>
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
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm font-semibold">
                        শেষের সময়
                      </Label>
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
                        <span className="text-lg font-bold text-muted-foreground">
                          :
                        </span>
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

              {!isCustomExam && (
                <>
                  <div className="flex items-center space-x-2 pt-2">
                    <Checkbox
                      id="use-question-bank-toggle-edit"
                      checked={useQuestionBank}
                      onCheckedChange={(checked) =>
                        setUseQuestionBank(checked as boolean)
                      }
                    />
                    <Label htmlFor="use-question-bank-toggle-edit">
                      প্রশ্ন ব্যাংক থেকে প্রশ্ন বাছুন
                    </Label>
                  </div>

                  {useQuestionBank && (
                    <div className="space-y-2 p-4 border rounded-md bg-muted/30">
                      <Label className="text-sm font-semibold">
                        প্রশ্ন নির্বাচন
                      </Label>
                      <QuestionSelector
                        selectedIds={selectedQuestionIds}
                        onChange={setSelectedQuestionIds}
                        minimal
                      />
                    </div>
                  )}

                  <div className="mt-4">
                    <h3 className="text-sm font-medium mb-2">
                      অথবা CSV থেকে প্রশ্ন আপলোড করুন
                    </h3>
                    <CSVUploadComponent
                      isBank={false}
                      onUploadSuccess={async (result) => {
                        const fid = (result.file_id as string) || "";
                        if (formRef.current) {
                          const fileIdInput = formRef.current.querySelector(
                            'input[name="file_id"]',
                          ) as HTMLInputElement;
                          if (fileIdInput) fileIdInput.value = fid;
                        }

                        // Auto-group by sections if CSV has them
                        try {
                          const qs = await fetchQuestions(fid);
                          if (qs && qs.length > 0) {
                            const sectionMap = new Map<string, string[]>();
                            qs.forEach((q) => {
                              const section = String(
                                q.subject || q.type || "1",
                              );
                              if (!sectionMap.has(section)) {
                                sectionMap.set(section, []);
                              }
                              if (q.id)
                                sectionMap.get(section)?.push(String(q.id));
                            });

                            if (sectionMap.size > 0) {
                              const newSubjects = Array.from(
                                sectionMap.keys(),
                              ).map((s) => ({
                                id: s,
                                name: `Section ${s}`,
                              }));
                              setAvailableSubjects(newSubjects);
                              setIsCustomExam(true);

                              const configs: SubjectConfig[] = Array.from(
                                sectionMap.entries(),
                              ).map(([s, ids]) => ({
                                id: s,
                                name: `Section ${s}`,
                                count: ids.length,
                                question_ids: ids,
                                type: "mandatory",
                              }));
                              setMandatorySubjects(configs);
                              setOptionalSubjects([]);
                              toast({
                                title: "CSV Grouping Successful",
                                description: `Detected ${sectionMap.size} sections.`,
                              });
                            }
                          }
                        } catch (err) {
                          console.error("Error auto-grouping:", err);
                        }
                      }}
                    />
                  </div>
                </>
              )}

              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="shuffle_questions_edit"
                    name="shuffle_questions"
                    checked={shuffle}
                    onCheckedChange={(checked) =>
                      setShuffle(checked as boolean)
                    }
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
                <Label htmlFor="custom-exam-toggle-edit">
                  কাস্টম এক্সাম (বিষয় ভিত্তিক)
                </Label>
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

                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <Label className="text-base font-bold">
                        দাগানো বাধ্যতামূলক (Mandatory)
                      </Label>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="text-xs h-7"
                        onClick={() => {
                          const newId = `custom_${Date.now()}`;
                          setAvailableSubjects((prev) => [
                            ...prev,
                            { id: newId, name: "নতুন বিষয়" },
                          ]);
                        }}
                      >
                        নতুন বিষয় যোগ করুন
                      </Button>
                    </div>
                    <div className="space-y-3">
                      {availableSubjects.map((subject) => {
                        const isSelected = mandatorySubjects.some(
                          (s) => s.id === subject.id,
                        );
                        const config = mandatorySubjects.find(
                          (s) => s.id === subject.id,
                        );

                        return (
                          <div
                            key={`mandatory-edit-${subject.id}`}
                            className={`p-3 rounded-lg border ${isSelected ? "bg-primary/5 border-primary/20" : "bg-background"}`}
                          >
                            <div className="flex items-center space-x-2 mb-2">
                              <Checkbox
                                id={`mandatory-edit-${subject.id}`}
                                value={subject.id}
                                checked={isSelected}
                                onCheckedChange={(checked) =>
                                  handleSubjectToggle(
                                    subject.id,
                                    "mandatory",
                                    checked as boolean,
                                  )
                                }
                              />
                              <Input
                                className="h-8 font-semibold text-sm border-none bg-transparent focus-visible:ring-0 p-0"
                                value={
                                  config?.name ||
                                  availableSubjects.find(
                                    (s) => s.id === subject.id,
                                  )?.name
                                }
                                onChange={(e) => {
                                  const newName = e.target.value;
                                  setAvailableSubjects((prev) =>
                                    prev.map((s) =>
                                      s.id === subject.id
                                        ? { ...s, name: newName }
                                        : s,
                                    ),
                                  );
                                  if (config) {
                                    updateSubjectConfig(
                                      subject.id,
                                      "mandatory",
                                      "name",
                                      newName,
                                    );
                                  }
                                }}
                              />
                            </div>

                            {isSelected && config && (
                              <div className="pl-6 space-y-2">
                                <div className="flex items-center gap-2">
                                  <Input
                                    type="number"
                                    placeholder="প্রশ্ন সংখ্যা"
                                    className="h-8 w-32 text-xs"
                                    value={config.count || ""}
                                    onChange={(e) =>
                                      updateSubjectConfig(
                                        subject.id,
                                        "mandatory",
                                        "count",
                                        parseInt(e.target.value) || 0,
                                      )
                                    }
                                  />
                                  <span className="text-xs text-muted-foreground">
                                    টি প্রশ্ন
                                  </span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    className="h-8 text-xs"
                                    onClick={() =>
                                      setActiveSubjectSelection({
                                        id: subject.id,
                                        type: "mandatory",
                                      })
                                    }
                                  >
                                    <ListChecks className="w-3 h-3 mr-1" />
                                    প্রশ্ন বাছুন (
                                    {config.question_ids?.length || 0})
                                  </Button>
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <div className="space-y-4">
                    <Label className="text-base font-bold">
                      অন্যান্য বিষয় (Optional)
                    </Label>
                    <div className="space-y-3">
                      {availableSubjects.map((subject) => {
                        const isSelected = optionalSubjects.some(
                          (s) => s.id === subject.id,
                        );
                        const config = optionalSubjects.find(
                          (s) => s.id === subject.id,
                        );

                        return (
                          <div
                            key={`optional-edit-${subject.id}`}
                            className={`p-3 rounded-lg border ${isSelected ? "bg-secondary/5 border-secondary/20" : "bg-background"}`}
                          >
                            <div className="flex items-center space-x-2 mb-2">
                              <Checkbox
                                id={`optional-edit-${subject.id}`}
                                value={subject.id}
                                checked={isSelected}
                                onCheckedChange={(checked) =>
                                  handleSubjectToggle(
                                    subject.id,
                                    "optional",
                                    checked as boolean,
                                  )
                                }
                              />
                              <Input
                                className="h-8 font-semibold text-sm border-none bg-transparent focus-visible:ring-0 p-0"
                                value={
                                  config?.name ||
                                  availableSubjects.find(
                                    (s) => s.id === subject.id,
                                  )?.name
                                }
                                onChange={(e) => {
                                  const newName = e.target.value;
                                  setAvailableSubjects((prev) =>
                                    prev.map((s) =>
                                      s.id === subject.id
                                        ? { ...s, name: newName }
                                        : s,
                                    ),
                                  );
                                  if (config) {
                                    updateSubjectConfig(
                                      subject.id,
                                      "optional",
                                      "name",
                                      newName,
                                    );
                                  }
                                }}
                              />
                            </div>

                            {isSelected && config && (
                              <div className="pl-6 space-y-2">
                                <div className="flex items-center gap-2">
                                  <Input
                                    type="number"
                                    placeholder="প্রশ্ন সংখ্যা"
                                    className="h-8 w-32 text-xs"
                                    value={config.count || ""}
                                    onChange={(e) =>
                                      updateSubjectConfig(
                                        subject.id,
                                        "optional",
                                        "count",
                                        parseInt(e.target.value) || 0,
                                      )
                                    }
                                  />
                                  <span className="text-xs text-muted-foreground">
                                    টি প্রশ্ন
                                  </span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    className="h-8 text-xs"
                                    onClick={() =>
                                      setActiveSubjectSelection({
                                        id: subject.id,
                                        type: "optional",
                                      })
                                    }
                                  >
                                    <ListChecks className="w-3 h-3 mr-1" />
                                    প্রশ্ন বাছুন (
                                    {config.question_ids?.length || 0})
                                  </Button>
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              <Button type="submit" disabled={isSubmitting} className="w-full">
                {isSubmitting ? <CustomLoader minimal /> : "পরীক্ষা আপডেট করুন"}
              </Button>
            </form>
          </div>
        </DialogContent>
      </Dialog>

      {/* Secondary Dialog for Subject Question Selection */}
      <Dialog
        open={!!activeSubjectSelection}
        onOpenChange={(open) => !open && setActiveSubjectSelection(null)}
      >
        <DialogContent className="max-w-4xl h-[85vh] flex flex-col p-0">
          <DialogHeader className="p-4 border-b shrink-0">
            <DialogTitle>
              {activeSubjectSelection &&
                availableSubjects.find((s) => s.id === activeSubjectSelection.id)
                  ?.name}{" "}
              - প্রশ্ন নির্বাচন
            </DialogTitle>
            <DialogDescription>
              এই বিষয়ের জন্য প্রশ্ন নির্বাচন করুন
            </DialogDescription>
          </DialogHeader>
          <div className="flex-1 overflow-hidden p-4">
            {activeSubjectSelection && (
              <QuestionSelector
                selectedIds={
                  (activeSubjectSelection.type === "mandatory"
                    ? mandatorySubjects.find(
                        (s) => s.id === activeSubjectSelection.id,
                      )?.question_ids
                    : optionalSubjects.find(
                        (s) => s.id === activeSubjectSelection.id,
                      )?.question_ids) || []
                }
                onChange={(ids) => {
                  updateSubjectConfig(
                    activeSubjectSelection.id,
                    activeSubjectSelection.type,
                    "question_ids",
                    ids,
                  );
                }}
              />
            )}
          </div>
          <div className="p-4 border-t shrink-0 flex justify-end">
            <Button onClick={() => setActiveSubjectSelection(null)}>
              সম্পন্ন
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
