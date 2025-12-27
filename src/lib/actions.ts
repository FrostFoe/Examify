"use server";

import { revalidatePath } from "next/cache";
import { apiRequest } from "./api";
import { User, Batch, Exam } from "./types";

// Helper function to verify password internally
async function verifyPasswordInternal(adminUid: string, password: string) {
  if (!adminUid || !password) return false;
  try {
    const result = await apiRequest<{ success: boolean }>(
      "auth",
      "POST",
      {
        uid: adminUid,
        password: password,
      },
      { action: "verify-admin-password" },
    );
    return result.success;
  } catch {
    return false;
  }
}

export async function createUser(formData: FormData) {
  const name = formData.get("name") as string;
  const roll = formData.get("roll") as string;
  const batch_id = formData.get("batch_id") as string | null;
  const passwordMode = formData.get("passwordMode") as "auto" | "manual";
  const manualPassword = formData.get("pass") as string;

  // 1. Generate password based on mode
  let newPassword = manualPassword;
  if (passwordMode === "auto") {
    newPassword = Math.random().toString(36).slice(-8);
  }

  // 2. Insert the new user
  const enrolled_batches = batch_id ? [batch_id] : [];

  const result = await apiRequest<User>(
    "students",
    "POST",
    {
      name,
      roll,
      pass: newPassword,
      enrolled_batches,
    },
    { action: "create" },
  );

  if (!result.success) {
    return {
      success: false,
      message: "Failed to create user: " + result.message,
    };
  }

  revalidatePath("/admin/users");

  // 3. Return user data with the generated password
  return {
    success: true,
    message: "User created successfully",
    data: { ...result.data, pass: newPassword },
  };
}

export async function updateUser(formData: FormData) {
  const uid = formData.get("uid") as string;
  const name = formData.get("name") as string;
  const roll = formData.get("roll") as string;
  const pass = formData.get("pass") as string;

  const result = await apiRequest<User>(
    "students",
    "POST",
    {
      uid,
      name,
      roll,
      pass,
    },
    { action: "update" },
  );

  if (!result.success) {
    return {
      success: false,
      message: "Failed to update user: " + result.message,
    };
  }

  revalidatePath("/admin/users");

  return {
    success: true,
    data: result.data,
  };
}

export async function createBatch(formData: FormData) {
  const name = formData.get("name") as string;
  const description = formData.get("description") as string;
  const icon_url = formData.get("icon_url") as string;
  const status = formData.get("status") as "live" | "end";
  const is_public = formData.get("is_public") === "true";

  const result = await apiRequest<Batch>(
    "batches",
    "POST",
    {
      name,
      description,
      icon_url,
      status,
      is_public,
    },
    { action: "create" },
  );

  if (!result.success) {
    return {
      success: false,
      message: "Failed to create batch: " + result.message,
    };
  }

  revalidatePath("/admin/batches");

  return {
    success: true,
    message: "Batch created successfully",
    data: result.data,
  };
}

export async function updateBatch(formData: FormData) {
  const id = formData.get("id") as string;
  const name = formData.get("name") as string;
  const description = formData.get("description") as string;
  const is_public = formData.get("is_public_hidden") === "true";
  const icon_url = formData.get("icon_url") as string;

  const result = await apiRequest<Batch>(
    "batches",
    "POST",
    {
      id,
      name,
      description,
      is_public,
      icon_url,
    },
    { action: "update" },
  );

  if (!result.success) {
    return {
      success: false,
      message: "Failed to update batch: " + result.message,
    };
  }

  revalidatePath("/admin/batches");
  revalidatePath(`/admin/batches/${id}`);

  return {
    success: true,
    message: "Batch updated successfully",
    data: result.data,
  };
}

export async function deleteBatch(formData: FormData) {
  const id = formData.get("id") as string;
  const password = formData.get("password") as string;
  const admin_uid = formData.get("admin_uid") as string;

  if (!(await verifyPasswordInternal(admin_uid, password))) {
    return { success: false, message: "Invalid password or unauthorized" };
  }

  const result = await apiRequest(
    "batches",
    "POST",
    { id },
    { action: "delete" },
  );

  if (!result.success) {
    return {
      success: false,
      message: "Failed to delete batch: " + result.message,
    };
  }

  revalidatePath("/admin/batches");

  return {
    success: true,
    message: "Batch deleted successfully",
  };
}

