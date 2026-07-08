import { injectable } from "tsyringe";

import { ValidationRequest } from "../dto/ValidationRequest";
import { ValidationResult } from "../dto/ValidationResult";
import { IValidationService } from "./IValidationService";

@injectable()
export class ValidationService implements IValidationService {
  async validate(
    request: ValidationRequest
  ): Promise<ValidationResult> {

    return {
      valid: true,
      errors: []
    };

  }
}