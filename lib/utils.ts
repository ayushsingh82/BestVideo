export function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(" ");
}

export type ActionResult<T> =
  | { success: true; data: T; id?: string }
  | { success: false; message: string };
