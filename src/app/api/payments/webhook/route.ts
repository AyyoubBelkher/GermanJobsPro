import { NextResponse } from "next/server";

/**
 * DEPRECATED: Lemon Squeezy integration has been retired in favor of Gumroad.
 * Webhooks are now handled exclusively at /api/payments/gumroad-webhook.
 */
export async function POST() {
  return NextResponse.json(
    {
      error: "Gone",
      message: "Lemon Squeezy webhook endpoint has been deprecated. GermanJobsPro uses Gumroad exclusively at /api/payments/gumroad-webhook.",
    },
    { status: 410 }
  );
}

export async function GET() {
  return NextResponse.json(
    {
      error: "Gone",
      message: "Lemon Squeezy webhook endpoint has been deprecated. GermanJobsPro uses Gumroad exclusively at /api/payments/gumroad-webhook.",
    },
    { status: 410 }
  );
}
