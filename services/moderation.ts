/**
 * Prompt moderation — call before enqueueing video generation.
 * Integrate OpenAI Moderation API or similar to reject unsafe prompts.
 */

export interface ModerationResult {
  allowed: boolean;
  reason?: string;
}

/**
 * Check if prompt is safe for video generation.
 * Returns { allowed: false, reason } to reject.
 */
export async function moderatePrompt(prompt: string): Promise<ModerationResult> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return { allowed: true };
  }
  try {
    const res = await fetch("https://api.openai.com/v1/moderations", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ input: prompt }),
    });
    if (!res.ok) return { allowed: true };
    const data = (await res.json()) as { results?: { flagged: boolean; categories?: Record<string, boolean> }[] };
    const result = data.results?.[0];
    if (result?.flagged) {
      return { allowed: false, reason: "Prompt flagged by moderation" };
    }
    return { allowed: true };
  } catch {
    return { allowed: true };
  }
}
