export type Status = "idle" | "uploading" | "done" | "error";

export interface Cue {
  start: number;
  end: number;
  query: string;
  imageUrl: string;
  title?: string;
}
