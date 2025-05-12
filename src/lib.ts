import { resolve } from "path";
import { writeFileSync } from "fs";
import type { Candidate } from "./types";

/**
 * Writes CSV results for each variant
 * @param results - Array of variant results
 * @param outputPath - Directory to write the results
 * @param verbose - Whether to log output information
 */
export function writeCsvResults(
  results: Array<{ variant: string; candidates: Candidate[] }>,
  outputPath: string,
  verbose: boolean,
): void {
  const csvHeader =
    "variant,strategy,novelty,lexicalDiversity,syntacticDivergence";

  for (const { variant, candidates } of results) {
    const csvLines = candidates.map((candidate) => {
      const combinedStrategies = candidate.meta
        .map((m) => m.strategy)
        .join("|");
      const { novelty, lexicalDiversity, syntacticDivergence } =
        candidate.scores;
      return [
        variant,
        combinedStrategies,
        novelty.toFixed(4),
        lexicalDiversity.toFixed(4),
        syntacticDivergence.toFixed(4),
      ].join(",");
    });

    const csvPath = resolve(outputPath, `results_${variant}.csv`);
    writeFileSync(csvPath, [csvHeader, ...csvLines].join("\n"));

    if (verbose) {
      console.log(`Wrote ${variant} results to: ${csvPath}`);
    }
  }
}

/**
 * Writes the JSON results to a file
 * @param results - Array of variant results
 * @param outputPath - Directory to write the results
 */
export function writeJsonResults(
  results: Array<{ variant: string; candidates: Candidate[] }>,
  outputPath: string,
): void {
  writeFileSync(resolve(outputPath), JSON.stringify(results, null, 2));
}
