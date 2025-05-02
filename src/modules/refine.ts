import { generateObject, type LanguageModelV1 } from "ai";
import type { RiddleOutput } from "../types";
import { z } from "zod";

/**
 * @module Step 3: Exploratory Creativity
 * @description Refine the generated riddle using the ai provided
 */
export class Refiner {
  private _temperature: number;
  private _top_p: number;
  private _model: LanguageModelV1;

  constructor(
    model: LanguageModelV1,
    private temperature = 0.8,
    private top_p = 0.9,
  ) {
    this._model = model;
    this._temperature = temperature;
    this._top_p = top_p;
  }
  async refine(riddle: string, fewShot: string[] = []): Promise<RiddleOutput> {
    const { object } = await generateObject({
      model: this._model,
      messages: [
        ...(fewShot.map((x) => ({
          role: "system",
          content: [{ type: "text", text: x }],
        })) as any),
        {
          role: "user",
          content: [
            {
              type: "text",
              text: `Improve the creativity of this riddle: '${riddle}'`,
            },
          ],
        },
      ],
      temperature: this._temperature,
      topP: this._top_p,
      schema: z.object({
        riddle: z.string(),
      }),
    });
    return {
      riddle: object.riddle.trim(),
      meta: {
        strategy: "exploratory",
        params: { temperature: this.temperature, top_p: this.top_p },
      },
    };
  }
}
