"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { apiRequest } from "@/lib/api";
import { StudentReport } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  CheckCircle,
  Clock,
  Plus,
  Trash2,
  Save,
  Hourglass,
  Circle,
} from "lucide-react";
import { PageHeader } from "@/components";

export default function DailyTaskPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [attendance, setAttendance] = useState<string | null>(null);
  const [task1, setTask1] = useState("");
  const [task2, setTask2] = useState("");
  const [examLinks, setExamLinks] = useState<string[]>([""]);
  const [examMarks, setExamMarks] = useState<string[]>([""]);
  const [serverTime, setServerTime] = useState(new Date());

  // Fetch initial data
  useEffect(() => {
    if (user) {
      fetchTodayData();
    }
  }, [user]);

  const fetchTodayData = async () => {
    const now = new Date();
    const offset = now.getTimezoneOffset();
    const localDate = new Date(now.getTime() - offset * 60 * 1000);
    const todayStr = localDate.toISOString().split("T")[0];

    const result = await apiRequest<StudentReport[]>("get-report", "GET", null, {
      student_uid: user?.uid,
      month: todayStr.split("-")[1],
      year: todayStr.split("-")[0],
    });

    if (result.success && result.data && result.data.length > 0) {
      const studentData = result.data[0];
      const todayData = studentData.days[todayStr];

      if (todayData) {
        setAttendance(todayData.attendance);
        setTask1(todayData.task_1 || "");
        setTask2(todayData.task_2 || "");
        if (todayData.exams && todayData.exams.length > 0) {
          setExamLinks(todayData.exams);
          setExamMarks(todayData.marks || todayData.exams.map(() => ""));
        }
      }
    }
  };

  // Clock effect
  useEffect(() => {
    const timer = setInterval(() => {
      setServerTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: true,
    });
  };

  const getCountdownStatus = (startHour: number, endHour: number) => {
    const hour = serverTime.getHours();
    if (hour < startHour) {
      return "waiting";
    } else if (hour >= startHour && hour < endHour) {
      return "active";
    } else {
      return "ended";
    }
  };

  const addExamLink = () => setExamLinks([...examLinks, ""]);
  const removeExamLink = (index: number) => {
    const newLinks = [...examLinks];
    newLinks.splice(index, 1);
    setExamLinks(newLinks);
  };

  const addExamMark = () => setExamMarks([...examMarks, ""]);
  const removeExamMark = (index: number) => {
    const newMarks = [...examMarks];
    newMarks.splice(index, 1);
    setExamMarks(newMarks);
  };

  const handleSave = async (e?: React.FormEvent, attendanceOnly = false) => {
    if (e) e.preventDefault();
    if (!user) return;

    setLoading(true);
    try {
      const now = new Date();
      const offset = now.getTimezoneOffset();
      const localDate = new Date(now.getTime() - offset * 60 * 1000);
      const todayStr = localDate.toISOString().split("T")[0];

      const payload = {
        student_uid: user.uid,
        action: attendanceOnly ? "attendance" : "save_task",
        attendance: attendanceOnly ? "Yes" : attendance,
        task_1: task1,
        task_2: task2,
        exam_links: examLinks.filter((l) => l.trim() !== ""),
        exam_marks: examMarks.filter((m) => m.trim() !== ""),
        date: todayStr,
      };

      const result = await apiRequest("save-task", "POST", payload);

      if (result.success) {
        toast({
          title: "সাফল্য!",
          description: attendanceOnly
            ? "আপনার উপস্থিতি নিশ্চিত করা হয়েছে।"
            : "আপনার টাস্ক সফলভাবে সেভ করা হয়েছে।",
        });
        if (attendanceOnly) setAttendance("Yes");
      } else {
        toast({
          variant: "destructive",
          title: "ত্রুটি",
          description: result.message || "ডেটা সেভ করতে সমস্যা হয়েছে।",
        });
      }
    } catch {
      toast({
        variant: "destructive",
        title: "ত্রুটি",
        description: "সার্ভারের সাথে সংযোগ করা যাচ্ছে না।",
      });
    } finally {
      setLoading(false);
    }
  };

  const attendanceStatus = getCountdownStatus(4, 8);
  const task1Status = getCountdownStatus(12, 13);
  const task2Status = getCountdownStatus(21, 22);

  return (
    <div className="container mx-auto px-2 sm:px-4 md:px-6 py-4 max-w-6xl space-y-8 pb-20 animate-in fade-in duration-500">
      <PageHeader
        title="দৈনিক টাস্ক এবং উপস্থিতি"
        description={`আজকের তারিখ: ${new Date().toLocaleDateString("bn-BD")} | সময়: ${formatTime(serverTime)}`}
      />

      <div className="grid gap-8">
        {/* Attendance Card - Premium Styled */}
        <Card className="border-primary/10 bg-card/40 backdrop-blur-md shadow-2xl relative overflow-hidden group">
          <div className="absolute top-0 left-0 w-1 h-full bg-primary" />
          <CardHeader>
            <CardTitle className="flex items-center gap-3 text-2xl font-bold tracking-tight">
              <div className="p-2 rounded-lg bg-primary/10 text-primary">
                <CheckCircle className="h-6 w-6" />
              </div>
              উপস্থিতি (Attendance)
            </CardTitle>
            <CardDescription className="text-muted-foreground/80">
              সাজেস্টেড টাইম: সকাল ৪:০০ - ৭:৫৯
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 p-6 rounded-xl bg-muted/30 border border-primary/5">
              <div className="space-y-2">
                <p className="text-xs uppercase tracking-widest text-muted-foreground font-semibold">বর্তমান স্ট্যাটাস</p>
                <div className={`text-xl font-bold flex items-center gap-3 ${attendance === 'Yes' ? 'text-emerald-400' : 'text-amber-400'}`}>
                  {attendance === "Yes" ? (
                    <div className="flex items-center gap-2 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">
                      <CheckCircle className="h-5 w-5" /> <span>উপস্থিত</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 bg-amber-500/10 px-3 py-1 rounded-full border border-amber-500/20">
                      <Clock className="h-5 w-5" /> <span>উপস্থিতি দিন</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="text-right hidden sm:block">
                  {attendanceStatus === "active" ? (
                    <p className="text-xs font-bold text-emerald-400 flex items-center gap-1 justify-end animate-pulse">
                      <Circle className="h-2 w-2 fill-current" /> এখন সেরা সময়
                    </p>
                  ) : (
                    <p className="text-xs text-muted-foreground font-medium">সাজেস্টেড সময় অনুসরণ করুন</p>
                  )}
                </div>
                <Button
                  disabled={attendance === "Yes" || loading}
                  onClick={() => handleSave(undefined, true)}
                  className="bg-primary hover:bg-primary/90 text-white font-bold px-8 h-12 rounded-full shadow-lg shadow-primary/20 transition-all hover:scale-105 active:scale-95"
                >
                  {attendance === "Yes" ? "নিশ্চিত করা হয়েছে" : "উপস্থিতি নিশ্চিত করুন"}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Task Form - Premium Dark Style */}
        <form onSubmit={handleSave} className="space-y-8">
          <Card className="border-white/5 bg-card/40 backdrop-blur-md shadow-2xl">
            <CardHeader className="border-b border-white/5 pb-6">
              <CardTitle className="flex items-center gap-3 text-xl font-bold">
                <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400">
                  <Clock className="h-5 w-5" />
                </div>
                দৈনিক টাস্ক এবং অগ্রগতি
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-8 pt-8">
              {/* Task Fields with Floating Layout */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                <div className="space-y-3 group">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="task_1" className="text-sm font-bold text-muted-foreground group-focus-within:text-primary transition-colors">
                      টাস্ক ১ (Task 1)
                    </Label>
                    <Badge variant="outline" className={`${task1Status === 'active' ? 'border-emerald-500/50 text-emerald-400 bg-emerald-500/5' : 'border-white/10 text-muted-foreground'} text-[10px]`}>
                      দুপুর ১২টা - ১টা
                    </Badge>
                  </div>
                  <Textarea
                    id="task_1"
                    placeholder="আপনার টাস্ক ১ এর বিবরণ দিন..."
                    className="min-h-[120px] bg-black/20 border-white/10 focus:border-primary/50 focus:ring-primary/20 resize-none transition-all"
                    value={task1}
                    onChange={(e) => setTask1(e.target.value)}
                  />
                </div>

                <div className="space-y-3 group">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="task_2" className="text-sm font-bold text-muted-foreground group-focus-within:text-primary transition-colors">
                      টাস্ক ২ (Task 2)
                    </Label>
                    <Badge variant="outline" className={`${task2Status === 'active' ? 'border-emerald-500/50 text-emerald-400 bg-emerald-500/5' : 'border-white/10 text-muted-foreground'} text-[10px]`}>
                      রাত ৯টা - ১০টা
                    </Badge>
                  </div>
                  <Textarea
                    id="task_2"
                    placeholder="আপনার টাস্ক ২ এর বিবরণ দিন..."
                    className="min-h-[120px] bg-black/20 border-white/10 focus:border-primary/50 focus:ring-primary/20 resize-none transition-all"
                    value={task2}
                    onChange={(e) => setTask2(e.target.value)}
                  />
                </div>
              </div>

              {/* Dynamic Inputs with Modern Styling */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 pt-4 border-t border-white/5">
                <div className="space-y-4">
                  <Label className="text-sm font-bold text-muted-foreground flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-blue-500" /> পরীক্ষার লিংক (Exam Links)
                  </Label>
                  <div className="space-y-3">
                    {examLinks.map((link, index) => (
                      <div key={index} className="flex gap-2 group animate-in slide-in-from-left-2">
                        <Input
                          type="url"
                          placeholder="https://..."
                          value={link}
                          onChange={(e) => {
                            const newLinks = [...examLinks];
                            newLinks[index] = e.target.value;
                            setExamLinks(newLinks);
                          }}
                          className="bg-black/20 border-white/10 h-11"
                        />
                        {examLinks.length > 1 && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => removeExamLink(index)}
                            className="text-destructive hover:bg-destructive/10 h-11 w-11 shrink-0"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    ))}
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={addExamLink}
                      className="w-full border-dashed border-white/10 hover:border-primary/50 hover:bg-primary/5 text-xs text-muted-foreground"
                    >
                      <Plus className="h-3 w-3 mr-1" /> আরও লিংক যোগ করুন
                    </Button>
                  </div>
                </div>

                <div className="space-y-4">
                  <Label className="text-sm font-bold text-muted-foreground flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-pink-500" /> পরীক্ষার নম্বর (Exam Marks)
                  </Label>
                  <div className="space-y-3">
                    {examMarks.map((mark, index) => (
                      <div key={index} className="flex gap-2 group animate-in slide-in-from-right-2">
                        <Input
                          type="number"
                          step="0.01"
                          placeholder="0.00"
                          value={mark}
                          onChange={(e) => {
                            const newMarks = [...examMarks];
                            newMarks[index] = e.target.value;
                            setExamMarks(newMarks);
                          }}
                          className="bg-black/20 border-white/10 h-11"
                        />
                        {examMarks.length > 1 && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => removeExamMark(index)}
                            className="text-destructive hover:bg-destructive/10 h-11 w-11 shrink-0"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    ))}
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={addExamMark}
                      className="w-full border-dashed border-white/10 hover:border-primary/50 hover:bg-primary/5 text-xs text-muted-foreground"
                    >
                      <Plus className="h-3 w-3 mr-1" /> আরও নম্বর যোগ করুন
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Button
            type="submit"
            disabled={loading}
            className="w-full h-14 text-lg font-black uppercase tracking-widest shadow-2xl shadow-primary/20 rounded-xl transition-all hover:translate-y-[-2px] active:translate-y-[0px]"
          >
            {loading ? (
              <div className="flex items-center gap-2">
                <Hourglass className="h-5 w-5 animate-spin" /> সেভ করা হচ্ছে...
              </div>
            ) : (
              <>
                <Save className="mr-3 h-6 w-6" /> ডেটা সেভ / আপডেট করুন
              </>
            )}
          </Button>
        </form>
      </div>
    </div>
  );

}
