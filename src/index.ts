import { readFileSync } from "fs";
import { resolve } from "path";
import OpenAI from "openai";

const TRAINING_DATA = resolve(__dirname, "training_riddles.json");
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const openai = new OpenAI({
  apiKey: OPENAI_API_KEY,
});
const TEMPLATES: string[] = [
  "I speak without a mouth and hear without ears. What am I?",
  "I'm tall when I'm young, and I'm short when I'm old. What am I?",
];
const TRANSFORM_RULES = ["paraphrase"];

type Template = {
  riddle: string;
  meta: {
    strategy: "combinatorial" | "paraphrase";
    template: string;
  };
};

class TemplateGenerator {
  private _templates: string[];
  constructor(private templates: string[]) {
    this._templates = templates;
  }

  /**
   * Generate a riddle using a template.
   */
  generate(): Template {
    const template = this._templates[
      Math.floor(Math.random() * this._templates.length)
    ] as string;
    return { riddle: template, meta: { strategy: "combinatorial", template } };
  }
}

class CompuRiddle {
  constructor(refCorpus: string[]) {}

  async run(batch = 5, topK = 2) {}
}

async function main() {
  const refCorpus = JSON.parse(readFileSync(TRAINING_DATA, "utf-8"));
  const system = new CompuRiddle(refCorpus);
  const results = await system.run();
  console.log(JSON.stringify(results, null, 2));
}

main();
