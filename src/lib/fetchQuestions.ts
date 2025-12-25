import { apiRequest } from "@/lib/api";

export interface Question {
  id?: string;
  question: string;
  option1: string;
  option2: string;
  option3: string;
  option4: string;
  option5?: string;
  answer: string;
  explanation?: string;
  type: string;
  file_id?: number;
}

export interface RawQuestion {
  id?: string;
  uid?: string;
  question?: string;
  question_text?: string;
  option1?: string;
  option2?: string;
  option3?: string;
  option4?: string;
  option5?: string;
  answer?: string | number;
  correct?: string;
  explanation?: string;
  subject?: string;
  paper?: string;
  chapter?: string;
  highlight?: string;
  type?: string;
  file_id?: number;
  options?: string[];
  question_image_url?: string;
  explanation_image_url?: string;
  question_marks?: number | string;
  [key: string]: unknown;
}

export async function fetchQuestions(
  fileId?: string | number,
  examId?: string,
): Promise<RawQuestion[]> {
  try {
    const params: Record<string, string> = {};
    if (fileId) {
      params.file_id = String(fileId);
    }
    if (examId) {
      params.exam_id = examId;
    }

    const result = await apiRequest<unknown>("questions", "GET", null, params);

    if (!result) {
       throw new Error("No response from API");
    }

    // Determine the array of raw questions
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let rawData: any[] = [];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const anyResult = result as any;

    if (Array.isArray(result)) {
      rawData = result;
    } else if (anyResult.success && Array.isArray(anyResult.data)) {
        // If apiRequest normalized it (unlikely given current implementation but possible)
        rawData = anyResult.data;
    } else if (anyResult.data && Array.isArray(anyResult.data)) {
        rawData = anyResult.data;
    } else if (anyResult.questions && Array.isArray(anyResult.questions)) {
        rawData = anyResult.questions;
    } else {
        // If result is an error object
        if (anyResult.success === false) {
             throw new Error(anyResult.message || "Failed to fetch questions");
        }
        // Fallback: maybe empty or unexpected format
        console.warn("Unexpected API response format in fetchQuestions", result);
        rawData = [];
    }

    // Transform the data
    const transformed: RawQuestion[] = rawData.map(normalizeQuestion);

    return transformed;
  } catch (error) {
    // Bubble up a useful error for callers
    if (error instanceof Error) throw error;
    throw new Error(String(error));
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function normalizeQuestion(q: any): RawQuestion {
  // Normalize answer index
  let answerIndex = -1;
  const answerString = (q.answer || q.correct || "").toString().trim();

  if (/^\d+$/.test(answerString)) {
    const num = parseInt(answerString, 10);
    // Logic to determine if 0-based or 1-based:
    // This is tricky without knowing the source convention exactly.
    // However, existing logic in SolvePage assumed:
    // if num > 0 -> num - 1 (1-based)
    // else -> num (0-based)
    // But in `fetchQuestions` original code it was just `q.answer`.
    // Let's try to be smart or stick to a convention.
    // Most likely: backend sends 0-based index if it's an integer column.
    // If it's legacy CSV import, it might be 1-based.
    // For safety, let's keep the raw value in `answer` if we aren't sure,
    // OR replicate the SolvePage logic which seems more robust for display.
    
    // Actually, to keep `RawQuestion` raw, we shouldn't change the value too much,
    // but `SolvePage` expects `answer` to be the *correct index number*.
    // The previous `fetchQuestions` implementation just passed `q.answer`.
    
    // Let's implement a consistent parsing strategy here that returns the CORRECT 0-BASED INDEX.
    // Assuming: 1, 2, 3, 4 -> 0, 1, 2, 3
    // Assuming: 0, 1, 2, 3 -> 0, 1, 2, 3 (Ambiguity at 0? No, usually 0 is 'A' in 0-based)
    // If we receive "1", is it A or B?
    // In many systems: A=1. In programming: A=0.
    // Let's look at `SolvePage` logic again:
    // if (num > 0) answerIndex = num - 1; else answerIndex = num;
    // This means "1" becomes 0 (A), "0" becomes 0 (A). "2" becomes 1 (B).
    // This implies 0 and 1 are both treated as A.
    
    if (num > 0) {
      answerIndex = num - 1;
    } else {
      answerIndex = num;
    }
  } else if (answerString.length === 1 && /[a-zA-Z]/.test(answerString)) {
    answerIndex = answerString.toUpperCase().charCodeAt(0) - 65;
  }
  
  // Normalize options
  const options = (
    q.options && Array.isArray(q.options) && q.options.length > 0
      ? q.options
      : [q.option1, q.option2, q.option3, q.option4, q.option5]
  ).filter((o: unknown) => o && typeof o === 'string' && o.trim() !== "");

  return {
    id: String(q.id || Math.random().toString(36).substr(2, 9)),
    file_id: q.file_id,
    question: q.question_text || q.question || "",
    question_text: q.question_text || q.question || "",
    options: options,
    option1: q.option1,
    option2: q.option2,
    option3: q.option3,
    option4: q.option4,
    option5: q.option5,
    correct: q.answer, 
    answer: answerIndex !== -1 ? answerIndex : q.answer, // Prefer parsed index
    explanation: q.explanation || "",
    type: q.type,
    question_image: q.question_image,
    explanation_image: q.explanation_image,
    question_image_url: q.question_image_url,
    explanation_image_url: q.explanation_image_url,
    question_marks: q.question_marks,
    subject: q.subject,
    paper: q.paper,
    chapter: q.chapter,
    highlight: q.highlight,
    order_index: q.order_index,
    created_at: q.created_at,
  };
}
