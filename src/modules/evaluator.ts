import type { UniversalSentenceEncoder } from "@tensorflow-models/universal-sentence-encoder";
import { Tensor, type Tensor2D } from "@tensorflow/tfjs";
import type { CreativityScores } from "../types";

class CreativityEvaluator {
  private referenceEmbeddings!: Tensor2D;
  constructor(
    private use: UniversalSentenceEncoder,
    referenceCorpus: string[],
  ) {
    // @TODO: Set reference embeddings using the USE module (types are a bit messed up so idk)
  }

  async embeddingNovelty(text: string): Promise<number> {
    const encoder = await this.model.load(); // @same as above
    const emb = (await encoder.embed([text])) as Tensor2D;
    const distances = this.referenceEmbeddings
      .unstack()
      .map((refEmb) => cosineDistance(emb.squeeze(), refEmb));
    return distances.reduce((a, b) => a + b, 0) / distances.length;
  }
  lexicalDiversity(text: string): number {
    const tokens = text.split(/\s+/);
    return new Set(tokens).size / tokens.length;
  }
  syntacticDivergence(text: string): number {
    const lengths = text
      .split(".")
      .filter((s) => s.trim())
      .map((s) => s.split(/\s+/).length);
    const mean = lengths.reduce((a, b) => a + b, 0) / lengths.length;
    return (
      lengths.reduce((sum, len) => sum + Math.pow(len - mean, 2), 0) /
      lengths.length
    );
  }
  async score(text: string): Promise<CreativityScores> {
    return {
      novelty: await this.embeddingNovelty(text),
      lexicalDiversity: this.lexicalDiversity(text),
      syntacticDivergence: this.syntacticDivergence(text),
    };
  }
}

// helper function
export function cosineDistance(a: Tensor, b: Tensor): number {
  const dot = a.dot(b).dataSync()[0];
  const normA = a.norm().dataSync()[0];
  const normB = b.norm().dataSync()[0];
  // @ts-expect-error Dumb
  return 1 - dot / (normA * normB);

