/**
 * AI video generation — call external provider (e.g. Replicate, Runway).
 * This module abstracts the provider; implement runReplicate() or runRunway() as needed.
 */

export interface GenerateVideoInput {
  prompt: string;
  provider?: string;
}

export interface GenerateVideoResult {
  success: true;
  videoUrl: string;
  providerJobId?: string;
}

export interface GenerateVideoError {
  success: false;
  error: string;
  providerJobId?: string;
}

export type GenerateVideoOutput = GenerateVideoResult | GenerateVideoError;

/**
 * Generate video from prompt using configured provider.
 * Returns either a public video URL (e.g. from Replicate) or error.
 */
export async function generateVideo(
  input: GenerateVideoInput
): Promise<GenerateVideoOutput> {
  const provider = input.provider ?? process.env.VIDEO_PROVIDER ?? "replicate";
  if (provider === "replicate") {
    return runReplicate(input.prompt);
  }
  return { success: false, error: `Unknown provider: ${provider}` };
}

/**
 * Replicate: Stable Video Diffusion or similar model.
 * Requires REPLICATE_API_TOKEN.
 */
async function runReplicate(prompt: string): Promise<GenerateVideoOutput> {
  const apiToken = process.env.REPLICATE_API_TOKEN;
  if (!apiToken) {
    return { success: false, error: "REPLICATE_API_TOKEN is not set" };
  }

  // Example: use a public SVD model. Adjust model version as needed.
  const model = process.env.REPLICATE_VIDEO_MODEL ?? "stability-ai/stable-video-diffusion:3f0457e4619daac51203dedb472816fd4af51f3149fa7a9e0b5ffcf1b8172438";

  try {
    const response = await fetch("https://api.replicate.com/v1/predictions", {
      method: "POST",
      headers: {
        Authorization: `Token ${apiToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        version: model.split(":")[1] ?? model,
        input: { prompt },
      }),
    });
    if (!response.ok) {
      const text = await response.text();
      return { success: false, error: `Replicate API error: ${response.status} ${text}` };
    }
    const pred = (await response.json()) as { id: string; urls?: { get: string } };
    const pollUrl = pred.urls?.get ?? `https://api.replicate.com/v1/predictions/${pred.id}`;

    // Poll until completed
    for (let i = 0; i < 120; i++) {
      await new Promise((r) => setTimeout(r, 5000));
      const pollRes = await fetch(pollUrl, {
        headers: { Authorization: `Token ${apiToken}` },
      });
      const data = (await pollRes.json()) as {
        status: string;
        output?: string;
        error?: string;
      };
      if (data.status === "succeeded" && data.output) {
        const videoUrl = Array.isArray(data.output) ? data.output[0] : data.output;
        return {
          success: true,
          videoUrl: String(videoUrl),
          providerJobId: pred.id,
        };
      }
      if (data.status === "failed") {
        return {
          success: false,
          error: data.error ?? "Generation failed",
          providerJobId: pred.id,
        };
      }
    }
    return {
      success: false,
      error: "Timeout waiting for video generation",
      providerJobId: pred.id,
    };
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    return { success: false, error: message };
  }
}
