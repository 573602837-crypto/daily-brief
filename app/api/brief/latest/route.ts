import { NextResponse } from "next/server";

import { getLatestDailyBrief } from "@/lib/news/briefs";

export const runtime = "nodejs";

export async function GET() {
  const brief = await getLatestDailyBrief();

  return NextResponse.json(
    {
      ok: true,
      brief
    },
    {
      status: 200
    }
  );
}
