import { NextResponse } from "next/server";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { mkdtemp, readFile, readdir, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

/**
 * Reference-style analyzer — Phase 1 (transcript-timing proxy).
 *
 * POST { youtubeUrl } -> { videoId, title, author, profile }
 *
 * We don't download the video. We shell out to `yt-dlp` to fetch just its
 * caption track (manual or auto-generated) — YouTube's plain timedtext/
 * InnerTube endpoints now require a signed, single-use session we can't
 * replicate with raw fetch, so we lean on yt-dlp, which keeps up with that.
 * Caption timing becomes a pacing profile: how long each caption stays up,
 * how many appear per minute, speaking rate. That's a proxy for "how fast
 * is this edited", not real cut/B-roll/animation detection — see plan.md
 * Phase 2 for that.
 *
 * Requires the `yt-dlp` binary on PATH (installed via `brew install yt-dlp`).
 */

export const runtime = "nodejs";

const execFileAsync = promisify(execFile);

interface CaptionSegment {
  start: number;
  dur: number;
  text: string;
}

function parseYouTubeId(input: string): string | null {
  try {
    const url = new URL(input.trim());
    const host = url.hostname.replace(/^www\./, "");
    if (host === "youtu.be") {
      return url.pathname.slice(1).split("/")[0] || null;
    }
    if (host === "youtube.com" || host === "m.youtube.com" || host === "music.youtube.com") {
      if (url.pathname === "/watch") return url.searchParams.get("v");
      const shorts = url.pathname.match(/^\/shorts\/([^/]+)/);
      if (shorts) return shorts[1];
      const embed = url.pathname.match(/^\/embed\/([^/]+)/);
      if (embed) return embed[1];
    }
    return null;
  } catch {
    // Not a full URL — allow a bare 11-char video ID.
    if (/^[\w-]{11}$/.test(input.trim())) return input.trim();
    return null;
  }
}

function decodeEntities(s: string): string {
  return s
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\n/g, " ")
    .trim();
}

function parseTimedText(xml: string): CaptionSegment[] {
  const segments: CaptionSegment[] = [];
  const re = /<text start="([\d.]+)" dur="([\d.]+)"[^>]*>([\s\S]*?)<\/text>/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(xml))) {
    const start = parseFloat(m[1]);
    const dur = parseFloat(m[2]);
    const text = decodeEntities(m[3]);
    if (text) segments.push({ start, dur, text });
  }
  return segments;
}

/** Thrown when yt-dlp fails for a transient reason (rate-limited, network) —
 * distinct from "this video genuinely has no captions", so the API can be
 * honest about which one happened instead of always saying "no captions". */
class TransientFetchError extends Error {}

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

/**
 * Fetch the English caption track via `yt-dlp` (no video download — just the
 * subtitle file) into a scratch temp dir, parse it, then clean up.
 *
 * `videoId` is pre-validated against /^[\w-]{11}$/ by the caller, and we build
 * the URL ourselves rather than passing user input to the subprocess, so
 * there's no argument/command-injection surface here.
 */
async function fetchCaptions(videoId: string): Promise<CaptionSegment[]> {
  const dir = await mkdtemp(join(tmpdir(), "yt-captions-"));
  try {
    const url = `https://www.youtube.com/watch?v=${videoId}`;
    const maxAttempts = 3;
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        await execFileAsync(
          "yt-dlp",
          [
            "--skip-download",
            "--write-subs",
            "--write-auto-sub",
            "--sub-lang",
            "en",
            "--sub-format",
            "srv1",
            "-o",
            "%(id)s.%(ext)s",
            url,
          ],
          { cwd: dir, timeout: 30_000 }
        );
        break; // succeeded
      } catch (e) {
        const stderr = (e as { stderr?: string }).stderr ?? String(e);
        // "no subtitles for the requested languages" is yt-dlp's clean
        // success-with-nothing-found signal — not an error we should retry.
        if (/no subtitles/i.test(stderr)) break;

        const isTransient = /429|Too Many Requests|timed? ?out|ETIMEDOUT|ECONNRESET/i.test(stderr);
        if (isTransient && attempt < maxAttempts) {
          await sleep(1500 * attempt);
          continue;
        }
        if (isTransient) {
          throw new TransientFetchError(
            "YouTube rate-limited the caption request. Wait a bit and try again."
          );
        }
        // Unrecognized failure — surface it rather than pretending "no captions".
        throw new TransientFetchError(`yt-dlp failed: ${stderr.split("\n").pop()}`);
      }
    }

    const files = await readdir(dir);
    const subFile = files.find((f) => f.endsWith(".srv1"));
    if (!subFile) return [];

    const xml = await readFile(join(dir, subFile), "utf-8");
    return parseTimedText(xml);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
}

