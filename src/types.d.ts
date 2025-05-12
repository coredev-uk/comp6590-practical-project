export type RiddleMeta = {
  strategy: "combinatorial" | "exploratory" | "transformational";
  template?: string;
  rule?: string;
  params?: { temperature: number; top_p: number };
};

export type RiddleOutput = {
  riddle: string;
  meta: RiddleMeta;
};

export type CreativityScores = {
  novelty: number;
  lexicalDiversity: number;
  syntacticDivergence: number;
};

export type Candidate = {
  riddle: string;
  meta: RiddleMeta[];
  scores: CreativityScores;
};

export type Arguments = {
  batchSize: number;
  verbose: boolean;
  outputDir: string;
};

export type PipelineStep = (
  input: RiddleOutput,
) => Promise<RiddleOutput> | RiddleOutput;
