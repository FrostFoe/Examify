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

  // 1. Generate a random 8-digit password
  const newPassword = Math.random().toString(36).slice(-8);

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

    const total_subjects = formData.get("total_subjects") ? parseInt(formData.get("total_subjects") as string) : null;
    const mandatory_subjects = JSON.parse((formData.get("mandatory_subjects") as string) || "[]");
    const optional_subjects = JSON.parse((formData.get("optional_subjects") as string) || "[]");
    const question_ids = JSON.parse((formData.get("question_ids") as string) || "[]");

    const result = await apiRequest("exams", "POST", {
      id: uuidv4(),
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
    }, { action: 'create' });

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
  const mandatory_subjects = formData.getAll("mandatory_subjects") as string[];
  const optional_subjects = formData.getAll("optional_subjects") as string[];
  const question_ids_raw = formData.get("question_ids") as string | null;
  const question_ids = question_ids_raw ? JSON.parse(question_ids_raw) : null;

  const result = await apiRequest<Exam>(
    "exams",
    "POST",
    {
      id,
      name,
      duration_minutes: isNaN(duration_minutes) ? null : duration_minutes,
      marks_per_question,
      negative_marks_per_wrong,
      file_id: file_id || null,
      is_practice: is_practice || false,
      shuffle_questions,
      start_at: start_at,
      end_at: end_at,
      total_subjects,
      mandatory_subjects:
        mandatory_subjects.length > 0 ? mandatory_subjects : [],
      optional_subjects: optional_subjects.length > 0 ? optional_subjects : [],
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

  const revalidatePathString = `/admin/batches/${batch_id}`;
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
  const password = formData.get("password") as string;
  const admin_uid = formData.get("admin_uid") as string;

  if (!(await verifyPasswordInternal(admin_uid, password))) {
    return { success: false, message: "Invalid password or unauthorized" };
  }

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
