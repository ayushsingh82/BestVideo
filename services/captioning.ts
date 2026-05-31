/**
 * AI video captioning — burn animated, viral-style captions onto a video.
 *
 * Provider: ZapCap (https://platform.zapcap.ai/docs). Chosen for demo1 because
 * it does transcription + styled caption rendering in one async REST flow and
 * has a no-card free tier (3 free minutes) to validate the PunchEdit-style look.
 *
 * Flow: upload (file or URL) -> create task with a templateId -> poll until
 * the task completes -> return the rendered video download URL.
 *
 * Requires ZAPCAP_API_KEY. Optional ZAPCAP_TEMPLATE_ID (defaults to the first
 * available template). Set ZAPCAP_BASE_URL to override the API host.
 */

const ZAPCAP_BASE_URL = process.env.ZAPCAP_BASE_URL ?? "https://api.zapcap.ai";

export interface CaptionVideoInput {
  /** Public URL of the source video. Mutually exclusive with `fileBuffer`. */
  videoUrl?: string;
  /** Raw video bytes to upload directly. Mutually exclusive with `videoUrl`. */
  fileBuffer?: Buffer | Uint8Array;
  /** Filename to use when uploading a buffer (default "video.mp4"). */
  fileName?: string;
  /** ZapCap caption template id. Falls back to ZAPCAP_TEMPLATE_ID, then first template. */
  templateId?: string;
  /** Transcription language (default "en"). */
  language?: string;
}

export interface CaptionVideoResult {
  success: true;
  /** Rendered video (captions burned in) download URL. */
  videoUrl: string;
  /** Plain-text / transcript URL when provided. */
  transcriptUrl?: string;
  videoId: string;
  taskId: string;
}

export interface CaptionVideoError {
  success: false;
  error: string;
  videoId?: string;
  taskId?: string;
}

export type CaptionVideoOutput = CaptionVideoResult | CaptionVideoError;

export interface ZapCapTemplate {
  id: string;
  name?: string;
  previewUrl?: string;
}

function apiKey(): string | null {
  return process.env.ZAPCAP_API_KEY ?? null;
}

function headers(extra: Record<string, string> = {}): Record<string, string> {
  return { "x-api-key": apiKey() as string, ...extra };
}

/** List the caption templates available to your account. */
export async function listTemplates(): Promise<ZapCapTemplate[]> {
  if (!apiKey()) throw new Error("ZAPCAP_API_KEY is not set");
  const res = await fetch(`${ZAPCAP_BASE_URL}/templates`, { headers: headers() });
  if (!res.ok) {
    throw new Error(`ZapCap templates error: ${res.status} ${await res.text()}`);
  }
  const data = (await res.json()) as ZapCapTemplate[] | { templates?: ZapCapTemplate[] };
  return Array.isArray(data) ? data : data.templates ?? [];
}

/** Upload a video by public URL; returns the ZapCap video id. */
async function uploadByUrl(videoUrl: string): Promise<string> {
  const res = await fetch(`${ZAPCAP_BASE_URL}/videos/url`, {
    method: "POST",
    headers: headers({ "Content-Type": "application/json" }),
    body: JSON.stringify({ url: videoUrl }),
  });
  if (!res.ok) {
    throw new Error(`ZapCap upload-by-url error: ${res.status} ${await res.text()}`);
  }
  const data = (await res.json()) as { id: string };
  return data.id;
}

/** Upload raw video bytes via multipart; returns the ZapCap video id. */
async function uploadFile(bytes: Buffer | Uint8Array, fileName: string): Promise<string> {
  const form = new FormData();
  const blob = new Blob([bytes as unknown as BlobPart], { type: "video/mp4" });
  form.append("file", blob, fileName);
  const res = await fetch(`${ZAPCAP_BASE_URL}/videos`, {
    method: "POST",
    headers: headers(), // do NOT set Content-Type; fetch sets the multipart boundary
    body: form,
  });
  if (!res.ok) {
    throw new Error(`ZapCap upload error: ${res.status} ${await res.text()}`);
  }
  const data = (await res.json()) as { id: string };
  return data.id;
}

export async function resolveTemplateId(preferred?: string): Promise<string> {
  const explicit = preferred ?? process.env.ZAPCAP_TEMPLATE_ID;
  if (explicit) return explicit;
  const templates = await listTemplates();
  if (templates.length === 0) throw new Error("No ZapCap templates available for this account");
  return templates[0].id;
}