interface StyleProfile {
  totalDurationS: number;
  captionCount: number;
  avgCaptionDurationS: number;
  captionsPerMinute: number;
  speakingRateWpm: number;
  avgGapS: number;
  hardCutCount: number;
  pacing: "fast" | "medium" | "slow";
  summary: string;
}

function buildProfile(segments: CaptionSegment[]): StyleProfile {
  const last = segments[segments.length - 1];
  const totalDurationS = Math.max(1, last.start + last.dur);
  const totalMinutes = totalDurationS / 60;

  const avgCaptionDurationS =
    segments.reduce((sum, s) => sum + s.dur, 0) / segments.length;
  const captionsPerMinute = segments.length / totalMinutes;

  const totalWords = segments.reduce((sum, s) => sum + s.text.split(/\s+/).filter(Boolean).length, 0);
  const speakingRateWpm = totalWords / totalMinutes;

  const gaps: number[] = [];
  for (let i = 1; i < segments.length; i++) {
    const gap = segments[i].start - (segments[i - 1].start + segments[i - 1].dur);
    if (gap > 0) gaps.push(gap);
  }
  const avgGapS = gaps.length ? gaps.reduce((a, b) => a + b, 0) / gaps.length : 0;
  const hardCutCount = gaps.filter((g) => g > 1.5).length; // long pause/silence -> likely a cut

  let pacing: StyleProfile["pacing"];
  if (avgCaptionDurationS < 2.5 && captionsPerMinute > 20) {
    pacing = "fast";
  } else if (avgCaptionDurationS > 4.5 && captionsPerMinute < 12) {
    pacing = "slow";
  } else {
    pacing = "medium";
  }

  const pacingLabel = { fast: "fast-paced", medium: "medium-paced", slow: "slow, long-take" }[pacing];
  const lengthLabel =
    totalDurationS < 60 ? `~${Math.round(totalDurationS)}s` : `~${Math.round(totalDurationS / 60)} min`;
  const summary =
    `${lengthLabel} video, ${pacingLabel} edit — ` +
    `${captionsPerMinute.toFixed(1)} caption changes/min (avg ${avgCaptionDurationS.toFixed(1)}s each), ` +
    `speaking at ~${Math.round(speakingRateWpm)} words/min` +
    (hardCutCount > 0 ? `, with ${hardCutCount} notable pause${hardCutCount === 1 ? "" : "s"}/cuts.` : ".");

  return {
    totalDurationS,
    captionCount: segments.length,
    avgCaptionDurationS,
    captionsPerMinute,
    speakingRateWpm,
    avgGapS,
    hardCutCount,
    pacing,
    summary,
  };
}

export async function POST(request: Request) {
  let body: { youtubeUrl?: string };
  try {
    body = (await request.json()) as { youtubeUrl?: string };
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  if (!body.youtubeUrl) {
    return NextResponse.json({ error: "youtubeUrl is required" }, { status: 400 });
  }

  const videoId = parseYouTubeId(body.youtubeUrl);
  if (!videoId) {
    return NextResponse.json({ error: "Couldn't parse a YouTube video ID from that URL." }, { status: 400 });
  }

  let title = "";
  let author = "";
  try {
    const oembedRes = await fetch(
      `https://www.youtube.com/oembed?url=${encodeURIComponent(`https://www.youtube.com/watch?v=${videoId}`)}&format=json`
    );
    if (oembedRes.ok) {
      const data = (await oembedRes.json()) as { title?: string; author_name?: string };
      title = data.title ?? "";
      author = data.author_name ?? "";
    }
  } catch {
    // Metadata is a nice-to-have; keep going without it.
  }

  let segments: CaptionSegment[] = [];
  try {
    segments = await fetchCaptions(videoId);
  } catch (e) {
    const message = e instanceof TransientFetchError ? e.message : "Couldn't fetch captions — try again.";
    return NextResponse.json({ videoId, title, author, error: message }, { status: 502 });
  }

  if (segments.length === 0) {
    return NextResponse.json(
      {
        videoId,
        title,
        author,
        error:
          "No captions available for this video, so we can't compute a pacing profile yet. Try a video with captions (auto-generated is fine).",
      },
      { status: 200 }
    );
  }

  const profile = buildProfile(segments);
  return NextResponse.json({ videoId, title, author, profile });
}
