const API_KEY = process.env.NEXT_PUBLIC_CSV_API_KEY || "";
const BACKEND_URL = process.env.NEXT_PUBLIC_CSV_API_BASE_URL || "";

export async function apiRequest<T>(
  route: string,
  method: string = "GET",
  body: unknown = null,
  params: Record<string, string | undefined> = {},
): Promise<{ success: boolean; data?: T; message?: string }> {
  try {
    const isServer = typeof window === "undefined";

    let url: string;
    const urlParams = new URLSearchParams();
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined && value !== null) {
        urlParams.set(key, value);
      }
    }

    // Always set route in params
    urlParams.set("route", route);

    if (isServer) {
      urlParams.set("token", API_KEY);
      const baseUrl = BACKEND_URL.endsWith("/")
        ? BACKEND_URL.slice(0, -1)
        : BACKEND_URL;
      url = `${baseUrl}/index.php?${urlParams.toString()}`;
    } else {
      url = `/api/proxy?${urlParams.toString()}`;
    }

    const headers: Record<string, string> = {
      "User-Agent": "Course-MNR-World-Backend/2.0",
    };

    // Only set Content-Type if not FormData
    if (!(body instanceof FormData)) {
      headers["Content-Type"] = "application/json";
    }

    const options: RequestInit = {
      method,
      headers,
    };

    if (body) {
      options.body = body instanceof FormData ? body : JSON.stringify(body);
    }

    const response = await fetch(url, options);

    const contentType = response.headers.get("content-type");

    if (contentType && contentType.includes("application/json")) {
      const result = await response.json();

      if (!response.ok) {
        return {
          success: false,
          message: result.message || result.error || `Error ${response.status}`,
        };
      }

      // If the result is already in the expected format { success, data/message, ... }
      if (
        result !== null &&
        typeof result === "object" &&
        !Array.isArray(result) &&
        "success" in result
      ) {
        return result;
      }

      // Otherwise, wrap it as a successful response
      return {
        success: true,
        data: result as T,
      };
    } else {
      const text = await response.text();
      if (!response.ok) {
        return { success: false, message: `Error ${response.status}: ${text}` };
      }
      // Warning: Backend returned 200 but not JSON. This is usually an error in this app's context.
      return {
        success: false,
        message: `Unexpected response format: ${text.substring(0, 100)}...`,
      };
    }
  } catch (error) {
    console.error("apiRequest error:", error);
    return {
      success: false,
      message: error instanceof Error ? error.message : "Network error",
    };
  }
}
