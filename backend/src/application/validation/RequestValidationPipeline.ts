import type { ValidationContext } from "../../domain/validation/ValidationContext";
import type { RequestValidationStep } from "./RequestValidationStep";

export class RequestValidationPipeline {
  constructor(private readonly steps: RequestValidationStep[]) {}

  public async execute(context: ValidationContext): Promise<void> {
    for (const step of this.steps) {
      if (context.shouldStop) break;
      await step.validate(context);
    }
  }

  public get stepNames(): string[] {
    return this.steps.map((step) => step.name);
  }
}
