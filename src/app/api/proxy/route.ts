import { NextRequest, NextResponse } from "next/server";

export const runtime = "edge";

const BACKEND_API_BASE = "https://db.mnr.world/api";
const API_KEY =
  process.env.CSV_API_KEY || process.env.NEXT_PUBLIC_CSV_API_KEY || "";

export async function GET(request: NextRequest) {
  return handleRequest(request);
}

export async function POST(request: NextRequest) {
  return handleRequest(request);
}

export async function PUT(request: NextRequest) {
  return handleRequest(request);
}

export async function DELETE(request: NextRequest) {
  return handleRequest(request);
}

async function handleRequest(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    searchParams.set("token", API_KEY);

    const baseUrl = BACKEND_API_BASE.endsWith("/")
      ? BACKEND_API_BASE.slice(0, -1)
      : BACKEND_API_BASE;
    const url = `${baseUrl}/index.php?${searchParams.toString()}`;
    const incomingContentType = request.headers.get("content-type");

    const headers: Record<string, string> = {
      "User-Agent": "Course-MNR-World-Backend/2.0",
    };

    let body: BodyInit | null = null;

    if (request.method === "POST" || request.method === "PUT" || request.method === "DELETE") {
      if (incomingContentType && incomingContentType.includes("multipart/form-data")) {
        // Forward multipart request
        // We do NOT set Content-Type header explicitly here so fetch can set the boundary
        // BUT we need to pass the FormData.
        // Reading as formData() and passing it to fetch works in recent Node/Edge.
        const formData = await request.formData();
        body = formData; 
      } else {
        // Default to JSON handling
        headers["Content-Type"] = "application/json";
        body = await request.text();
      }
    }

    const options: RequestInit = {
      method: request.method,
      headers,
      body,
    };

    const response = await fetch(url, options);
    const contentType = response.headers.get("content-type");

    if (contentType && contentType.includes("application/json")) {
      const data = await response.json();
      return NextResponse.json(data, { status: response.status });
    } else {
      const text = await response.text();
      return NextResponse.json(
        { success: false, message: text || `Error ${response.status}` },
        { status: response.status === 200 ? 502 : response.status },
      );
    }
  } catch (error) {
    console.error("[API-PROXY] Error:", error);
    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error ? error.message : "Internal server error",
      },
      { status: 500 },
    );
  }
}
