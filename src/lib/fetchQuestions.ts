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
  exam_id?: string,
): Promise<RawQuestion[]> {
  try {
    const params: Record<string, string> = {};
    if (fileId) {
      params.file_id = String(fileId);
    }
    if (exam_id) {
      params.exam_id = exam_id;
    }

    const result = await apiRequest<RawQuestion[]>(
      "questions",
      "GET",
      null,
      params,
    );

    if (!result) {
      throw new Error("No response from API");
    }

    let rawData: RawQuestion[] = [];

    if (result.success && Array.isArray(result.data)) {
      rawData = result.data;
    } else if (Array.isArray(result)) {
      // Fallback for direct array response
      rawData = result as unknown as RawQuestion[];
    } else {
      if (result.success === false) {
        throw new Error(result.message || "Failed to fetch questions");
      }
      console.warn("Unexpected API response format in fetchQuestions", result);
      rawData = [];
    }

    // Transform the data
    const transformed: RawQuestion[] = rawData.map(normalizeQuestion);

    return transformed;
  } catch (error) {
    if (error instanceof Error) throw error;
    throw new Error(String(error));
  }
}

export function normalizeQuestion(q: RawQuestion): RawQuestion {
  // Normalize answer index to 0-based integer
  let answerIndex: number | string = -1;
  const answerString = (q.answer || q.correct || "").toString().trim();

  if (/^\d+$/.test(answerString)) {
    const num = parseInt(answerString, 10);
    // Standardizing: 1-based (1,2,3,4) to 0-based (0,1,2,3)
    // If it's 0, we assume it's already 0-based A.
    if (num > 0) {
      answerIndex = num - 1;
    } else {
      answerIndex = 0; // "0" is A
    }
  } else if (answerString.length === 1 && /[a-zA-Z]/.test(answerString)) {
    // A -> 0, B -> 1, etc.
    answerIndex = answerString.toUpperCase().charCodeAt(0) - 65;
  } else {
    // Fallback to original if we can't parse it
    answerIndex = q.answer || q.correct || "";
  }

  // Normalize options - ensure we have an array
  const options = (
    Array.isArray(q.options) && q.options.length > 0
      ? q.options
      : [q.option1, q.option2, q.option3, q.option4, q.option5]
  ).filter((o): o is string => typeof o === "string" && o.trim() !== "");

  return {
    ...q,
    id: q.id ? String(q.id) : Math.random().toString(36).substring(2, 11),
    question: q.question_text || q.question || "",
    question_text: q.question_text || q.question || "",
    options: options,
    correct: String(q.answer || q.correct || ""),
    answer: answerIndex,
    explanation: q.explanation || "",
  };
}
