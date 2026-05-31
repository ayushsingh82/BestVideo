import { NextResponse } from "next/server";
import { startCaptionJob } from "@/services/captioning";

/**
 * Create a captioning "project" from an uploaded video.
 *
 * The browser POSTs the video file (multipart/form-data) plus the chosen
 * style settings. We forward the bytes straight to ZapCap and start a
 * captioning task — no S3 / DB needed, ZapCap holds the job state. The
 * returned `projectId` encodes ZapCap's videoId + taskId so the project page
 * can poll for completion.
 */

export const runtime = "nodejs";
// Allow large-ish uploads (short-form clips). Bump if you need longer videos.
export const maxDuration = 60;

interface Settings {
  subtitles?: boolean;
  broll?: boolean;
  font?: string;
  fontColor?: string;
  highlightColor?: string;
  templateId?: string;
}

export async function POST(request: Request) {
  if (!process.env.ZAPCAP_API_KEY) {
    return NextResponse.json(
      { error: "Captioning is not configured (ZAPCAP_API_KEY missing)." },
      { status: 500 }
    );
  }

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return NextResponse.json({ error: "Expected multipart/form-data" }, { status: 400 });
  }

  const file = form.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Missing video file" }, { status: 400 });
  }
  if (!file.type.startsWith("video/")) {
    return NextResponse.json({ error: "File must be a video" }, { status: 400 });
  }

  let settings: Settings = {};
  const settingsRaw = form.get("settings");
  if (typeof settingsRaw === "string") {
    try {
      settings = JSON.parse(settingsRaw) as Settings;
    } catch {
      /* ignore malformed settings; fall back to defaults */
    }
  }

  try {
    const buffer = Buffer.from(await file.arrayBuffer());
    const { videoId, taskId } = await startCaptionJob({
      fileBuffer: buffer,
      fileName: file.name || "video.mp4",
      // ZAPCAP_TEMPLATE_ID env or first template is used when not provided.
      templateId: settings.templateId,
    });

    return NextResponse.json(
      { projectId: `${videoId}__${taskId}`, videoId, taskId },
      { status: 201 }
    );
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
