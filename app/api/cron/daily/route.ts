import { NextRequest, NextResponse } from "next/server";

import { runDailyPipeline } from "@/lib/news/pipeline";
import { appConfig } from "@/lib/settings";

export const runtime = "nodejs";
export const maxDuration = 60;

function isAuthorized(request: NextRequest): boolean {
  if (!appConfig.cronSecret) {
    return process.env.NODE_ENV !== "production";
  }

  const headerToken = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  const queryToken = request.nextUrl.searchParams.get("secret");

  return headerToken === appConfig.cronSecret || queryToken === appConfig.cronSecret;
}

export async function POST(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json(
      {
        ok: false,
        error: "Unauthorized"
      },
      {
        status: 401
      }
    );
  }

  try {
    const result = await runDailyPipeline();
    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Unknown error"
      },
      {
        status: 500
      }
    );
  }
}

export async function GET(request: NextRequest) {
  return POST(request);
}
