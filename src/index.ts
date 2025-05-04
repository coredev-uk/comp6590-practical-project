import { readFileSync, writeFileSync } from "fs";
import { resolve, dirname } from "path";
import type { RiddleOutput, CreativityScores } from "./types";
import { evaluate, generate, refine, transform } from "./modules";
import { fileURLToPath } from "url";
import "@tensorflow/tfjs-node";

const __dirname = dirname(fileURLToPath(import.meta.url));

const TEMPLATES: string[] = [
  "I speak without a mouth and hear without ears. What am I?",
  "I'm tall when I'm young, and I'm short when I'm old. What am I?",
];
const TRANSFORM_RULES: string[] = ["paraphrase"];
const FEW_SHOT_EXAMPLES: string[] = [
  "I have cities but no houses, forests without trees, and rivers without water. What am I? A map.",
  "What has to be broken before you can use it? An egg.",
];

/**
 * Runs one cycle of the CompuRiddle pipeline: generate, refine, transform, evaluate, and exports results.
 * @param batchSize - Number of candidates to generate (default: 5)
 * @param topK - Number of top and bottom samples to log (default: 2)
 */
export async function runPipeline(batchSize = 5, topK = 2): Promise<void> {
  // Load reference corpus for evaluation
  const corpusPath = resolve(__dirname, "training_riddles.json");
  const referenceCorpus = JSON.parse(
    readFileSync(corpusPath, "utf-8"),
  ) as string[];

  const candidates: Array<{ output: RiddleOutput; scores: CreativityScores }> =
    [];

  for (let i = 0; i < batchSize; i++) {
    // Step 1: Combinatorial creativity
    const generated = generate(TEMPLATES);
    // Step 2: Exploratory creativity
    const refined = await refine({
      riddle: generated.riddle,
      fewShot: FEW_SHOT_EXAMPLES,
      temperature: 0.8,
      topP: 0.9,
    });
    // Step 3: Transformational creativity
    const transformed = await transform(refined.riddle, TRANSFORM_RULES);
    // Step 4: Self-evaluation
    const scores = await evaluate(transformed.riddle, referenceCorpus);

    candidates.push({ output: transformed, scores });
  }

  // Sort by novelty descending
  const sorted = [...candidates].sort(
    (a, b) => b.scores.novelty - a.scores.novelty,
  );
  const top = sorted.slice(0, topK);
  const bottom = sorted.slice(-topK);

  // Prepare structured export
  const exportData = {
    version: "1.0",
    generatedAt: new Date().toISOString(),
    candidates: candidates.map(({ output, scores }) => ({
      riddle: output.riddle,
      meta: output.meta,
      scores,
    })),
  };

  // Write JSON results
  writeFileSync(
    resolve(__dirname, "results.json"),
    JSON.stringify(exportData, null, 2),
  );

  // Write CSV results
  const header =
    "strategy,template,rule,novelty,lexicalDiversity,syntacticDivergence,riddle";
  const lines = candidates.map(({ output, scores }) => {
    const { strategy, template = "", rule = "" } = output.meta;
    const { novelty, lexicalDiversity, syntacticDivergence } = scores;
    const safe = output.riddle.replace(/"/g, '""');
    return [
      strategy,
      template,
      rule,
      novelty.toFixed(4),
      lexicalDiversity.toFixed(4),
      syntacticDivergence.toFixed(4),
      `"${safe}"`,
    ].join(",");
  });
  writeFileSync(
    resolve(__dirname, "results.csv"),
    [header, ...lines].join("\n"),
  );

  // Log summary
  console.log("Top examples:", top);
  console.log("Bottom examples:", bottom);
}

runPipeline().catch((err) => console.error(err));
