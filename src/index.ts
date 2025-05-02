import { readFileSync } from "fs";
import { cosineDistance } from "./lib";
import { resolve } from "path";
import { generateText } from "ai";
import { openai } from "@ai-sdk/openai";

type RiddleMeta = {
  strategy: "combinatorial" | "exploratory" | "transformational";
  template?: string;
  rule?: string;
  params?: { temperature: number; top_p: number };
};

type RiddleOutput = {
  riddle: string;
  meta: RiddleMeta;
};

type CreativityScores = {
  novelty: number;
  lexicalDiversity: number;
  syntacticDivergence: number;
};

type Candidate = {
  riddle: string;
  meta: RiddleMeta[];
  scores: CreativityScores;
};

const TEMPLATES: string[] = [
  "I speak without a mouth and hear without ears. What am I?",
  "I'm tall when I'm young, and I'm short when I'm old. What am I?",
];
const TRANSFORM_RULES = ["paraphrase"];
/**
 * @module Combinatorial Creativity
 * @description Template generator to randomly select a riddle template, allows for combinatorial creativity.
 */
class TemplateGenerator {
  private _templates: string[];
  constructor(private templates: string[]) {
    this._templates = templates;
  }

  /**
   * Generate a riddle using a template.
   */
  generate(): RiddleOutput {
    const template = this._templates[
      Math.floor(Math.random() * this._templates.length)
    ] as string;
    return { riddle: template, meta: { strategy: "combinatorial", template } };
  }
}

/**
 * @module Transformational Creativity
 * @description Transformation module to apply transformation rules to a riddle using the openai API.
 */
class TransformationModule {
  constructor(private rules: string[]) {}

  async apply(riddle: string): Promise<RiddleOutput> {
    const prompt = `Paraphrase the following riddle while preseving its meaning: '${riddle}'`;
    const { text } = await generateText({
      model: openai("gpt-4o-5-preview"),
      prompt,
    });
    return {
      riddle: text,
      meta: { strategy: "transformational", rule: "paraphrase" },
    };
  }
}

class CompuRiddle {
  constructor(refCorpus: string[]) {}

  async runCycle(
    batch = 5,
    topK = 2,
  ): Promise<{ top: Candidate[]; bottom: Candidate[] }> {
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
