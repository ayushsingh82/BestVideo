import { NextResponse } from "next/server";
import { getCredits } from "@/lib/credits";
import { requireUserId } from "@/lib/auth";

export async function GET(request: Request) {
  let userId: string;
  try {
    userId = requireUserId(request);
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const credits = await getCredits(userId);
  return NextResponse.json({ credits });
}
