import { NextRequest, NextResponse } from "next/server";
import { apiRequest } from "@/lib/api";

export const runtime = "edge";

interface ExamData {
  name: string;
  duration_minutes: number;
  negative_marks_per_wrong: number;
  created_at: string;
}

interface ResultData {
  student_roll: string;
  student_name: string;
  correct_answers: string;
  wrong_answers: string;
  unattempted: number;
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
    const resultsResult = await apiRequest<ResultData[]>("results", "GET", null, {
      exam_id: examId,
    });

    if (!resultsResult.success || !resultsResult.data) {
      return NextResponse.json(
        { error: "Failed to fetch results" },
        { status: 500 },
      );
    }
    const results = resultsResult.data;

    const processedResults = (results || []).map((result) => ({
      ...result,
      student_id: { name: result.student_name, roll: result.student_roll },
      score:
        parseFloat(result.correct_answers) -
        parseFloat(result.wrong_answers) *
          (exam.negative_marks_per_wrong || 0),
    }));

    // Calculate statistics
    const totalStudents = processedResults?.length || 0;
    const avgScore =
      totalStudents > 0
        ? (processedResults?.reduce((sum, r) => sum + (r.score || 0), 0) || 0) /
          totalStudents
        : 0;
    const maxScore = Math.max(
      ...(processedResults?.map((r) => r.score || 0) || [0]),
    );
    const minScore = Math.min(
      ...(processedResults?.map((r) => r.score || 0) || [0]),
    );

    // Generate HTML
    const htmlContent = `
<!DOCTYPE html>
<html lang="bn">
<head>
    <meta charset="UTF-8">
    <title>${exam.name} - ফলাফল</title>
    <link href="https://fonts.googleapis.com/css2?family=Hind+Siliguri:wght@300;400;500;600;700&display=swap" rel="stylesheet">
    <style>
        body { 
          font-family: 'Hind Siliguri', sans-serif; 
          line-height: 1.6;
          position: relative;
        }
        .watermark {
          position: fixed;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          z-index: -1;
          opacity: 0.05;
          width: 60%;
        }
        .container {
          padding: 20px;
        }
        @media print {
          body {
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
        }
        h1 { text-align: center; color: #333; margin-bottom: 5px; }
        .subtitle { text-align: center; color: #666; font-size: 12px; margin-bottom: 20px; }
        hr { margin: 20px 0; border: 1px solid #ddd; }
        .section { margin-bottom: 20px; }
        .section-title { font-size: 14px; font-weight: bold; margin-bottom: 10px; color: #333; }
        .details-grid { display: grid; grid-template-columns: auto 1fr; gap: 6px 16px; font-size: 12px; }
        .details-grid span { color: #555; }
        .details-grid strong { font-weight: bold; }
        .stats { display: grid; grid-template-columns: 1fr 1fr 1fr 1fr; gap: 10px; margin-bottom: 20px; }
        .stat-box { padding: 10px; border: 1px solid #ddd; text-align: center; }
        .stat-value { font-size: 18px; font-weight: bold; color: #007bff; }
        .stat-label { font-size: 11px; color: #666; margin-top: 5px; }
        table { width: 100%; border-collapse: collapse; font-size: 12px; }
        th { background-color: #f0f0f0; padding: 8px; text-align: left; font-weight: bold; border-bottom: 2px solid #333; }
        td { padding: 8px; border-bottom: 1px solid #ddd; }
        tr:nth-child(even) { background-color: #f9f9f9; }
        .footer { text-align: center; font-size: 10px; color: #999; margin-top: 30px; }
    </style>
</head>
<body>
    <div class="watermark">
      <img src="/icon.png" alt="watermark" style="width: 100%; height: auto;" />
    </div>
    <div class="container">
      <h1>পরীক্ষা ফলাফল রিপোর্ট</h1>
      <div class="subtitle">Exam Result Report</div>
      <hr>

      <div class="section">
          <div class="section-title">পরীক্ষার বিবরণ</div>
          <div class="details-grid">
              <span>নাম / Name:</span>
              <strong>${exam.name}</strong>
              
              <span>সময়:</span>
              <strong>${exam.duration_minutes} মিনিট</strong>
              
              <span>নেগেটিভ মার্ক:</span>
              <strong>${exam.negative_marks_per_wrong}</strong>

              <span>তৈরির তারিখ:</span>
              <strong>${new Date(exam.created_at).toLocaleDateString("bn-BD", { timeZone: "Asia/Dhaka" })}</strong>
          </div>
      </div>

      <div class="section">
          <div class="section-title">সংক্ষিপ্ত পরিসংখ্যান</div>
          <div class="stats">
              <div class="stat-box">
                  <div class="stat-value">${totalStudents}</div>
                  <div class="stat-label">মোট শিক্ষার্থী</div>
              </div>
              <div class="stat-box">
                  <div class="stat-value">${avgScore.toFixed(2)}</div>
                  <div class="stat-label">গড় স্কোর</div>
              </div>
              <div class="stat-box">
                  <div class="stat-value">${maxScore}</div>
                  <div class="stat-label">সর্বোচ্চ স্কোর</div>
              </div>
              <div class="stat-box">
                  <div class="stat-value">${minScore}</div>
                  <div class="stat-label">সর্বনিম্ন স্কোর</div>
              </div>
          </div>
      </div>

      <div class="section">
          <div class="section-title">শিক্ষার্থীর বিস্তারিত ফলাফল</div>
          <table>
              <thead>
                  <tr>
                      <th>ক্র.স.</th>
                      <th>রোল</th>
                      <th>নাম</th>
                      <th>স্কোর</th>
                      <th>সঠিক</th>
                      <th>ভুল</th>
                      <th>উত্তর না দেওয়া</th>
                  </tr>
              </thead>
              <tbody>
                  ${(processedResults || [])
                    .map(
                      (r, idx) => `
                      <tr>
                          <td>${idx + 1}</td>
                          <td>${r.student_id.roll || "N/A"}</td>
                          <td>${r.student_id.name || "N/A"}</td>
                          <td><strong>${r.score?.toFixed(2) || 0}</strong></td>
                          <td>${r.correct_answers || 0}</td>
                          <td>${r.wrong_answers || 0}</td>
                          <td>${r.unattempted || 0}</td>
                      </tr>
                  `,
                    )
                    .join("")}
              </tbody>
          </table>
      </div>

      <div class="footer">
          <p style="font-weight: bold; font-size: 12px;">&copy; Examify</p>
          <p>Generated on: ${new Date().toLocaleString("bn-BD", { timeZone: "Asia/Dhaka" })}</p>
      </div>
    </div>
</body>
</html>
    `;

    // Return HTML for browser to handle printing/PDF generation
    return new NextResponse(htmlContent, {
      headers: {
        "Content-Type": "text/html; charset=utf-8",
      },
    });
  } catch (error) {
    console.error("Error:", error);
    return NextResponse.json(
      { error: "Failed to generate results" },
      { status: 500 },
    );
  }
}
