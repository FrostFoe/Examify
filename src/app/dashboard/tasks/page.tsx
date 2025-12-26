"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { apiRequest } from "@/lib/api";
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
import {
  CheckCircle,
  Clock,
  Plus,
  Trash2,
  Save,
  Hourglass,
  Circle,
  Info,
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
    <div className="space-y-6 max-w-4xl mx-auto pb-10">
      <PageHeader
        title="দৈনিক টাস্ক এবং উপস্থিতি"
        description={`আজকের তারিখ: ${new Date().toLocaleDateString("bn-BD")} | সময়: ${formatTime(serverTime)}`}
      />

      <div className="grid gap-6">
        {/* Attendance Card */}
        <Card className="border-primary/20 bg-card/50 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-primary" />
              উপস্থিতি (Attendance)
            </CardTitle>
            <CardDescription>
              সাজেস্টেড টাইম: সকাল ৪:০০ - ৭:৫৯
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-lg bg-muted/50">
              <div className="space-y-1">
                <p className="text-sm font-medium">বর্তমান স্ট্যাটাস:</p>
                <p className={`text-lg font-bold flex items-center gap-2 ${attendance === 'Yes' ? 'text-green-500' : 'text-yellow-500'}`}>
                  {attendance === "Yes" ? (
                    <>
                      <CheckCircle className="h-5 w-5" /> উপস্থিত
                    </>
                  ) : (
                    "উপস্থিতি দিন"
                  )}
                </p>
              </div>

              <div className="flex items-center gap-2 text-sm">
                {attendanceStatus === "waiting" && (
                  <span className="flex items-center gap-1 text-orange-500">
                    <Hourglass className="h-4 w-4" /> সময় শুরু হতে বাকি
                  </span>
                )}
                {attendanceStatus === "active" && (
                  <span className="flex items-center gap-1 text-green-500 animate-pulse">
                    <Circle className="h-4 w-4 fill-current" /> এখন সেরা সময়
                  </span>
                )}
                {attendanceStatus === "ended" && (
                  <span className="flex items-center gap-1 text-muted-foreground">
                    <Info className="h-4 w-4" /> সাজেস্টেড সময় শেষ
                  </span>
                )}
              </div>

              <Button
                disabled={attendance === "Yes" || loading}
                onClick={() => handleSave(undefined, true)}
                className="bg-primary hover:bg-primary/90"
              >
                {attendance === "Yes" ? "উপস্থিতি দেওয়া হয়েছে" : "উপস্থিতি নিশ্চিত করুন"}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Task Form */}
        <form onSubmit={handleSave} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-primary" />
                দৈনিক টাস্ক (Tasks)
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Task 1 */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="task_1" className="text-base font-semibold">
                    টাস্ক ১ (Task 1)
                  </Label>
                  <span className={`text-xs px-2 py-1 rounded-full ${task1Status === 'active' ? 'bg-green-500/10 text-green-500' : 'bg-muted text-muted-foreground'}`}>
                    দুপুর ১২টা - ১টা
                  </span>
                </div>
                <Textarea
                  id="task_1"
                  placeholder="আপনার টাস্ক ১ এর বিবরণ দিন..."
                  className="min-h-[100px] bg-background/50"
                  value={task1}
                  onChange={(e) => setTask1(e.target.value)}
                />
              </div>

              {/* Task 2 */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="task_2" className="text-base font-semibold">
                    টাস্ক ২ (Task 2)
                  </Label>
                  <span className={`text-xs px-2 py-1 rounded-full ${task2Status === 'active' ? 'bg-green-500/10 text-green-500' : 'bg-muted text-muted-foreground'}`}>
                    রাত ৯টা - ১০টা
                  </span>
                </div>
                <Textarea
                  id="task_2"
                  placeholder="আপনার টাস্ক ২ এর বিবরণ দিন..."
                  className="min-h-[100px] bg-background/50"
                  value={task2}
                  onChange={(e) => setTask2(e.target.value)}
                />
              </div>

              {/* Exam Links */}
              <div className="space-y-3">
                <Label className="text-base font-semibold">পরীক্ষার লিংক (Exam Links)</Label>
                {examLinks.map((link, index) => (
                  <div key={index} className="flex gap-2">
                    <Input
                      type="url"
                      placeholder="https://..."
                      value={link}
                      onChange={(e) => {
                        const newLinks = [...examLinks];
                        newLinks[index] = e.target.value;
                        setExamLinks(newLinks);
                      }}
                      className="bg-background/50"
                    />
                    {examLinks.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => removeExamLink(index)}
                        className="text-destructive hover:bg-destructive/10"
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
                  className="flex items-center gap-1"
                >
                  <Plus className="h-4 w-4" /> আরও লিংক যোগ করুন
                </Button>
              </div>

              {/* Exam Marks */}
              <div className="space-y-3">
                <Label className="text-base font-semibold">পরীক্ষার নম্বর (Exam Marks)</Label>
                {examMarks.map((mark, index) => (
                  <div key={index} className="flex gap-2">
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
                      className="bg-background/50"
                    />
                    {examMarks.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => removeExamMark(index)}
                        className="text-destructive hover:bg-destructive/10"
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
                  className="flex items-center gap-1"
                >
                  <Plus className="h-4 w-4" /> আরও নম্বর যোগ করুন
                </Button>
              </div>
            </CardContent>
          </Card>

          <Button
            type="submit"
            disabled={loading}
            className="w-full h-12 text-lg font-bold shadow-lg"
          >
            {loading ? (
              "সেভ করা হচ্ছে..."
            ) : (
              <>
                <Save className="mr-2 h-5 w-5" /> ডেটা সেভ / আপডেট করুন
              </>
            )}
          </Button>
        </form>
      </div>
    </div>
  );
}
