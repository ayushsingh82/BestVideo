import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireUserId } from "@/lib/auth";

export async function GET(request: Request) {
  let userId: string;
  try {
    userId = requireUserId(request);
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const limit = Math.min(parseInt(searchParams.get("limit") ?? "20", 10), 100);
  const cursor = searchParams.get("cursor") ?? undefined;

  const jobs = await prisma.videoJob.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: limit + 1,
    ...(cursor && { cursor: { id: cursor }, skip: 1 }),
    select: {
      id: true,
      prompt: true,
      status: true,
      videoUrl: true,
      creditsUsed: true,
      createdAt: true,
      completedAt: true,
    },
  });

  const nextCursor = jobs.length > limit ? jobs[limit - 1]?.id : null;
  const items = jobs.length > limit ? jobs.slice(0, limit) : jobs;

  return NextResponse.json({
    items,
    nextCursor,
  });
}
