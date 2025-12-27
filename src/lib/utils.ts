import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Helper to get current time in Dhaka (Asia/Dhaka)
export function getCurrentDhakaTime() {
  const now = new Date();
  const dhakaTimeStr = now.toLocaleString("en-US", { timeZone: "Asia/Dhaka" });
  return new Date(dhakaTimeStr);
}

// Helper to combine date and time components into an ISO string (UTC) considering Dhaka Timezone (+06:00)
export const combineDhakaDateTime = (
  date: Date | undefined,
  hour: string,
  minute: string,
  period: "AM" | "PM",
): string | null => {
  if (!date || !hour || !minute || !period) return null;

  let h24 = parseInt(hour, 10);
  if (period === "PM" && h24 !== 12) h24 += 12;
  if (period === "AM" && h24 === 12) h24 = 0;

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hours = String(h24).padStart(2, "0");
  const mins = String(minute).padStart(2, "0");

  // Construct ISO string with +06:00 offset (Dhaka Standard Time)
  const isoWithOffset = `${year}-${month}-${day}T${hours}:${mins}:00+06:00`;

  // Return parsed Date object as ISO string (UTC)
  return new Date(isoWithOffset).toISOString();
};

// Helper to parse a UTC ISO string back to Dhaka time components
export const parseDhakaDateTime = (isoString: string) => {
  const date = new Date(isoString);

  // Format to parts in Dhaka timezone
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Dhaka",
    year: "numeric",
    month: "numeric",
    day: "numeric",
    hour: "numeric",
    minute: "numeric",
    second: "numeric",
    hour12: true,
  });

  const parts = formatter.formatToParts(date);
  const getPart = (type: string) => parts.find((p) => p.type === type)?.value;

  const year = parseInt(getPart("year") || "0");
  const month = parseInt(getPart("month") || "0") - 1; // 0-indexed for Date constructor
  const day = parseInt(getPart("day") || "0");
  const hour12 = getPart("hour") || "12";
  const minute = getPart("minute") || "00";
  const period = (getPart("dayPeriod") || "AM") as "AM" | "PM";

  // Create a local date object that *looks* like the Dhaka date (for DatePicker)
  // We use this strictly for extracting YYYY-MM-DD for the input
  const localDateRep = new Date(year, month, day);

  return {
    date: localDateRep,
    hour: hour12.padStart(2, "0"), // ensure 2 digits
    minute: minute.padStart(2, "0"),
    period: period,
  };
};

/**
 * Validate if current device time is within exam time window
 * @param startTime - Exam start time (ISO string or Date)
 * @param endTime - Exam end time (ISO string or Date)
 * @returns { isAllowed: boolean, reason?: string }
 */
export const validateExamTime = (
  startTime: string | Date | null | undefined,
  endTime: string | Date | null | undefined,
): { isAllowed: boolean; reason?: string } => {
  try {
    // Get current time from device
    const now = new Date();
    const currentTime = new Date(
      now.toLocaleString("en-US", { timeZone: "Asia/Dhaka" }),
    );

    // If no time restrictions, allow
    if (!startTime && !endTime) {
      return { isAllowed: true };
    }

    // Parse start time
    const start = startTime ? new Date(startTime) : null;
    const end = endTime ? new Date(endTime) : null;

    // Check if current time is before exam start
    if (start && currentTime < start) {
      return {
        isAllowed: false,
        reason: `exam_not_started`,
      };
    }

    // Check if current time is after exam end
    if (end && currentTime > end) {
      return {
        isAllowed: false,
        reason: `exam_ended`,
      };
    }

    // Current time is within the allowed window
    return { isAllowed: true };
  } catch (error) {
    console.error("Error validating exam time:", error);
    return { isAllowed: false, reason: `invalid_time_data` };
  }
};

/**
 * Get formatted time strings for display
 * @param date - Date to format
 * @returns Formatted date string in Dhaka timezone
 */
export const formatExamDateTime = (date: Date | string | null | undefined) => {
  if (!date) return null;
  try {
    const d = new Date(date);
    return d.toLocaleString("bn-BD", {
      timeZone: "Asia/Dhaka",
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  } catch {
    return null;
  }
};

