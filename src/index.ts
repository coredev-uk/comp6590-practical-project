import { readFileSync } from "fs";
import { resolve } from "path";
import { google } from "@ai-sdk/google";
import type { Candidate } from "./types";
import { TemplateGenerator } from "./modules/templateGenerator";
import { TransformationModule } from "./modules/transformation";
import { Refiner } from "./modules/refine";

const MODEL = google("gemini-2.0-flash-lite-001");
const TEMPLATES: string[] = [
  "I speak without a mouth and hear without ears. What am I?",
  "I'm tall when I'm young, and I'm short when I'm old. What am I?",
];
const TRANSFORM_RULES = ["paraphrase"];

class CompuRiddle {
  private gen = new TemplateGenerator(TEMPLATES);
  private trans = new TransformationModule(MODEL, TRANSFORM_RULES);
  private refiner = new Refiner(MODEL);

  constructor(refCorpus: string[]) {}

  async runCycle(
    batchSize = 5,
    topK = 2,
  ): Promise<{ top: Candidate[]; bottom: Candidate[] }> {
    const candidates: Candidate[] = [];

    // main cycle run
    for (let i = 0; i < batchSize; i++) {
      const out1 = this.gen.generate();
      const out2 = await this.refiner.refine(out1.riddle);
      const out3 = await this.trans.apply(out2.riddle);

      // TODO: evaluate creativity scores

      candidates.push({
        riddle: out3.riddle,
        meta: [out1.meta, out2.meta, out3.meta],
        scores: null as any,
      });
    }

    console.log(candidates);
    throw new Error("Not implemented");
  }
}

(async () => {
  const referenceCorpus = JSON.parse(
    readFileSync(resolve(__dirname, "training_riddles.json"), "utf-8"),
  ) as string[];
  const system = new CompuRiddle(referenceCorpus);
  const { top, bottom } = await system.runCycle();
  console.log("Top examples:", JSON.stringify(top, null, 2));
  console.log("Bottom examples:", JSON.stringify(bottom, null, 2));
})();
