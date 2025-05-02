import type { RiddleOutput } from "../types";

/**
 * @module Step 1: Combinatorial Creativity
 * @description Template generator to randomly select a riddle template, allows for combinatorial creativity.
 */
export class TemplateGenerator {
  private _templates: string[];
  constructor(templates: string[]) {
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
