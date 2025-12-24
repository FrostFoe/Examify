import { apiRequest } from "./api";

export async function verifyAdminPassword(adminUid: string, password: string) {
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
  } catch (err) {
    console.error("verifyAdminPassword error", err);
    return false;
  }
}
