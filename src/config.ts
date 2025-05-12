import { google } from "@ai-sdk/google";

export const TEMPLATES = [
  "I speak without a mouth and hear without ears. What am I?",
  "I'm tall when I'm young, and I'm short when I'm old. What am I?",
] as string[];

export const FEW_SHOT_EXAMPLES = [
  "I have cities but no houses... A map.",
  "What has to be broken before you can use it? An egg.",
] as string[];

export const TRANSFORM_RULES = ["paraphrase"] as string[];

export const VARIANTS = ["baseline", "exploratory", "full"] as string[];

export type Variant = (typeof VARIANTS)[number];

export const MODEL = google("gemini-2.0-flash-lite");
