import { z } from "zod";

export const newsletterSchema = z.object({
  email: z.string().min(1, "Email is required").email("Please enter a valid email"),
});

export type NewsletterSchema = z.infer<typeof newsletterSchema>;
