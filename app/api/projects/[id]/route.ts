import { NextResponse } from "next/server";
import { getCaptionStatus } from "@/services/captioning";

/**
 * Poll the status of a captioning project. `id` is `${videoId}__${taskId}`
 * as returned by POST /api/projects. Proxies ZapCap so the API key stays
 * server-side.
 */

export const runtime = "nodejs";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const [videoId, taskId] = id.split("__");
  if (!videoId || !taskId) {
    return NextResponse.json({ error: "Invalid project id" }, { status: 400 });
  }

  try {
    const status = await getCaptionStatus(videoId, taskId);
    return NextResponse.json(status);
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
