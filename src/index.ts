import "dotenv/config";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "fs";
import { resolve, dirname, join } from "path";
import { fileURLToPath } from "url";
import yargs from "yargs";
import { hideBin } from "yargs/helpers";
import type { RiddleOutput, Candidate, PipelineStep, Arguments } from "./types";
import { generate, refine, transform, evaluate } from "./modules";
import { writeCsvResults, writeJsonResults } from "./lib";
import {
  FEW_SHOT_EXAMPLES,
  TEMPLATES,
  TRANSFORM_RULES,
  VARIANTS,
  type Variant,
} from "./config";

const __dirname = dirname(fileURLToPath(import.meta.url));

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
 * Generates a riddle and processes it through the pipeline steps
 */
async function processRiddle(
  steps: PipelineStep[],
  referenceCorpus: string[],
): Promise<Candidate> {
  // Basic generation (random selection from templates)
  let currentOutput: RiddleOutput = generate(TEMPLATES);
  const metadataHistory = [currentOutput.meta];

  // Apply pipeline steps (if present)
  for (const step of steps) {
    try {
      currentOutput = await step(currentOutput);

      metadataHistory.push(currentOutput.meta);
    } catch (error) {
      console.error(`Error in ${currentOutput.meta.strategy} step:`, error);
      throw error;
    }
  }

  // Evaluate the final output
  const evaluationScores = await evaluate(
    currentOutput.riddle,
    referenceCorpus,
  );

  return {
    riddle: currentOutput.riddle,
    meta: metadataHistory,
    scores: evaluationScores,
  };
}

/**
 * Runs a specific variant of the pipeline
 */
async function runPipelineVariant(
  variantName: Variant,
  batchSize: number,
  steps: PipelineStep[],
  referenceCorpus: string[],
): Promise<{ variant: Variant; candidates: Candidate[] }> {
  const candidates: Candidate[] = [];
  const promises: Promise<Candidate>[] = [];

  for (let i = 0; i < batchSize; i++) {
    promises.push(processRiddle(steps, referenceCorpus));
  }

  const results = await Promise.all(promises);
  candidates.push(...results);

  return { variant: variantName, candidates };
}

/**
 * Orchestrates all pipeline variants and exports results.
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
    console.log("Running pipeline variants...");
  }

  // Define variants and launch them in parallel

  const allResults = await Promise.all(
    VARIANTS.map((variant) =>
      runPipelineVariant(
        variant,
        batchSize,
        createPipelineSteps(variant),
        referenceCorpus,
      ).catch((error) => {
        console.error(`Failed to process variant ${variant}:`, error);
        throw error;
      }),
    ),
  );
  const outputPath = outputDir || __dirname;

  if (verbose) {
    // Log summary of results
    allResults.forEach(({ variant, candidates }) => {
      console.log(`\nResults for variant [${variant}]:`);
      candidates.forEach((candidate, index) => {
        console.log(`\nRiddle ${index + 1}/${candidates.length}:`);
        console.log(`Final output: "${candidate.riddle}"`);
        console.log("Evaluation scores:", candidate.scores);
        console.log(
          "Pipeline steps:",
          candidate.meta.map((m) => m.strategy).join(" -> "),
        );
      });
    });
    console.log(`\nResults written to: ${outputPath}`);
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
      default: join(process.cwd(), "results"),
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
