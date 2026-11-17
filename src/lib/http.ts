import { NextResponse } from "next/server";
import { ZodError } from "zod";

export function errorResponse(error: unknown, fallback = "Request failed.") {
  if (error instanceof ZodError) {
    return NextResponse.json(
      { success: false, error: error.issues.map((issue) => issue.message).join(" ") },
      { status: 400 }
    );
  }

  console.error("[API ERROR]", error);
  return NextResponse.json(
    { success: false, error: fallback },
    { status: 500 }
  );
}
