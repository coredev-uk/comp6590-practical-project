import { existsSync, mkdirSync, readFileSync, writeFileSync } from "fs";
import { resolve, dirname, join } from "path";
import { fileURLToPath } from "url";
import yargs from "yargs";
import { hideBin } from "yargs/helpers";
import type { RiddleOutput, Candidate, PipelineStep, Arguments } from "./types";
import { generate, refine, transform, evaluate } from "./modules";
import { writeCsvResults, writeJsonResults } from "./lib";

const __dirname = dirname(fileURLToPath(import.meta.url));

// Configuration constants
const TEMPLATES: string[] = [
  "I speak without a mouth and hear without ears. What am I?",
  "I'm tall when I'm young, and I'm short when I'm old. What am I?",
];
const FEW_SHOT_EXAMPLES: string[] = [
  "I have cities but no houses... A map.",
  "What has to be broken before you can use it? An egg.",
];
const TRANSFORM_RULES: string[] = ["paraphrase"];

/**
 * Creates pipeline steps for a given variant
 * @returns Array of pipeline steps
 */
function createPipelineSteps(variant: string): PipelineStep[] {
  const exploratoryStep: PipelineStep = (output) =>
    refine({
      riddle: output.riddle,
      fewShot: FEW_SHOT_EXAMPLES,
      temperature: 0.8,
      topP: 0.9,
    });
  const transformationalStep: PipelineStep = (output) =>
    transform(output.riddle, TRANSFORM_RULES);

  switch (variant) {
    case "exploratory":
      return [exploratoryStep];
    case "full":
      return [exploratoryStep, transformationalStep];
    default:
      return [];
  }
}

/**
 * Runs a specific variant of the pipeline (e.g., baseline, exploratory, full).
 * @param variantName - Identifier for the variant
 * @param batchSize - Number of riddles to generate
 * @param steps - Array of pipeline steps to apply after generation
 * @param referenceCorpus - Pre-loaded reference corpus for evaluation
 * @returns An object with the variant name and all candidate results
 */
async function runPipelineVariant(
  variantName: string,
  batchSize: number,
  steps: PipelineStep[],
  referenceCorpus: string[],
): Promise<{ variant: string; candidates: Candidate[] }> {
  const candidates: Candidate[] = [];

  for (let index = 0; index < batchSize; index++) {
    // Step 1: Combinatorial creativity (template selection)
    let currentOutput: RiddleOutput = generate(TEMPLATES);
    const metadataHistory = [currentOutput.meta];

    // Apply each subsequent pipeline step
    for (const step of steps) {
      currentOutput = await step(currentOutput);
      metadataHistory.push(currentOutput.meta);
    }

    // Self-evaluation of final riddle
    const evaluationScores = await evaluate(
      currentOutput.riddle,
      referenceCorpus,
    );
    candidates.push({
      riddle: currentOutput.riddle,
      meta: metadataHistory,
      scores: evaluationScores,
    });
  }

  return { variant: variantName, candidates };
}

/**
 * Orchestrates all pipeline variants and exports results.
 * Uses Promise.all to run variants concurrently.
 * @param batchSize - Number of candidates per variant
 */
export async function runPipeline(
  batchSize = 5,
  verbose = false,
  outputDir?: string,
): Promise<void> {
  // Pre-load the reference corpus once
  const corpusPath = resolve(__dirname, "training_riddles.json");
  const referenceCorpus = JSON.parse(
    readFileSync(corpusPath, "utf-8"),
  ) as string[];

  if (verbose) {
    console.log(`Starting pipeline with batch size: ${batchSize}`);
    console.log(`Loading reference corpus from: ${corpusPath}`);
    console.log(`Reference corpus size: ${referenceCorpus.length} entries`);
  }

  // Define variants and launch them in parallel
  const variants = ["baseline", "exploratory", "full"];
  const allResults = await Promise.all(
    variants.map((variant) =>
      runPipelineVariant(
        variant,
        batchSize,
        createPipelineSteps(variant),
        referenceCorpus,
      ),
    ),
  );
  const outputPath = outputDir || __dirname;

  if (verbose) {
    console.log(`Writing results to directory: ${outputPath}`);
    console.log(`Generated candidates per variant: ${batchSize}`);
  }

  if (outputDir && !existsSync(outputDir)) {
    mkdirSync(outputDir);
  }

  writeFileSync(
    resolve(outputPath, "results_comparison.json"),
    JSON.stringify(allResults, null, 2),
  );

  // Write results in different formats
  writeJsonResults(allResults, join(outputPath, "results_comparison.json"));
  writeCsvResults(allResults, outputPath, verbose);
}

// Parse command line arguments using yargs
const argv = yargs(hideBin(process.argv))
  .options({
    "batch-size": {
      alias: "b",
      type: "number",
      description: "Number of riddles to generate per variant",
      default: 5,
    },
    verbose: {
      alias: "v",
      type: "boolean",
      description: "Enable verbose logging",
      default: false,
    },
    "output-dir": {
      alias: "o",
      type: "string",
      description: "Directory to store output files",
      default: __dirname,
    },
  })
  .help()
  .alias("help", "h")
  .version()
  .alias("version", "V")
  .parseSync() as Arguments;

// Execute pipeline when run directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runPipeline(argv.batchSize, argv.verbose, argv.outputDir).catch((error) => {
    console.error("Pipeline error:", error);
    process.exit(1);
  });
}
