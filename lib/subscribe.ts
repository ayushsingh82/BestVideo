import type { ActionResult } from "./utils";

/**
 * Subscribe an email to the newsletter.
 * Replace with your real API (e.g. POST /api/newsletter) when ready.
 */
export async function subscribe(email: string): Promise<ActionResult<string>> {
  try {
    // Optional: call your API, e.g.:
    // const res = await fetch("/api/newsletter", { method: "POST", body: JSON.stringify({ email }) });
    // const json = await res.json();
    // if (!res.ok) return { success: false, message: json.error ?? "Subscription failed" };
    // return { success: true, data: "Thanks for subscribing!" };

    if (!email?.trim()) {
      return { success: false, message: "Email is required" };
    }

    // Stub: always succeed for now
    return {
      success: true,
      data: "Thanks for subscribing!",
    };
  } catch {
    return { success: false, message: "Something went wrong. Please try again." };
  }
}
