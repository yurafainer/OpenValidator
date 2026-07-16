import type { ValidationContext } from "../../domain/validation/ValidationContext";

export interface RequestValidationStep {
  readonly name: string;
  validate(context: ValidationContext): Promise<void> | void;
}