export async function createExam(formData: FormData) {
  const name = formData.get("name") as string;
  const description = formData.get("description") as string;
  const course_name = formData.get("course_name") as string;
  const batch_id_raw = formData.get("batch_id") as string | null;
  const batch_id = batch_id_raw === "public" ? null : batch_id_raw;
  const durationRaw = formData.get("duration_minutes") as string;
  const duration_minutes = durationRaw ? parseInt(durationRaw, 10) : null;
  const marks_per_question = parseFloat(
    formData.get("marks_per_question") as string,
  );
  const negative_marks_per_wrong = parseFloat(
    formData.get("negative_marks_per_wrong") as string,
  );
  const file_id = formData.get("file_id") as string;
  const is_practice = formData.get("is_practice") === "true";
  const shuffle_questions = formData.get("shuffle_questions") === "true";
  let start_at = formData.get("start_at") as string | null;
  let end_at = formData.get("end_at") as string | null;

  if (is_practice) {
    start_at = null;
    end_at = null;
  }

  const total_subjects = formData.get("total_subjects")
    ? parseInt(formData.get("total_subjects") as string)
    : null;

  let mandatory_subjects = [];
  try {
    const raw = formData.get("mandatory_subjects") as string;
    mandatory_subjects = raw ? JSON.parse(raw) : [];
  } catch {
    mandatory_subjects = [];
  }

  let optional_subjects = [];
  try {
    const raw = formData.get("optional_subjects") as string;
    optional_subjects = raw ? JSON.parse(raw) : [];
  } catch {
    optional_subjects = [];
  }

  let question_ids = [];
  try {
    const raw = formData.get("question_ids") as string;
    question_ids = raw ? JSON.parse(raw) : [];
  } catch {
    question_ids = [];
  }

  const result = await apiRequest(
    "exams",
    "POST",
    {
      id: crypto.randomUUID(),
      name,
      description,
      course_name,
      batch_id,
      duration_minutes,
      marks_per_question,
      negative_marks_per_wrong,
      file_id,
      is_practice,
      shuffle_questions,
      start_at,
      end_at,
      total_subjects,
      mandatory_subjects,
      optional_subjects,
      question_ids,
    },
    { action: "create" },
  );

  if (!result.success) {
    return {
      success: false,
      message: "Failed to create exam: " + result.message,
    };
  }

  if (batch_id) {
    revalidatePath(`/admin/batches/${batch_id}`);
  } else {
    revalidatePath("/admin/exams");
  }

  return {
    success: true,
    message: "Exam created successfully",
    data: result.data,
  };
}

export async function deleteExam(formData: FormData) {
  const id = formData.get("id") as string;
  const batch_id = formData.get("batch_id") as string | null;
  const password = formData.get("password") as string;
  const admin_uid = formData.get("admin_uid") as string;

  if (!(await verifyPasswordInternal(admin_uid, password))) {
    return { success: false, message: "Invalid password or unauthorized" };
  }

  const result = await apiRequest(
    "exams",
    "POST",
    { id },
    { action: "delete" },
  );

  if (!result.success) {
    return {
      success: false,
      message: "Failed to delete exam: " + result.message,
    };
  }

  if (batch_id) {
    revalidatePath(`/admin/batches/${batch_id}`);
  } else {
    revalidatePath("/admin/exams");
  }

  return {
    success: true,
    message: "Exam deleted successfully",
  };
}

