"use client";

import React, { useState, useEffect } from "react";
import { apiRequest } from "@/lib/api";
import { StudentReport, Batch } from "@/lib/types";
import { PageHeader } from "@/components";
import {
  Card,
  CardContent,
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
  Search,
  Download,
  Calendar,
  Filter,
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
  { value: "01", label: "January" },
  { value: "02", label: "February" },
  { value: "03", label: "March" },
  { value: "04", label: "April" },
  { value: "05", label: "May" },
  { value: "06", label: "June" },
  { value: "07", label: "July" },
  { value: "08", label: "August" },
  { value: "09", label: "September" },
  { value: "10", label: "October" },
  { value: "11", label: "November" },
  { value: "12", label: "December" },
];

const years = Array.from({ length: 5 }, (_, i) => ({
  value: (2024 + i).toString(),
  label: (2024 + i).toString(),
}));

export default function AdminReportsPage() {
  const [reports, setReports] = useState<StudentReport[]>([]);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [loading, setLoading] = useState(true);
  const [month, setMonth] = useState(new Date().getMonth() + 1 + "");
  const [year, setYear] = useState(new Date().getFullYear() + "");
  const [batchId, setBatchId] = useState<string>("all");
  
  const [selectedDetail, setSelectedDetail] = useState<{
    title: string;
    content: string;
    items?: { label: string; value: string }[];
  } | null>(null);

  useEffect(() => {
    fetchBatches();
    fetchReports();
  }, []);

  const fetchBatches = async () => {
    const result = await apiRequest<Batch[]>("batches");
    if (result.success) setBatches(result.data);
  };

  const fetchReports = async () => {
    setLoading(true);
    const params: Record<string, string> = {
      month: month.padStart(2, "0"),
      year: year,
    };
    if (batchId !== "all") params.batch_id = batchId;

    const result = await apiRequest<StudentReport[]>("get-report", "GET", null, params);
    if (result.success) {
      setReports(result.data);
    }
    setLoading(false);
  };

  const daysInMonth = new Date(parseInt(year), parseInt(month), 0).getDate();
  const dayHeaders = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  const getProgressColor = (progress: number) => {
    if (progress >= 100) return "bg-green-500 text-white";
    if (progress > 0) return "bg-pink-500 text-white";
    return "bg-slate-700 text-slate-400";
  };

  return (
    <div className="space-y-6 pb-10">
      <PageHeader
        title="মাসিক রিপোর্টস"
        description="ছাত্রদের দৈনিক উপস্থিতি এবং টাস্ক প্রগ্রেস ট্র্যাক করুন।"
      />

      {/* Filters */}
      <Card className="bg-card/50 backdrop-blur-sm">
        <CardContent className="pt-6">
          <div className="flex flex-wrap items-end gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center gap-1">
                <Calendar className="h-4 w-4" /> মাস
              </label>
              <Select value={month} onValueChange={setMonth}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="মাস নির্বাচন করুন" />
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

            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center gap-1">
                <Calendar className="h-4 w-4" /> বছর
              </label>
              <Select value={year} onValueChange={setYear}>
                <SelectTrigger className="w-[120px]">
                  <SelectValue placeholder="বছর নির্বাচন করুন" />
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

            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center gap-1">
                <Filter className="h-4 w-4" /> ব্যাচ
              </label>
              <Select value={batchId} onValueChange={setBatchId}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="ব্যাচ নির্বাচন করুন" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">সকল ব্যাচ</SelectItem>
                  {batches.map((b) => (
                    <SelectItem key={b.id} value={b.id}>
                      {b.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Button onClick={fetchReports} disabled={loading} className="gap-2">
              <Search className="h-4 w-4" /> লোড করুন
            </Button>

            <Button variant="outline" onClick={() => window.print()} className="gap-2 ml-auto">
              <Download className="h-4 w-4" /> PDF ডাউনলোড
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Report Table */}
      <Card className="overflow-hidden border-none shadow-xl bg-[#1e1e2f] text-white">
        <CardHeader className="bg-[#1d253b] border-b border-slate-700 py-4">
          <CardTitle className="text-lg font-light flex items-center justify-between">
            <span>মাসিক রিপোর্ট: {months.find(m => m.value === month.padStart(2, "0"))?.label} {year}</span>
            <Badge variant="outline" className="text-slate-400 border-slate-700">
              Students: {reports.length}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <ScrollArea className="w-full">
            <div className="min-w-[1200px]">
              <Table className="border-collapse">
                <TableHeader>
                  <TableRow className="bg-[#1d253b] hover:bg-[#1d253b] border-slate-700">
                    <TableHead className="w-[180px] sticky left-0 z-30 bg-[#1d253b] text-slate-300 font-bold border-r border-slate-700">
                      Student Name
                    </TableHead>
                    <TableHead className="w-[120px] sticky left-[180px] z-30 bg-[#1d253b] text-slate-300 font-bold border-r border-slate-700">
                      Activity
                    </TableHead>
                    {dayHeaders.map((day) => (
                      <TableHead key={day} className="text-center text-[10px] p-1 border-r border-slate-700 min-w-[40px] text-slate-400 uppercase">
                        {day.toString().padStart(2, "0")} {months.find(m => m.value === month.padStart(2, "0"))?.label.slice(0, 3)}
                      </TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={daysInMonth + 2} className="h-40 text-center text-slate-500">
                        লোডিং হচ্ছে...
                      </TableCell>
                    </TableRow>
                  ) : reports.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={daysInMonth + 2} className="h-40 text-center text-slate-500">
                        কোনো তথ্য পাওয়া যায়নি।
                      </TableCell>
                    </TableRow>
                  ) : (
                    reports.map((student) => {
                      const activityTypes = [
                        { key: "attendance", label: "Attendance" },
                        { key: "task_1", label: "Task-01" },
                        { key: "task_2", label: "Task-02" },
                        { key: "exam", label: "Exam" },
                        { key: "progress", label: "Progress" },
                      ];

                      return (
                        <React.Fragment key={student.uid}>
                          {activityTypes.map((activity, idx) => (
                            <TableRow key={`${student.uid}-${activity.key}`} className="border-slate-700 hover:bg-[#32325d]/30 transition-colors">
                              {idx === 0 && (
                                <TableCell 
                                  rowSpan={5} 
                                  className="sticky left-0 z-20 bg-[#2e3046] text-[#00f2c3] font-bold border-r border-slate-700 border-b-[3px] border-b-[#1e1e2f]"
                                >
                                  <div className="truncate w-[160px]">{student.name}</div>
                                  <div className="text-[10px] text-slate-400 font-normal">Roll: {student.roll}</div>
                                </TableCell>
                              )}
                              <TableCell 
                                className={`sticky left-[180px] z-20 border-r border-slate-700 text-xs ${
                                  activity.key === "progress" ? "bg-[#1d253b] text-[#00f2c3] font-bold" : "bg-[#27293d] text-slate-400"
                                }`}
                              >
                                {activity.label}
                              </TableCell>
                              {dayHeaders.map((day) => {
                                const dateStr = `${year}-${month.padStart(2, "0")}-${day.toString().padStart(2, "0")}`;
                                const dayData = student.days[dateStr];
                                
                                if (!dayData) return <TableCell key={day} className="text-center text-slate-700">-</TableCell>;

                                if (activity.key === "attendance") {
                                  return (
                                    <TableCell key={day} className="text-center p-0 border-r border-slate-700">
                                      {dayData.attendance === "Yes" ? (
                                        <CheckCircle2 className="h-4 w-4 mx-auto text-[#00f2c3]" />
                                      ) : (
                                        <span className="text-slate-700">-</span>
                                      )}
                                    </TableCell>
                                  );
                                }

                                if (activity.key === "task_1" || activity.key === "task_2") {
                                  const content = activity.key === "task_1" ? dayData.task_1 : dayData.task_2;
                                  return (
                                    <TableCell key={day} className="text-center p-0 border-r border-slate-700">
                                      {content ? (
                                        <Button 
                                          variant="ghost" 
                                          size="icon" 
                                          className="h-6 w-6 text-blue-400 hover:text-blue-300 hover:bg-transparent"
                                          onClick={() => setSelectedDetail({
                                            title: `${activity.label} - ${dateStr}`,
                                            content: content
                                          })}
                                        >
                                          <FileText className="h-4 w-4" />
                                        </Button>
                                      ) : (
                                        <span className="text-slate-700">-</span>
                                      )}
                                    </TableCell>
                                  );
                                }

                                if (activity.key === "exam") {
                                  const hasExams = dayData.exams && dayData.exams.length > 0;
                                  return (
                                    <TableCell key={day} className="text-center p-0 border-r border-slate-700">
                                      {hasExams ? (
                                        <Button 
                                          variant="ghost" 
                                          size="icon" 
                                          className="h-6 w-6 text-[#00f2c3] hover:text-[#00f2c3]/80 hover:bg-transparent"
                                          onClick={() => {
                                            const items = dayData.exams.map((link, i) => ({
                                              label: `Exam ${i+1}${dayData.marks[i] ? ` (Marks: ${dayData.marks[i]})` : ''}`,
                                              value: link
                                            }));
                                            setSelectedDetail({
                                              title: `Exam Details - ${dateStr}`,
                                              content: "",
                                              items
                                            });
                                          }}
                                        >
                                          <CheckCircle2 className="h-4 w-4" />
                                        </Button>
                                      ) : (
                                        <span className="text-slate-700">-</span>
                                      )}
                                    </TableCell>
                                  );
                                }

                                if (activity.key === "progress") {
                                  return (
                                    <TableCell key={day} className={`text-center p-0 text-[10px] font-bold border-r border-slate-700 ${getProgressColor(dayData.progress)}`}>
                                      {dayData.progress}%
                                    </TableCell>
                                  );
                                }

                                return <TableCell key={day} className="text-center">-</TableCell>;
                              })}
                            </TableRow>
                          ))}
                          {/* Spacer row */}
                          <TableRow className="h-2 bg-[#1e1e2f] hover:bg-[#1e1e2f] border-none">
                            <TableCell colSpan={daysInMonth + 2}></TableCell>
                          </TableRow>
                        </React.Fragment>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Detail Dialog */}
      <Dialog open={!!selectedDetail} onOpenChange={(open) => !open && setSelectedDetail(null)}>
        <DialogContent className="bg-[#27293d] text-white border-slate-700">
          <DialogHeader>
            <DialogTitle className="text-[#00f2c3]">{selectedDetail?.title}</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            {selectedDetail?.items ? (
              <div className="space-y-3">
                {selectedDetail.items.map((item, i) => (
                  <div key={i} className="p-3 bg-[#2e3046] rounded-lg space-y-1">
                    <p className="text-[#00f2c3] font-bold text-sm">{item.label}</p>
                    <a 
                      href={item.value} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="text-blue-400 text-xs break-all hover:underline"
                    >
                      {item.value}
                    </a>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-slate-300 whitespace-pre-wrap">{selectedDetail?.content}</p>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Custom Global CSS for Print and Component behavior */}
      <style jsx global>{`
        @media print {
          body { background: white !important; color: black !important; }
          .no-print { display: none !important; }
          header, footer, nav, aside { display: none !important; }
          .main-content { margin: 0 !important; padding: 0 !important; width: 100% !important; }
          .card { border: 1px solid #ccc !important; box-shadow: none !important; }
          .bg-[#1e1e2f] { background: white !important; color: black !important; }
          .bg-[#1d253b] { background: #f0f0f0 !important; color: black !important; }
          .text-white { color: black !important; }
          .text-slate-400 { color: #666 !important; }
          .border-slate-700 { border-color: #ddd !important; }
          table { width: 100% !important; font-size: 8pt !important; border-collapse: collapse !important; }
          th, td { border: 1px solid #ddd !important; padding: 2px !important; color: black !important; }
          .sticky { position: static !important; }
          .bg-green-500 { background-color: #dcfce7 !important; color: #166534 !important; -webkit-print-color-adjust: exact; }
          .bg-pink-500 { background-color: #fce7f3 !important; color: #9d174d !important; -webkit-print-color-adjust: exact; }
          .bg-slate-700 { background-color: #f3f4f6 !important; color: #374151 !important; -webkit-print-color-adjust: exact; }
        }
      `}</style>
    </div>
  );
}