/** Create a captioning task; returns the task id. */
async function createTask(videoId: string, templateId: string, language: string): Promise<string> {
  const res = await fetch(`${ZAPCAP_BASE_URL}/videos/${videoId}/task`, {
    method: "POST",
    headers: headers({ "Content-Type": "application/json" }),
    body: JSON.stringify({ templateId, autoApprove: true, language }),
  });
  if (!res.ok) {
    throw new Error(`ZapCap create-task error: ${res.status} ${await res.text()}`);
  }
  const data = (await res.json()) as { taskId: string };
  return data.taskId;
}

interface TaskStatus {
  status: string; // "uploaded" | "pending" | "processing" | "transcribing" | "completed" | "failed" | ...
  downloadUrl?: string;
  transcript?: string;
  error?: string;
}

/**
 * Kick off a captioning job (upload + create task) WITHOUT waiting for the
 * render to finish. Returns the ids needed to poll for completion. Throws on
 * failure (callers in route handlers should try/catch).
 */
export async function startCaptionJob(
  input: CaptionVideoInput
): Promise<{ videoId: string; taskId: string }> {
  if (!apiKey()) throw new Error("ZAPCAP_API_KEY is not set");
  if (!input.videoUrl && !input.fileBuffer) {
    throw new Error("Provide either videoUrl or fileBuffer");
  }
  const videoId = input.fileBuffer
    ? await uploadFile(input.fileBuffer, input.fileName ?? "video.mp4")
    : await uploadByUrl(input.videoUrl as string);
  const templateId = await resolveTemplateId(input.templateId);
  const taskId = await createTask(videoId, templateId, input.language ?? "en");
  return { videoId, taskId };
}

export interface CaptionStatus {
  status: string;
  done: boolean;
  failed: boolean;
  videoUrl?: string;
  transcriptUrl?: string;
  error?: string;
}

/** Fetch the current status of a captioning task (single request, no polling). */
export async function getCaptionStatus(
  videoId: string,
  taskId: string
): Promise<CaptionStatus> {
  if (!apiKey()) throw new Error("ZAPCAP_API_KEY is not set");
  const res = await fetch(`${ZAPCAP_BASE_URL}/videos/${videoId}/task/${taskId}`, {
    headers: headers(),
  });
  if (!res.ok) {
    throw new Error(`ZapCap poll error: ${res.status} ${await res.text()}`);
  }
  const data = (await res.json()) as TaskStatus;
  return {
    status: data.status,
    done: data.status === "completed",
    failed: data.status === "failed",
    videoUrl: data.downloadUrl,
    transcriptUrl: data.transcript,
    error: data.error,
  };
}

/** Poll a task until it completes or fails. */
async function pollTask(
  videoId: string,
  taskId: string,
  { intervalMs = 5000, maxAttempts = 120 } = {}
): Promise<TaskStatus> {
  for (let i = 0; i < maxAttempts; i++) {
    const res = await fetch(`${ZAPCAP_BASE_URL}/videos/${videoId}/task/${taskId}`, {
      headers: headers(),
    });
    if (!res.ok) {
      throw new Error(`ZapCap poll error: ${res.status} ${await res.text()}`);
    }
    const data = (await res.json()) as TaskStatus;
    if (data.status === "completed") return data;
    if (data.status === "failed") {
      throw new Error(data.error ?? "ZapCap task failed");
    }
    await new Promise((r) => setTimeout(r, intervalMs));
  }
  throw new Error("Timeout waiting for ZapCap captioning task");
}

/**
 * Caption a video end-to-end: upload, render captions, return the final URL.
 */
export async function captionVideo(input: CaptionVideoInput): Promise<CaptionVideoOutput> {
  if (!apiKey()) {
    return { success: false, error: "ZAPCAP_API_KEY is not set" };
  }
  if (!input.videoUrl && !input.fileBuffer) {
    return { success: false, error: "Provide either videoUrl or fileBuffer" };
  }

  let videoId: string | undefined;
  let taskId: string | undefined;
  try {
    videoId = input.fileBuffer
      ? await uploadFile(input.fileBuffer, input.fileName ?? "video.mp4")
      : await uploadByUrl(input.videoUrl as string);

    const templateId = await resolveTemplateId(input.templateId);
    taskId = await createTask(videoId, templateId, input.language ?? "en");

    const result = await pollTask(videoId, taskId);
    if (!result.downloadUrl) {
      return { success: false, error: "Task completed without a downloadUrl", videoId, taskId };
    }

    return {
      success: true,
      videoUrl: result.downloadUrl,
      transcriptUrl: result.transcript,
      videoId,
      taskId,
    };
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    return { success: false, error: message, videoId, taskId };
  }
}
