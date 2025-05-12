import type { RiddleOutput, CreativityScores, RiddlePart } from "./types";
import { generateObject } from "ai";
import { z } from "zod";
import * as tf from "@tensorflow/tfjs-node";
import {
  UniversalSentenceEncoder,
  load as loadUseEncoder,
} from "@tensorflow-models/universal-sentence-encoder";
import type { Tensor, Tensor2D } from "@tensorflow/tfjs";
import { MODEL } from "./config";

/**
 * Stage: Combinatorial Creativity
 * Creates new riddles by combining setup and punchline components from different riddles
 * while ensuring the combinations are semantically compatible.
 * @param templates - Array of riddles in "setup | punchline | category" format
 * @returns The generated riddle and metadata
 */
export function generate(templates: string[]): RiddleOutput {
  // Parse templates into components
  const parts = templates
    .map((t) => {
      const [setup, punchline, category = "general"] = t
        .split("|")
        .map((s) => s.trim());
      return { setup, punchline, category };
    })
    .filter((p) => p.setup && p.punchline) as RiddlePart[];

  // Group by category for semantic compatibility
  const byCategory = parts.reduce(
    (acc, part) => {
      acc[part.category] = acc[part.category] || [];
      acc[part.category]?.push(part);
      return acc;
    },
    {} as Record<string, RiddlePart[]>,
  );

  // Select a random category that has at least 2 riddles
  const validCategories = Object.entries(byCategory)
    .filter(([_, parts]) => parts.length >= 2)
    .map(([cat, _]) => cat);

  if (validCategories.length === 0) {
    throw new Error("Not enough riddles for combinatorial generation");
  }

  const category =
    validCategories[Math.floor(Math.random() * validCategories.length)] as string;
  const categoryParts = byCategory[category] as RiddlePart[];

  // Select different parts from the same category
  const setupPart =
    categoryParts[Math.floor(Math.random() * categoryParts.length)] as RiddlePart;
  let punchlinePart: RiddlePart;
  do {
    punchlinePart =
      categoryParts[Math.floor(Math.random() * categoryParts.length)] as RiddlePart;
  } while (punchlinePart === setupPart && categoryParts.length > 1);

  const riddle = `${setupPart.setup} ${punchlinePart.punchline}`;

  return {
    riddle,
    meta: {
      strategy: "combinatorial",
      category,
      originalSetup: setupPart.setup,
      originalPunchline: punchlinePart.punchline,
    },
  };
}

/**
 * Stage: Exploratory Creativity
 * Refines a riddle by enhancing its creativity using an AI model.
 * @param options - Options for refinement
 * @param options.riddle - The riddle text to refine
 * @param options.fewShot - Few-shot examples to guide refinement
 * @param options.topP - Top-p sampling parameter
 * @param options.temperature - Temperature for creativity
 * @returns The refined riddle and metadata
 */
export async function refine({
  riddle,
  fewShot = [],
  topP = 0.9,
  temperature = 0.8,
}: {
  riddle: string;
  fewShot?: string[];
  topP?: number;
  temperature?: number;
}): Promise<RiddleOutput> {
  const messages = [
    ...fewShot.map((x) => ({ role: "system", content: x }) as any),
    {
      role: "user",
      content: [
        {
          type: "text",
          text: `Improve the creativity of this riddle: '${riddle}'`,
        },
      ],
    },
  ];

  const { object } = await generateObject({
    model: MODEL,
    messages,
    temperature,
    topP,
    schema: z.object({ riddle: z.string() }),
  });

  return {
    riddle: object.riddle.trim(),
    meta: { strategy: "exploratory", params: { temperature, top_p: topP } },
  };
}

/**
 * Creativity Stage: Transformational Creativity
 * Transforms a riddle based on specified rules (e.g., paraphrase).
 * @param riddle - The riddle text to transform
 * @param rules - Transformation rules to apply
 * @returns The transformed riddle and metadata
 */
export async function transform(
  riddle: string,
  rules: string[] = ["paraphrase"],
): Promise<RiddleOutput> {
  const rule = rules.includes("paraphrase") ? "paraphrase" : rules[0];
  let transformed = riddle;

  if (rule === "paraphrase") {
    const prompt = `Paraphrase the following riddle while preserving its meaning: '${riddle}'`;
    const { object } = await generateObject({
      model: MODEL,
      prompt,
      schema: z.object({ riddle: z.string() }),
    });
    transformed = object.riddle;
  }

  return { riddle: transformed, meta: { strategy: "transformational", rule } };
}

// === Self-Evaluation Module ===
let referenceEmbeddings: Tensor2D | null = null;
let encoderPromise: Promise<UniversalSentenceEncoder> | null = null;

/**
 * Loads embeddings for the reference corpus once.
 * @param corpus - Array of reference riddles
 */
async function loadEmbeddings(corpus: string[]): Promise<void> {
  tf.ready();
  // tf.setBackend("cpu");

  if (!encoderPromise) {
    encoderPromise = loadUseEncoder();
  }
  const encoder = await encoderPromise;
  // @ts-expect-error TensorFlow.js types are not up to date
  referenceEmbeddings = await encoder.embed(corpus);
}

/**
 * Computes cosine distance between two tensors.
 * @param a - First tensor
 * @param b - Second tensor
 * @returns Cosine distance in [0, 2]
 */
function cosineDistance(a: Tensor, b: Tensor): number {
  const dotVal = a.dot(b).dataSync()[0] ?? 0;
  const normAVal = a.norm().dataSync()[0] ?? 0;
  const normBVal = b.norm().dataSync()[0] ?? 0;
  const denom = normAVal * normBVal;
  if (denom === 0) return 1;
  return 1 - dotVal / denom;
}

/**
 * Evaluates a riddle on creativity metrics: novelty, lexical diversity, syntactic divergence.
 * @param riddle - The text to evaluate
 * @param corpus - Reference corpus for novelty calculation
 * @returns Creativity scores
 */
export async function evaluate(
  riddle: string,
  corpus: string[],
): Promise<CreativityScores> {
  if (!referenceEmbeddings) {
    await loadEmbeddings(corpus);
  }
  const encoder = await (encoderPromise as Promise<UniversalSentenceEncoder>);
  const emb = await encoder.embed([riddle]);

  // novelty (use cosine distance to work out how similar the riddle is to the reference corpus)
  const distances = referenceEmbeddings!
    .unstack()
    // @ts-expect-error TensorFlow.js types are not up to date
    .map((ref) => cosineDistance(emb.squeeze(), ref));
  const novelty = distances.reduce((a, b) => a + b, 0) / distances.length;

  // tokenize the riddle and move to a set to determine how many unique tokens there are
  const tokens = riddle.toLowerCase().split(/\s+/);
  const lexicalDiversity = new Set(tokens).size / tokens.length;

  const lengths = riddle
    .split(".")
    .filter((s) => s.trim())
    .map((s) => s.split(/\s+/).length);
  const mean = lengths.reduce((a, b) => a + b, 0) / lengths.length;

  // syntactic divergence (how much the lengths of the sentences vary)
  const syntacticDivergence =
    lengths.reduce((sum, len) => sum + Math.pow(len - mean, 2), 0) /
    lengths.length;

  return { novelty, lexicalDiversity, syntacticDivergence };
}
