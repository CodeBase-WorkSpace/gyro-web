import { NextResponse } from "next/server";

import { refreshAuthCookies } from "@/lib/auth/refresh";

export async function POST() {
  const result = await refreshAuthCookies();

  if (!result.ok) {
    return NextResponse.json(
      {
        refreshed: false,
        code: result.code,
      },
      {
        status: result.status,
      }
    );
  }

  return NextResponse.json({
    refreshed: true,
  });
}
