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
    <div className="space-y-8 pb-20 animate-in fade-in duration-700">
      <PageHeader
        title="মাসিক রিপোর্টস"
        description="ছাত্রদের দৈনিক উপস্থিতি এবং টাস্ক প্রগ্রেস ট্র্যাক করুন।"
      />

      {/* Filters - Glassmorphism Card */}
      <Card className="bg-card/40 backdrop-blur-xl border-white/5 shadow-2xl overflow-hidden relative group">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary via-indigo-500 to-primary/50 opacity-50" />
        <CardContent className="pt-8">
          <div className="flex flex-wrap items-end gap-6">
            <div className="space-y-3">
              <label className="text-xs font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                <Calendar className="h-3.5 w-3.5 text-primary" /> মাস
              </label>
              <Select value={month} onValueChange={setMonth}>
                <SelectTrigger className="w-[160px] bg-black/20 border-white/10 h-11 transition-all focus:ring-primary/20">
                  <SelectValue placeholder="মাস নির্বাচন করুন" />
                </SelectTrigger>
                <SelectContent className="bg-slate-900 border-white/10 text-slate-200">
                  {months.map((m) => (
                    <SelectItem key={m.value} value={m.value}>
                      {m.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-3">
              <label className="text-xs font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                <Calendar className="h-3.5 w-3.5 text-indigo-400" /> বছর
              </label>
              <Select value={year} onValueChange={setYear}>
                <SelectTrigger className="w-[130px] bg-black/20 border-white/10 h-11 transition-all focus:ring-primary/20">
                  <SelectValue placeholder="বছর নির্বাচন করুন" />
                </SelectTrigger>
                <SelectContent className="bg-slate-900 border-white/10 text-slate-200">
                  {years.map((y) => (
                    <SelectItem key={y.value} value={y.value}>
                      {y.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-3">
              <label className="text-xs font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                <Filter className="h-3.5 w-3.5 text-emerald-400" /> ব্যাচ
              </label>
              <Select value={batchId} onValueChange={setBatchId}>
                <SelectTrigger className="w-[220px] bg-black/20 border-white/10 h-11 transition-all focus:ring-primary/20">
                  <SelectValue placeholder="ব্যাচ নির্বাচন করুন" />
                </SelectTrigger>
                <SelectContent className="bg-slate-900 border-white/10 text-slate-200">
                  <SelectItem value="all">সকল ব্যাচ</SelectItem>
                  {batches.map((b) => (
                    <SelectItem key={b.id} value={b.id}>
                      {b.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Button 
              onClick={fetchReports} 
              disabled={loading} 
              className="gap-2 h-11 px-8 font-bold bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20 transition-all hover:scale-105 active:scale-95"
            >
              <Search className="h-4 w-4" /> রিপোর্ট লোড করুন
            </Button>

            <Button 
              variant="outline" 
              onClick={() => window.print()} 
              className="gap-2 h-11 px-6 border-white/10 bg-white/5 hover:bg-white/10 ml-auto transition-all"
            >
              <Download className="h-4 w-4" /> PDF এক্সপোর্ট
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Report Table - High End Dark Style */}
      <Card className="overflow-hidden border-white/5 shadow-[0_20px_50px_rgba(0,0,0,0.5)] bg-[#0f111a] text-slate-200 ring-1 ring-white/5">
        <CardHeader className="bg-[#161926] border-b border-white/5 py-6 px-8">
          <CardTitle className="text-xl font-black tracking-tight flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-2.5 rounded-xl bg-primary/10 text-primary border border-primary/20">
                <Calendar className="h-6 w-6" />
              </div>
              <span>মাসিক রিপোর্ট: <span className="text-primary">{months.find(m => m.value === month.padStart(2, "0"))?.label} {year}</span></span>
            </div>
            <div className="flex items-center gap-3">
              <Badge variant="outline" className="bg-white/5 border-white/10 text-slate-400 font-bold px-3 py-1">
                STUDENTS: {reports.length}
              </Badge>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <ScrollArea className="w-full">
            <div className="min-w-[1400px]">
              <Table className="border-collapse">
                <TableHeader>
                  <TableRow className="bg-[#1c2033] hover:bg-[#1c2033] border-white/5">
                    <TableHead className="w-[200px] sticky left-0 z-30 bg-[#1c2033] text-primary font-black uppercase tracking-tighter text-[11px] border-r border-white/5 shadow-[5px_0_15px_rgba(0,0,0,0.3)]">
                      User Identity
                    </TableHead>
                    <TableHead className="w-[130px] sticky left-[200px] z-30 bg-[#1c2033] text-slate-400 font-bold uppercase tracking-tighter text-[10px] border-r border-white/5 shadow-[5px_0_15px_rgba(0,0,0,0.2)]">
                      Metric
                    </TableHead>
                    {dayHeaders.map((day) => (
                      <TableHead key={day} className="text-center text-[9px] p-2 border-r border-white/5 min-w-[45px] text-slate-500 font-black uppercase tracking-widest">
                        {day.toString().padStart(2, "0")}<br/>
                        <span className="text-primary/50">{months.find(m => m.value === month.padStart(2, "0"))?.label.slice(0, 3)}</span>
                      </TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={daysInMonth + 2} className="h-64 text-center">
                        <div className="flex flex-col items-center justify-center gap-4 opacity-50">
                          <div className="w-10 h-10 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                          <p className="font-black uppercase tracking-widest text-xs">Generating Report Grid...</p>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : reports.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={daysInMonth + 2} className="h-64 text-center opacity-40">
                         <Search className="h-12 w-12 mx-auto mb-4" />
                         <p className="font-bold">No Data Found for Selection</p>
                      </TableCell>
                    </TableRow>
                  ) : (
                    reports.map((student) => {
                      const activityTypes = [
                        { key: "attendance", label: "ATTENDANCE" },
                        { key: "task_1", label: "TASK-01" },
                        { key: "task_2", label: "TASK-02" },
                        { key: "exam", label: "EXAM DATA" },
                        { key: "progress", label: "STABILITY" },
                      ];

                      return (
                        <React.Fragment key={student.uid}>
                          {activityTypes.map((activity, idx) => (
                            <TableRow key={`${student.uid}-${activity.key}`} className="border-white/5 hover:bg-white/[0.02] transition-colors group/row">
                              {idx === 0 && (
                                <TableCell 
                                  rowSpan={5} 
                                  className="sticky left-0 z-20 bg-[#161926] text-emerald-400 font-black border-r border-white/10 shadow-[5px_0_15px_rgba(0,0,0,0.3)] align-top pt-6"
                                >
                                  <div className="truncate w-[170px] text-sm tracking-tight mb-1">{student.name}</div>
                                  <div className="flex items-center gap-2">
                                    <div className="px-1.5 py-0.5 rounded bg-emerald-500/10 text-[9px] text-emerald-500/80 border border-emerald-500/20">
                                      ROLL: {student.roll}
                                    </div>
                                  </div>
                                </TableCell>
                              )}
                              <TableCell 
                                className={`sticky left-[200px] z-20 border-r border-white/5 text-[9px] font-black tracking-widest px-4 ${
                                  activity.key === "progress" ? "bg-[#1c2033] text-primary" : "bg-[#111421] text-slate-500"
                                } shadow-[5px_0_10px_rgba(0,0,0,0.2)]`}
                              >
                                {activity.label}
                              </TableCell>
                              {dayHeaders.map((day) => {
                                const dateStr = `${year}-${month.padStart(2, "0")}-${day.toString().padStart(2, "0")}`;
                                const dayData = student.days[dateStr];
                                
                                if (!dayData) return <TableCell key={day} className="text-center text-slate-800 font-bold border-r border-white/5 opacity-20">-</TableCell>;

                                if (activity.key === "attendance") {
                                  return (
                                    <TableCell key={day} className="text-center p-0 border-r border-white/5">
                                      {dayData.attendance === "Yes" ? (
                                        <div className="h-full w-full flex items-center justify-center py-2 bg-emerald-500/5">
                                           <CheckCircle2 className="h-4 w-4 text-emerald-400 drop-shadow-[0_0_8px_rgba(52,211,153,0.5)]" />
                                        </div>
                                      ) : (
                                        <span className="text-slate-800 font-bold opacity-30">-</span>
                                      )}
                                    </TableCell>
                                  );
                                }

                                if (activity.key === "task_1" || activity.key === "task_2") {
                                  const content = activity.key === "task_1" ? dayData.task_1 : dayData.task_2;
                                  return (
                                    <TableCell key={day} className={`text-center p-0 border-r border-white/5 ${content ? 'bg-indigo-500/5' : ''}`}>
                                      {content ? (
                                        <Button 
                                          variant="ghost" 
                                          size="icon" 
                                          className="h-9 w-full rounded-none text-indigo-400 hover:text-white hover:bg-indigo-500/20 transition-all"
                                          onClick={() => setSelectedDetail({
                                            title: `${activity.label} - ${dateStr}`,
                                            content: content
                                          })}
                                        >
                                          <FileText className="h-4 w-4" />
                                        </Button>
                                      ) : (
                                        <span className="text-slate-800 font-bold opacity-30">-</span>
                                      )}
                                    </TableCell>
                                  );
                                }

                                if (activity.key === "exam") {
                                  const hasExams = dayData.exams && dayData.exams.length > 0;
                                  return (
                                    <TableCell key={day} className={`text-center p-0 border-r border-white/5 ${hasExams ? 'bg-primary/5' : ''}`}>
                                      {hasExams ? (
                                        <Button 
                                          variant="ghost" 
                                          size="icon" 
                                          className="h-9 w-full rounded-none text-primary hover:text-white hover:bg-primary/20 transition-all"
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
                                        <span className="text-slate-800 font-bold opacity-30">-</span>
                                      )}
                                    </TableCell>
                                  );
                                }

                                if (activity.key === "progress") {
                                  const pColor = dayData.progress >= 100 ? 'bg-emerald-500/40 text-emerald-300' : 
                                                 dayData.progress > 0 ? 'bg-amber-500/40 text-amber-300' : 'bg-slate-800/50 text-slate-600';
                                  return (
                                    <TableCell key={day} className={`text-center p-0 border-r border-white/5`}>
                                      <div className={`h-9 w-full flex items-center justify-center text-[8px] font-black ${pColor} transition-all`}>
                                        {dayData.progress}%
                                      </div>
                                    </TableCell>
                                  );
                                }

                                return <TableCell key={day} className="text-center">-</TableCell>;
                              })}
                            </TableRow>
                          ))}
                          {/* Modern Separator row */}
                          <TableRow className="h-3 bg-[#0a0c14] hover:bg-[#0a0c14] border-none">
                            <TableCell colSpan={daysInMonth + 2} className="p-0">
                               <div className="h-px w-full bg-gradient-to-r from-transparent via-white/5 to-transparent" />
                            </TableCell>
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

      {/* Modern Dialog - Styled for Dark Theme */}
      <Dialog open={!!selectedDetail} onOpenChange={(open) => !open && setSelectedDetail(null)}>
        <DialogContent className="bg-[#161926] text-slate-200 border-white/10 shadow-[0_0_100px_rgba(0,0,0,0.8)] sm:max-w-lg">
          <DialogHeader className="border-b border-white/5 pb-4">
            <DialogTitle className="text-primary font-black tracking-tight flex items-center gap-3">
               <div className="p-1.5 rounded-lg bg-primary/10 text-primary">
                 <FileText className="h-5 w-5" />
               </div>
               {selectedDetail?.title}
            </DialogTitle>
          </DialogHeader>
          <div className="py-6">
            {selectedDetail?.items ? (
              <div className="space-y-4">
                {selectedDetail.items.map((item, i) => (
                  <div key={i} className="p-4 bg-black/40 rounded-xl border border-white/5 group hover:border-primary/30 transition-all">
                    <p className="text-primary font-black text-[10px] uppercase tracking-widest mb-2 opacity-70">{item.label}</p>
                    <a 
                      href={item.value} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="text-blue-400 text-sm break-all hover:text-blue-300 hover:underline flex items-center gap-2"
                    >
                      <Download className="h-3.5 w-3.5 shrink-0" /> {item.value}
                    </a>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-6 bg-black/40 rounded-xl border border-white/5">
                 <p className="text-slate-300 text-sm leading-relaxed whitespace-pre-wrap selection:bg-primary selection:text-white">
                   {selectedDetail?.content}
                 </p>
              </div>
            )}
          </div>
          <div className="flex justify-end pt-2">
            <Button onClick={() => setSelectedDetail(null)} variant="outline" className="border-white/10 bg-white/5 hover:bg-white/10 h-10 px-8">
              বন্ধ করুন
            </Button>
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