/**
 * AI image generation — call external provider (e.g. Replicate).
 */

export interface GenerateImageInput {
  prompt: string;
  aspect_ratio?: string;
  provider?: string;
}

export interface GenerateImageResult {
  success: true;
  imageUrl: string;
  providerJobId?: string;
}

export interface GenerateImageError {
  success: false;
  error: string;
  providerJobId?: string;
}

export type GenerateImageOutput = GenerateImageResult | GenerateImageError;

/**
 * Generate image from prompt using configured provider.
 * Returns either a public image URL (e.g. from Replicate) or error.
 */
export async function generateImage(
  input: GenerateImageInput
): Promise<GenerateImageOutput> {
  const provider = input.provider ?? process.env.IMAGE_PROVIDER ?? "replicate";
  if (provider === "replicate") {
    return runReplicate(input.prompt, input.aspect_ratio);
  }
  return { success: false, error: `Unknown provider: ${provider}` };
}

/**
 * Replicate: FLUX image generation.
 * Requires REPLICATE_API_TOKEN.
 */
async function runReplicate(prompt: string, aspect_ratio?: string): Promise<GenerateImageOutput> {
  const apiToken = process.env.REPLICATE_API_TOKEN;
  if (!apiToken) {
    return { success: false, error: "REPLICATE_API_TOKEN is not set" };
  }

  const model = process.env.REPLICATE_IMAGE_MODEL ?? "black-forest-labs/flux-schnell";

  try {
    const response = await fetch("https://api.replicate.com/v1/models/black-forest-labs/flux-schnell/predictions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiToken}`,
        "Content-Type": "application/json",
        "Prefer": "wait"
      },
      body: JSON.stringify({
        input: {
          prompt: prompt,
          go_fast: true,
          megapixels: "1",
          num_outputs: 1,
          aspect_ratio: aspect_ratio || "1:1",
          output_format: "webp",
          output_quality: 80,
          num_inference_steps: 4
        },
      }),
    });
    
    if (!response.ok) {
      const text = await response.text();
      return { success: false, error: `Replicate API error: ${response.status} ${text}` };
    }
    
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const pred = await response.json() as any;
    
    // Sometimes prefer wait makes it finish instantly
    if (pred.status === "succeeded" && pred.output) {
      const imageUrl = Array.isArray(pred.output) ? pred.output[0] : pred.output;
      return {
        success: true,
        imageUrl: String(imageUrl),
        providerJobId: pred.id,
      };
    }
    
    if (pred.status === "failed") {
        return {
          success: false,
          error: pred.error ?? "Generation failed",
          providerJobId: pred.id,
        };
    }
    
    const pollUrl = pred.urls?.get ?? `https://api.replicate.com/v1/predictions/${pred.id}`;

    // Poll until completed
    for (let i = 0; i < 30; i++) {
      await new Promise((r) => setTimeout(r, 2000)); // poll every 2s
      const pollRes = await fetch(pollUrl, {
        headers: { Authorization: `Bearer ${apiToken}` },
      });
      const data = (await pollRes.json()) as {
        status: string;
        output?: string[];
        error?: string;
      };
      if (data.status === "succeeded" && data.output) {
        const imageUrl = Array.isArray(data.output) ? data.output[0] : data.output;
        return {
          success: true,
          imageUrl: String(imageUrl),
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
      error: "Timeout waiting for image generation",
      providerJobId: pred.id,
    };
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    return { success: false, error: message };
  }
}