export async function updateExam(formData: FormData) {
  const id = formData.get("id") as string;
  const batch_id = formData.get("batch_id") as string;
  const name = formData.get("name") as string;
  const description = formData.get("description") as string;
  const course_name = formData.get("course_name") as string;

  const durationRaw = formData.get("duration_minutes") as string;
  const duration_minutes = parseInt(durationRaw, 10);
  const marks_per_question_raw = formData.get("marks_per_question") as string;
  const marks_per_question = marks_per_question_raw
    ? parseFloat(marks_per_question_raw)
    : null;
  const negative_marks_per_wrong = parseFloat(
    formData.get("negative_marks_per_wrong") as string,
  );
  const file_id = formData.get("file_id") as string;
  const is_practice = formData.get("is_practice") === "true";
  const shuffle_questions = formData.get("shuffle_questions") === "true";
  let start_at = formData.get("start_at") as string | null;
  let end_at = formData.get("end_at") as string | null;

  if (is_practice) {
    start_at = null;
    end_at = null;
  }

  const total_subjects_raw = formData.get("total_subjects") as string;
  const total_subjects = total_subjects_raw
    ? parseInt(total_subjects_raw, 10)
    : null;

  // Parse JSON strings from FormData
  let mandatory_subjects = [];
  try {
    const raw = formData.get("mandatory_subjects") as string;
    mandatory_subjects = raw ? JSON.parse(raw) : [];
  } catch {
    mandatory_subjects = [];
  }

  let optional_subjects = [];
  try {
    const raw = formData.get("optional_subjects") as string;
    optional_subjects = raw ? JSON.parse(raw) : [];
  } catch {
    optional_subjects = [];
  }

  let question_ids = null;
  try {
    const raw = formData.get("question_ids") as string | null;
    question_ids = raw ? JSON.parse(raw) : null;
  } catch {
    question_ids = null;
  }

  const result = await apiRequest<Exam>(
    "exams",
    "POST",
    {
      id,
      name,
      description,
      course_name,
      duration_minutes: isNaN(duration_minutes) ? null : duration_minutes,
      marks_per_question,
      negative_marks_per_wrong,
      file_id: file_id || null,
      is_practice: is_practice || false,
      shuffle_questions,
      start_at: start_at,
      end_at: end_at,
      total_subjects,
      mandatory_subjects,
      optional_subjects,
      question_ids,
    },
    { action: "update" },
  );

  if (!result.success) {
    return {
      success: false,
      message: "Failed to update exam: " + result.message,
    };
  }

  const revalidatePathString = `/admin/batches/${String(batch_id)}`;
  revalidatePath(revalidatePathString);
  revalidatePath("/admin/exams");

  return {
    success: true,
    data: result.data,
  };
}

export async function enrollStudent(formData: FormData) {
  const user_id = formData.get("user_id") as string;
  const batch_id = formData.get("batch_id") as string;

  const result = await apiRequest<User>(
    "students",
    "POST",
    {
      uid: user_id,
      batch_id,
    },
    { action: "enroll" },
  );

  if (!result.success) {
    return {
      success: false,
      message: "Failed to enroll student: " + result.message,
    };
  }

  revalidatePath(`/admin/batches/${batch_id}`);

  return {
    success: true,
    data: result.data,
  };
}

export async function removeStudentFromBatch(formData: FormData) {
  const user_id = formData.get("user_id") as string;
  const batch_id = formData.get("batch_id") as string;
  const password = formData.get("password") as string;
  const admin_uid = formData.get("admin_uid") as string;

  if (!(await verifyPasswordInternal(admin_uid, password))) {
    return { success: false, message: "Invalid password or unauthorized" };
  }

  const result = await apiRequest<User>(
    "students",
    "POST",
    {
      uid: user_id,
      batch_id,
    },
    { action: "unenroll" },
  );

  if (!result.success) {
    return {
      success: false,
      message: "Failed to remove student from batch: " + result.message,
    };
  }

  revalidatePath(`/admin/batches/${batch_id}`);

  return {
    success: true,
    data: result.data,
  };
}

export async function deleteUser(formData: FormData) {
  const uid = formData.get("uid") as string;
  // Password verification removed as per request
  // const password = formData.get("password") as string;
  // const admin_uid = formData.get("admin_uid") as string;

  // if (!(await verifyPasswordInternal(admin_uid, password))) {
  //   return { success: false, message: "Invalid password or unauthorized" };
  // }

  const result = await apiRequest(
    "students",
    "POST",
    { uid },
    { action: "delete" },
  );

  if (!result.success) {
    return {
      success: false,
      message: "Failed to delete user: " + result.message,
    };
  }

  revalidatePath("/admin/users");
  return { success: true, message: "User deleted successfully" };
}

export async function deleteStudentExamResult(formData: FormData) {
  const id = formData.get("id") as string;
  const password = formData.get("password") as string;
  const admin_uid = formData.get("admin_uid") as string;
  const exam_id = formData.get("exam_id") as string;

  if (!(await verifyPasswordInternal(admin_uid, password))) {
    return { success: false, message: "Invalid password or unauthorized" };
  }

  const result = await apiRequest(
    "results",
    "POST",
    { id },
    { action: "delete" },
  );

  if (!result.success) {
    return {
      success: false,
      message: "Failed to delete result: " + result.message,
    };
  }

  if (exam_id) {
    revalidatePath(`/admin/exams/${exam_id}/results`);
  }

  return { success: true, message: "Result deleted" };
}

