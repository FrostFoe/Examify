import { NextRequest, NextResponse } from "next/server";
import { apiRequest } from "@/lib/api";

export const runtime = "edge";

interface ExamData {
  name: string;
  duration_minutes: number;
  negative_marks_per_wrong: number;
}

interface ResultData {
  student_roll: string;
  student_name: string;
  correct_answers: string;
  wrong_answers: string;
  unattempted: number;
  submitted_at: string;
}

export async function POST(request: NextRequest) {
  try {
    const { examId } = await request.json();

    if (!examId) {
      return NextResponse.json({ error: "Exam ID required" }, { status: 400 });
    }

    // Fetch exam details
    const examResult = await apiRequest<ExamData>("exams", "GET", null, {
      id: examId,
    });

    if (!examResult.success || !examResult.data) {
      return NextResponse.json({ error: "Exam not found" }, { status: 404 });
    }
    const exam = examResult.data;

    // Fetch all student results for this exam
    const resultsResult = await apiRequest<ResultData[]>(
      "results",
      "GET",
      null,
      {
        exam_id: examId,
      },
    );

    if (!resultsResult.success || !resultsResult.data) {
      return NextResponse.json(
        { error: "Failed to fetch results" },
        { status: 500 },
      );
    }
    const results = resultsResult.data;

    // Create CSV content
    const headers = [
      "ক্র.স.",
      "রোল",
      "নাম",
      "স্কোর",
      "সঠিক",
      "ভুল",
      "উত্তর না দেওয়া",
      "জমা দেওয়ার সময়",
    ];

    const rows: string[] = [];

    // Add summary info as comments
    rows.push(`# পরীক্ষা: ${exam.name}`);
    rows.push(`# সময়: ${exam.duration_minutes} মিনিট`);
    rows.push(`# নেগেটিভ মার্ক: ${exam.negative_marks_per_wrong}`);
    rows.push(`# মোট শিক্ষার্থী: ${results?.length || 0}`);
    rows.push("");

    // Add CSV headers
    rows.push(headers.map((h) => `"${h}"`).join(","));

    // Add data rows
    (results || []).forEach((result, idx) => {
      const finalScore =
        parseFloat(result.correct_answers) -
        parseFloat(result.wrong_answers) * (exam.negative_marks_per_wrong || 0);
      const row = [
        idx + 1,
        `"${result.student_roll || "N/A"}"`,
        `"${result.student_name || "N/A"}"`,
        finalScore.toFixed(2),
        result.correct_answers || 0,
        result.wrong_answers || 0,
        result.unattempted || 0,
        `"${new Date(result.submitted_at).toLocaleString("bn-BD", { timeZone: "Asia/Dhaka" })}"`,
      ];
      rows.push(row.join(","));
    });

    const csv = rows.join("\n");

    // Return CSV as downloadable file
    const filename = `${exam.name.replace(/\s+/g, "_")}_results_${Date.now()}.csv`;
    const encoder = new TextEncoder();
    return new NextResponse(encoder.encode(csv), {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    console.error("CSV export error:", error);
    return NextResponse.json(
      { error: "Failed to export CSV" },
      { status: 500 },
    );
  }
}
