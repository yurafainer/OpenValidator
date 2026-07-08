import { ValidationRequest } from "../dto/ValidationRequest";
import { ValidationResult } from "../dto/ValidationResult";

export interface IValidationService {
  validate(request: ValidationRequest): Promise<ValidationResult>;
}