export async function exportUsersData() {
  try {
    const result = await apiRequest<User[]>("students", "GET", null, {
      limit: "1000000",
    });

    if (!result.success || !result.data) {
      return {
        success: false,
        message: "Failed to fetch users data",
      };
    }

    const data = {
      exportedAt: new Date().toISOString(),
      version: "1.0",
      users: result.data,
    };

    return {
      success: true,
      data: JSON.stringify(data, null, 2),
      filename: `users-backup-${new Date().toISOString().split("T")[0]}.json`,
    };
  } catch (error) {
    return {
      success: false,
      message: "Export failed: " + (error as Error).message,
    };
  }
}

export async function importUsersData(formData: FormData) {
  try {
    const jsonFile = formData.get("file") as File;
    const adminPassword = formData.get("adminPassword") as string;
    const adminUid = formData.get("adminUid") as string;

    if (!jsonFile) {
      return { success: false, message: "No file selected" };
    }

    if (!(await verifyPasswordInternal(adminUid, adminPassword))) {
      return { success: false, message: "Invalid password or unauthorized" };
    }

    const fileContent = await jsonFile.text();
    const importedData = JSON.parse(fileContent);

    if (!importedData.users || !Array.isArray(importedData.users)) {
      return { success: false, message: "Invalid file format" };
    }

    let importedCount = 0;
    const errors = [];

    for (const user of importedData.users) {
      try {
        const result = await apiRequest(
          "students",
          "POST",
          {
            uid: user.uid,
            name: user.name,
            roll: user.roll || "",
            pass: user.pass || "",
            enrolled_batches: user.enrolled_batches || [],
          },
          { action: "create" },
        );

        if (result.success) {
          importedCount++;
        } else {
          errors.push(`${user.name} (${user.roll}): ${result.message}`);
        }
      } catch (error) {
        errors.push(`${user.name} (${user.roll}): ${(error as Error).message}`);
      }
    }

    revalidatePath("/admin/users");

    return {
      success: true,
      message: `${importedCount} users imported successfully${errors.length > 0 ? `, ${errors.length} errors` : ""}`,
      importedCount,
      errors,
    };
  } catch (error) {
    return {
      success: false,
      message: "Import failed: " + (error as Error).message,
    };
  }
}

export async function exportBatchData(batchId: string) {
  try {
    // 1. Fetch Batch Details
    const batchResult = await apiRequest<Batch>("batches", "GET", null, {
      id: batchId,
    });
    if (!batchResult.success || !batchResult.data) {
      throw new Error(batchResult.message || "Failed to fetch batch details");
    }
    const batch = batchResult.data;

    // 2. Fetch Enrolled Students
    const studentsResult = await apiRequest<User[]>("students", "GET", null, {
      batch_id: batchId,
      limit: "1000000",
    });
    const students =
      studentsResult.success && studentsResult.data ? studentsResult.data : [];

    // 3. Fetch Exams
    const examsResult = await apiRequest<Exam[]>("exams", "GET", null, {
      batch_id: batchId,
    });
    const examsList =
      examsResult.success && examsResult.data ? examsResult.data : [];

    // 4. Fetch Questions for each Exam
    const examsWithQuestions = await Promise.all(
      examsList.map(async (exam) => {
        const examDetailResult = await apiRequest<Exam>("exams", "GET", null, {
          id: exam.id,
        });
        if (examDetailResult.success && examDetailResult.data) {
          // The API already returns questions in the exam detail
          return examDetailResult.data;
        }
        return exam;
      }),
    );

    const data = {
      exportedAt: new Date().toISOString(),
      version: "1.0",
      batch,
      students,
      exams: examsWithQuestions,
    };

    return {
      success: true,
      data: JSON.stringify(data, null, 2),
      filename: `batch-${batch.name.replace(/[^a-z0-9]/gi, "_").toLowerCase()}-${new Date().toISOString().split("T")[0]}.json`,
    };
  } catch (error) {
    return {
      success: false,
      message: "Export failed: " + (error as Error).message,
    };
  }
}

