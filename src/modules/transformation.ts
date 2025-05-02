import { generateObject, type LanguageModelV1 } from "ai";
import type { RiddleOutput } from "../types";
import { z } from "zod";

/**
 * @module Step 2: Transformational Creativity
 * @description Transformation module to apply transformation rules to a riddle using the openai API.
 */
export class TransformationModule {
  private _model: LanguageModelV1;
  private _rules: string[];

  constructor(
    model: LanguageModelV1,
    private rules: string[],
  ) {
    this._model = model;
    this._rules = rules;
  }

  async apply(riddle: string): Promise<RiddleOutput> {
    const prompt = `Paraphrase the following riddle while preseving its meaning: '${riddle}'`;
    const { object } = await generateObject({
      model: this._model,
      prompt,
      schema: z.object({
        riddle: z.string(),
      }),
    });
    return {
      riddle: object.riddle as string,
      meta: { strategy: "transformational", rule: "paraphrase" },
    };
  }
}
