"use client";

import React, { useState, useEffect } from "react";
import { apiRequest } from "@/lib/api";
import { StudentReport, Batch } from "@/lib/types";
import { PageHeader, CustomLoader } from "@/components";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  CheckCircle2,
  FileText,
  BarChart3,
  Download,
  Calendar,
  Users,
  TrendingUp,
  Activity,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";

const months = [
  { value: "01", label: "জানুয়ারি" },
  { value: "02", label: "ফেব্রুয়ারি" },
  { value: "03", label: "মার্চ" },
  { value: "04", label: "এপ্রিল" },
  { value: "05", label: "মে" },
  { value: "06", label: "জুন" },
  { value: "07", label: "জুলাই" },
  { value: "08", label: "অগাস্ট" },
  { value: "09", label: "সেপ্টেম্বর" },
  { value: "10", label: "অক্টোবর" },
  { value: "11", label: "নভেম্বর" },
  { value: "12", label: "ডিসেম্বর" },
];

const years = Array.from({ length: 5 }, (_, i) => ({
  value: (2024 + i).toString(),
  label: (2024 + i).toString(),
}));

export default function AdminReportsPage() {
  const [reports, setReports] = useState<StudentReport[]>([]);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [loading, setLoading] = useState(true);
  const [month, setMonth] = useState(
    String(new Date().getMonth() + 1).padStart(2, "0")
  );
  const [year, setYear] = useState(new Date().getFullYear().toString());
  const [batchId, setBatchId] = useState<string>("all");
  const [selectedDetail, setSelectedDetail] = useState<{
    title: string;
    content: string;
    items?: { label: string; value: string }[];
  } | null>(null);

  useEffect(() => {
    fetchBatches();
    fetchReports();
  }, [month, year, batchId]);

  const fetchBatches = async () => {
    try {
      const result = await apiRequest<Batch[]>("batches", "GET", null, {});
      if (result.success && result.data) {
        setBatches(result.data);
      }
    } catch {
      console.error("Failed to fetch batches");
    }
  };

  const fetchReports = async () => {
    setLoading(true);
    try {
      const result = await apiRequest<StudentReport[]>(
        "get-report",
        "GET",
        null,
        {
          month,
          year,
          batch_id: batchId !== "all" ? batchId : undefined,
        }
      );

      if (result.success && result.data) {
        setReports(result.data);
      }
    } catch (err) {
      console.error("Failed to fetch reports:", err);
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (student: StudentReport) => {
    const days = Object.values(student.days);
    let attendanceCount = 0;
    let tasksCount = 0;
    let examsCount = 0;

    days.forEach((day) => {
      if (day.attendance === "Yes") attendanceCount++;
      if (day.task_1 || day.task_2) tasksCount++;
      if (day.exams && day.exams.length > 0) examsCount++;
    });

    return { attendanceCount, tasksCount, examsCount, totalDays: days.length };
  };

  const exportToCSV = () => {
    const csv = [
      ["শিক্ষার্থী নাম", "মোট উপস্থিতি", "সম্পূর্ণ কাজ", "পরীক্ষা সংখ্যা"],
      ...reports.map((student) => {
        const stats = calculateStats(student);
        return [
          student.student_name,
          stats.attendanceCount,
          stats.tasksCount,
          stats.examsCount,
        ];
      }),
    ];

    const csvContent = csv
      .map((row) => row.map((cell) => `"${cell}"`).join(","))
      .join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `reports-${year}-${month}.csv`;
    a.click();
  };

  if (loading) {
    return <CustomLoader />;
  }

  return (
    <div className="container mx-auto px-2 sm:px-4 md:px-6 py-4 max-w-7xl space-y-8">
      <PageHeader
        title="শিক্ষার্থী রিপোর্ট এবং বিশ্লেষণ"
        description="সমস্ত শিক্ষার্থীর দৈনিক অগ্রগতি এবং অংশগ্রহণ ট্র্যাক করুন"
      />

      {/* Filters Card */}
      <Card className="border-primary/20 bg-gradient-to-r from-primary/5 to-transparent">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            ফিল্টার এবং সার্চ অপশন
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">মাস</label>
              <Select value={month} onValueChange={setMonth}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {months.map((m) => (
                    <SelectItem key={m.value} value={m.value}>
                      {m.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">বছর</label>
              <Select value={year} onValueChange={setYear}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {years.map((y) => (
                    <SelectItem key={y.value} value={y.value}>
                      {y.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">ব্যাচ</label>
              <Select value={batchId} onValueChange={setBatchId}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">সব ব্যাচ</SelectItem>
                  {batches.map((batch) => (
                    <SelectItem key={batch.id} value={batch.id}>
                      {batch.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-end">
              <Button
                onClick={exportToCSV}
                variant="outline"
                className="w-full"
              >
                <Download className="h-4 w-4 mr-2" />
                CSV ডাউনলোড করুন
              </Button>
            </div>

            <div className="flex items-end">
              <Button onClick={fetchReports} className="w-full">
                <FileText className="h-4 w-4 mr-2" />
                রিপোর্ট রিফ্রেশ করুন
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats Overview */}
      {reports.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card className="border-blue-200 dark:border-blue-800 bg-gradient-to-br from-blue-50 dark:from-blue-950/20 to-transparent">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Users className="h-4 w-4 text-blue-600" />
                মোট শিক্ষার্থী
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-blue-700 dark:text-blue-400">
                {reports.length}
              </p>
            </CardContent>
          </Card>

          <Card className="border-green-200 dark:border-green-800 bg-gradient-to-br from-green-50 dark:from-green-950/20 to-transparent">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Activity className="h-4 w-4 text-green-600" />
                গড় উপস্থিতি
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-green-700 dark:text-green-400">
                {Math.round(
                  reports.reduce((sum, student) => {
                    const stats = calculateStats(student);
                    return sum + (stats.attendanceCount / stats.totalDays) * 100;
                  }, 0) / reports.length
                )}
                %
              </p>
            </CardContent>
          </Card>

          <Card className="border-purple-200 dark:border-purple-800 bg-gradient-to-br from-purple-50 dark:from-purple-950/20 to-transparent">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <BarChart3 className="h-4 w-4 text-purple-600" />
                সক্রিয় শিক্ষার্থী
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-purple-700 dark:text-purple-400">
                {reports.filter((s) => {
                  const stats = calculateStats(s);
                  return stats.attendanceCount > 0;
                }).length}
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Reports Table */}
      {reports.length > 0 ? (
        <Card className="border-neutral-200 dark:border-neutral-800">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              শিক্ষার্থী প্রতিবেদন
            </CardTitle>
            <CardDescription>
              {reports.length} জন শিক্ষার্থীর বিস্তারিত অগ্রগতি
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="w-full">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead className="font-semibold">নাম</TableHead>
                    <TableHead className="text-center font-semibold">
                      উপস্থিতি
                    </TableHead>
                    <TableHead className="text-center font-semibold">
                      কাজ সম্পূর্ণ
                    </TableHead>
                    <TableHead className="text-center font-semibold">
                      পরীক্ষা
                    </TableHead>
                    <TableHead className="text-center font-semibold">
                      অ্যাকশন
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {reports.map((student, idx) => {
                    const stats = calculateStats(student);
                    const attendancePercent =
                      ((stats.attendanceCount / stats.totalDays) * 100).toFixed(
                        0
                      ) + "%";

                    return (
                      <TableRow
                        key={idx}
                        className="hover:bg-muted/50 transition-colors"
                      >
                        <TableCell className="font-medium">
                          <div>
                            <p>{student.student_name}</p>
                            <p className="text-xs text-muted-foreground">
                              {student.student_roll}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell className="text-center">
                          <div className="flex flex-col items-center gap-1">
                            <Badge
                              variant="outline"
                              className="bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800 text-green-700 dark:text-green-400"
                            >
                              {stats.attendanceCount}/{stats.totalDays}
                            </Badge>
                            <span className="text-xs text-muted-foreground">
                              {attendancePercent}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge
                            variant="outline"
                            className="bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-400"
                          >
                            {stats.tasksCount}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge
                            variant="outline"
                            className="bg-purple-50 dark:bg-purple-950/20 border-purple-200 dark:border-purple-800 text-purple-700 dark:text-purple-400"
                          >
                            {stats.examsCount}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-center">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              const days = Object.entries(student.days);
                              setSelectedDetail({
                                title: `${student.student_name} - বিস্তারিত প্রতিবেদন`,
                                content: `মোট দিন: ${stats.totalDays}, উপস্থিতি: ${stats.attendanceCount}, কাজ: ${stats.tasksCount}`,
                                items: days.map(([date, day]) => ({
                                  label: `${date}: ${day.attendance === "Yes" ? "✓" : ""} ${day.task_1 || day.task_2 ? "📝" : ""} ${day.exams?.length || 0 > 0 ? "📊" : ""}`,
                                  value: `${date}`,
                                })),
                              });
                            }}
                          >
                            বিস্তারিত দেখুন
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </ScrollArea>
          </CardContent>
        </Card>
      ) : (
        <Card className="border-neutral-200 dark:border-neutral-800">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <BarChart3 className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-lg font-semibold text-muted-foreground">
              এই মাসে কোনো রিপোর্ট নেই
            </p>
            <p className="text-sm text-muted-foreground">
              ভিন্ন মাস বা বছর নির্বাচন করুন
            </p>
          </CardContent>
        </Card>
      )}

      {/* Detail Dialog */}
      <Dialog
        open={!!selectedDetail}
        onOpenChange={() => setSelectedDetail(null)}
      >
        <DialogContent className="max-w-2xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>{selectedDetail?.title}</DialogTitle>
          </DialogHeader>
          <ScrollArea className="w-full h-full">
            <div className="space-y-4 pr-4">
              <p className="text-sm text-muted-foreground">
                {selectedDetail?.content}
              </p>
              <div className="space-y-2">
                {selectedDetail?.items?.map((item, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded-lg bg-muted/50 border border-neutral-200 dark:border-neutral-800"
                  >
                    <p className="text-sm font-medium">{item.label}</p>
                  </div>
                ))}
              </div>
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </div>
  );
}
