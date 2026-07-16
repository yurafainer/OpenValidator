import { validate as validateUuid } from "uuid";
import type { ValidationError } from "../../domain/validation/ValidationError";
import { ValidationErrorCode } from "../../domain/validation/ValidationErrorCode";
import { ValidationSeverity } from "../../domain/validation/ValidationSeverity";

export interface CustomRule { location: string; required?: boolean; format?: "uuid" | "iban" | "israeliId" | "bic" | "lei"; pattern?: string; equals?: unknown; }

export class CustomRuleEngine {
  public validate(rules: CustomRule[], data: Record<string, unknown>): ValidationError[] {
    const errors: ValidationError[] = [];
    for (const rule of rules) {
      const value = this.read(data, rule.location);
      if ((value === undefined || value === null || value === "") && rule.required) {
        errors.push(this.error(rule.location, "Required custom rule value is missing", "required", value));
        continue;
      }
      if (value === undefined || value === null) continue;
      const text = String(value);
      if (rule.pattern && !new RegExp(rule.pattern).test(text)) errors.push(this.error(rule.location, `Value does not match custom pattern '${rule.pattern}'`, rule.pattern, value));
      if (rule.equals !== undefined && value !== rule.equals) errors.push(this.error(rule.location, `Value must equal '${String(rule.equals)}'`, rule.equals, value));
      if (rule.format && !this.matchesFormat(rule.format, text)) errors.push(this.error(rule.location, `Value is not a valid ${rule.format}`, rule.format, value));
    }
    return errors;
  }

  private matchesFormat(format: CustomRule["format"], value: string): boolean {
    switch (format) {
      case "uuid": return validateUuid(value);
      case "iban": return /^[A-Z]{2}\d{2}[A-Z0-9]{11,30}$/.test(value.replace(/\s/g, "").toUpperCase());
      case "bic": return /^[A-Z]{6}[A-Z0-9]{2}([A-Z0-9]{3})?$/.test(value.toUpperCase());
      case "lei": return /^[A-Z0-9]{18}\d{2}$/.test(value.toUpperCase());
      case "israeliId": return this.isIsraeliId(value);
      default: return true;
    }
  }
  private isIsraeliId(value: string): boolean {
    const digits = value.padStart(9, "0");
    if (!/^\d{9}$/.test(digits)) return false;
    return digits.split("").reduce((sum, digit, index) => { const n = Number(digit) * (index % 2 === 0 ? 1 : 2); return sum + (n > 9 ? n - 9 : n); }, 0) % 10 === 0;
  }
  private read(data: Record<string, unknown>, location: string): unknown {
    return location.replace(/^\$\.?/, "").split(".").filter(Boolean).reduce<unknown>((current, key) => current && typeof current === "object" ? (current as Record<string, unknown>)[key] : undefined, data);
  }
  private error(location: string, message: string, expected: unknown, actual: unknown): ValidationError {
    return { code: ValidationErrorCode.INVALID_FORMAT, keyword: ValidationErrorCode.INVALID_FORMAT, location, path: location, message, severity: ValidationSeverity.ERROR, expected, actual };
  }
}
