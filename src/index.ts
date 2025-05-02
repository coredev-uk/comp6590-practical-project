import { readFileSync } from "fs";
import { resolve } from "path";

const TRAINING_DATA = resolve(__dirname, "training_riddles.json");

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
