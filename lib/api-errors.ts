import { NextResponse } from "next/server";

export function apiErrorResponse(error: unknown, operation: string, status = 503) {
  const code = typeof error === "object" && error && "code" in error ? String(error.code) : "unknown";
  const detail = error instanceof Error ? error.message.slice(0, 240) : "Unexpected server error.";
  console.error(`${operation} failed`, { code, detail });
  return NextResponse.json({ error: `${operation} failed (${code}): ${detail}` }, { status });
}

export async function readJson<T>(request: Request): Promise<T> {
  return await request.json() as T;
}
