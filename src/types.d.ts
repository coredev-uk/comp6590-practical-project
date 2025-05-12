export type Strategy = "combinatorial" | "exploratory" | "transformational";

export type RiddleMeta = {
  strategy: Strategy;
  template?: string;
  rule?: string;
  category?: string;
  params?: {
    temperature: number;
    top_p: number;
  };
  originalSetup?: string;
  originalPunchline?: string;
};

export type PipelineError = {
  step: Strategy;
  error: Error;
  riddle: string;
};

export interface RiddleOutput {
  riddle: string;
  meta: RiddleMeta;
}

export interface CreativityScores {
  novelty: number;
  lexicalDiversity: number;
  syntacticDivergence: number;
}

export interface Candidate {
  riddle: string;
  meta: RiddleMeta[];
  scores: CreativityScores;
}

export type PipelineStep = (output: RiddleOutput) => Promise<RiddleOutput>;

export interface Arguments {
  batchSize: number;
  verbose: boolean;
  outputDir: string;
  [key: string]: unknown;
}

export type RiddlePart = {
  setup: string;
  punchline: string;
  category: string;
};