export async function importBatchData(formData: FormData) {
  try {
    const jsonFile = formData.get("file") as File;
    const adminPassword = formData.get("adminPassword") as string;
    const adminUid = formData.get("adminUid") as string;

    if (!jsonFile) {
      return { success: false, message: "No file selected" };
    }

    if (!(await verifyPasswordInternal(adminUid, adminPassword))) {
      return { success: false, message: "Invalid password or unauthorized" };
    }

    const fileContent = await jsonFile.text();
    const importedData = JSON.parse(fileContent);

    if (!importedData.batch || !importedData.batch.name) {
      return {
        success: false,
        message: "Invalid file format: missing batch data",
      };
    }

    // 1. Create Batch
    const batchData = importedData.batch;
    const newBatchId = crypto.randomUUID();

    const batchResult = await apiRequest<Batch>(
      "batches",
      "POST",
      {
        id: newBatchId,
        name: batchData.name + " (Imported)",
        description: batchData.description,
        icon_url: batchData.icon_url,
        status: batchData.status,
        is_public: batchData.is_public,
      },
      { action: "create" },
    );

    if (!batchResult.success) {
      throw new Error("Failed to create batch: " + batchResult.message);
    }

    const createdBatchId = batchResult.data?.id || newBatchId;

    // 2. Import Students & Enroll
    let studentCount = 0;
    if (importedData.students && Array.isArray(importedData.students)) {
      for (const student of importedData.students) {
        // First, try to fetch the student to see if they exist
        const existingStudentResult = await apiRequest<User>(
          "students",
          "GET",
          null,
          { uid: student.uid },
        );
        if (existingStudentResult.success && existingStudentResult.data) {
          // Student exists, update enrolled_batches
          await apiRequest(
            "students",
            "POST",
            { uid: student.uid, batch_id: createdBatchId },
            { action: "enroll" },
          );
        } else {
          // Create new student
          await apiRequest(
            "students",
            "POST",
            {
              uid: student.uid,
              name: student.name,
              roll: student.roll,
              pass: student.pass,
              enrolled_batches: [createdBatchId],
            },
            { action: "create" },
          );
        }
        studentCount++;
      }
    }

    // 3. Import Exams & Questions
    let examCount = 0;
    if (importedData.exams && Array.isArray(importedData.exams)) {
      for (const exam of importedData.exams) {
        const newExamId = crypto.randomUUID();
        // Create Exam
        const examResult = await apiRequest(
          "exams",
          "POST",
          {
            id: newExamId,
            name: exam.name,
            description: exam.description,
            course_name: exam.course_name,
            batch_id: createdBatchId, // Link to new batch
            duration_minutes: exam.duration_minutes,
            marks_per_question: exam.marks_per_question,
            negative_marks_per_wrong: exam.negative_marks_per_wrong,
            is_practice: exam.is_practice,
            shuffle_questions: exam.shuffle_questions,
            start_at: exam.start_at,
            end_at: exam.end_at,
            total_subjects: exam.total_subjects,
            mandatory_subjects: exam.mandatory_subjects,
            optional_subjects: exam.optional_subjects,
            question_ids: [],
          },
          { action: "create" },
        );

        if (examResult.success) {
          examCount++;
          // Create Questions
          if (exam.questions && Array.isArray(exam.questions)) {
            for (const question of exam.questions) {
              const imageToUse =
                question.question_image &&
                !question.question_image.startsWith("data:") &&
                !question.question_image.startsWith("http")
                  ? question.question_image_url
                  : question.question_image;

              const explanationImageToUse =
                question.explanation_image &&
                !question.explanation_image.startsWith("data:") &&
                !question.explanation_image.startsWith("http")
                  ? question.explanation_image_url
                  : question.explanation_image;

              await apiRequest(
                "create-question",
                "POST",
                {
                  exam_id: newExamId,
                  question_text: question.question_text || question.question,
                  option1:
                    question.option1 ||
                    (Array.isArray(question.options)
                      ? question.options[0]
                      : question.options?.option1),
                  option2:
                    question.option2 ||
                    (Array.isArray(question.options)
                      ? question.options[1]
                      : question.options?.option2),
                  option3:
                    question.option3 ||
                    (Array.isArray(question.options)
                      ? question.options[2]
                      : question.options?.option3),
                  option4:
                    question.option4 ||
                    (Array.isArray(question.options)
                      ? question.options[3]
                      : question.options?.option4),
                  option5:
                    question.option5 ||
                    (Array.isArray(question.options)
                      ? question.options[4]
                      : question.options?.option5),
                  answer: question.answer,
                  explanation: question.explanation,
                  question_image: imageToUse,
                  explanation_image: explanationImageToUse,
                  subject: question.subject,
                  paper: question.paper,
                  chapter: question.chapter,
                  highlight: question.highlight,
                  type: question.type,
                  order_index: question.order_index,
                },
              );
            }
          }
        }
      }
    }

    revalidatePath("/admin/batches");

    return {
      success: true,
      message: `Batch imported successfully. Students: ${studentCount}, Exams: ${examCount}`,
    };
  } catch (error) {
    return {
      success: false,
      message: "Import failed: " + (error as Error).message,
    };
  }
}
