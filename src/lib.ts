import { type Tensor } from "@tensorflow/tfjs-node";

export function cosineDistance(a: Tensor, b: Tensor): number {
  const dot = a.dot(b).dataSync()[0];
  const normA = a.norm().dataSync()[0];
  const normB = b.norm().dataSync()[0];
  // @ts-expect-error Dumb
  return 1 - dot / (normA * normB);
}
