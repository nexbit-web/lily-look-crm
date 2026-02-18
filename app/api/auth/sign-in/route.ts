import { NextRequest, NextResponse } from "next/server";
import { checkLoginRateLimit } from "@/lib/rate-limit";
import { auth } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0] ??
    req.headers.get("x-real-ip") ??
    "anonymous";

  const { success, remaining, minutesLeft } = await checkLoginRateLimit(ip);

  if (!success) {
    return NextResponse.json(
      {
        error: `Забагато спроб входу. Спробуйте через ${minutesLeft} хв.`,
      },
      { status: 429 },
    );
  }

  return auth.handler(req);
}
