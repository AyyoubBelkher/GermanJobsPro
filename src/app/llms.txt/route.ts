import { NextResponse } from "next/server";
import { getLlmsBaseMarkdown } from "@/lib/llms";

export const revalidate = 3600;

export async function GET() {
  const content = getLlmsBaseMarkdown();

  return new NextResponse(content, {
    status: 200,
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=3600",
    },
  });
}
