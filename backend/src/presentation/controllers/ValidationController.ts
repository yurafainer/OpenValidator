import { Request, Response } from "express";
import { inject, injectable } from "tsyringe";

import { UploadService } from "../../application/services/UploadService";
import { ValidationService } from "../../application/services/ValidationService";
import { ValidationMode } from "../../domain/validation/ValidationMode";
import { CustomRuleEngine, type CustomRule } from "../../application/rules/CustomRuleEngine";
import { ValidationReportService } from "../../application/services/ValidationReportService";
import { ValidationHistoryStore } from "../../application/history/ValidationHistoryStore";
import { SpecificationStore } from "../../application/specifications/SpecificationStore";

@injectable()
export class ValidationController {
  private readonly customRuleEngine = new CustomRuleEngine();
  private readonly reportService = new ValidationReportService();
  constructor(
    @inject(UploadService) private readonly uploadService: UploadService,
    @inject(ValidationService) private readonly validationService: ValidationService,
    @inject(ValidationHistoryStore) private readonly historyStore: ValidationHistoryStore,
    @inject(SpecificationStore) private readonly specificationStore: SpecificationStore,
  ) {}

  validate = async (req: Request, res: Response): Promise<void> => {
    const specification = await this.uploadService.getSpecification(req);
    const path = req.body.path;
    const method = req.body.method;

    if (!path || typeof path !== "string") {
      res.status(400).json({ message: "Path is required" });
      return;
    }
    if (!method || typeof method !== "string") {
      res.status(400).json({ message: "Method is required" });
      return;
    }

    const validationMode = this.parseValidationMode(req.body.validationMode, res);
    if (!validationMode) return;

    const headers = this.parseJsonObject(req.body.headers, "headers", res);
    if (headers === undefined && req.body.headers) return;
    const query = this.parseJsonObject(req.body.query, "query", res);
    if (query === undefined && req.body.query) return;
    const requestBody = this.parseJsonValue(req.body.requestBody, "requestBody", res);
    if (requestBody === undefined && req.body.requestBody) return;

    const responseHeaders = this.parseJsonObject(req.body.responseHeaders, "responseHeaders", res);
    if (responseHeaders === undefined && req.body.responseHeaders) return;
    const responseBody = this.parseJsonValue(req.body.responseBody, "responseBody", res);
    if (responseBody === undefined && req.body.responseBody) return;

    let statusCode: number | undefined;
    if (validationMode === ValidationMode.RESPONSE || validationMode === ValidationMode.FULL) {
      statusCode = Number(req.body.statusCode);
      if (!Number.isInteger(statusCode) || statusCode < 100 || statusCode > 599) {
        res.status(400).json({ message: "statusCode must be an integer between 100 and 599" });
        return;
      }
    }

    const result = await this.validationService.validate(specification, path, method, {
      validationMode,
      headers: headers ?? {},
      query: query ?? {},
      body: requestBody,
      response: statusCode === undefined ? undefined : {
        statusCode,
        headers: responseHeaders ?? {},
        body: responseBody,
      },
    });

    const rules = this.parseRules(req.body.rules, res);
    if (rules === undefined && req.body.rules) return;
    const enrichedResult = this.applyCustomRules(result as Record<string, unknown>, rules ?? [], {
      headers: headers ?? {},
      query: query ?? {},
      body: requestBody,
      response: { headers: responseHeaders ?? {}, body: responseBody, statusCode },
    });

    const specificationId = typeof req.body.specificationId === "string" ? req.body.specificationId : undefined;
    const storedSpecification = specificationId ? await this.specificationStore.get(specificationId) : undefined;
    await this.historyStore.add({
      specificationId,
      specificationName: storedSpecification?.name,
      specificationVersion: storedSpecification?.version,
      path,
      method: method.toUpperCase(),
      validationMode,
      valid: Boolean(enrichedResult.valid),
      errorCount: Array.isArray(enrichedResult.errors) ? enrichedResult.errors.length : 0,
      result: enrichedResult,
    });

    if (String(req.body.reportFormat ?? "").toUpperCase() === "HTML") {
      res.type("html").send(this.reportService.toHtml(enrichedResult));
      return;
    }
    res.json(enrichedResult);
  };

  private parseRules(value: unknown, res: Response): CustomRule[] | undefined {
    if (value === undefined || value === "") return [];
    const parsed = this.parseJsonValue(value, "rules", res);
    if (parsed === undefined) return undefined;
    if (!Array.isArray(parsed)) {
      res.status(400).json({ message: "rules must contain a JSON array" });
      return undefined;
    }
    return parsed as CustomRule[];
  }

  private applyCustomRules(result: Record<string, unknown>, rules: CustomRule[], data: Record<string, unknown>): Record<string, unknown> {
    if (rules.length === 0) return result;
    const customErrors = this.customRuleEngine.validate(rules, data);
    const existingErrors = Array.isArray(result.errors) ? result.errors : [];
    return {
      ...result,
      valid: Boolean(result.valid) && customErrors.length === 0,
      errors: [...existingErrors, ...customErrors],
      customRules: { evaluated: rules.length, failed: customErrors.length },
      message: Boolean(result.valid) && customErrors.length === 0 ? "Validation passed" : "Validation failed",
    };
  }

  private parseValidationMode(value: unknown, res: Response): ValidationMode | undefined {
    const normalized = String(value || ValidationMode.REQUEST).toUpperCase();
    if (!Object.values(ValidationMode).includes(normalized as ValidationMode)) {
      res.status(400).json({
        message: `validationMode must be one of: ${Object.values(ValidationMode).join(", ")}`,
      });
      return undefined;
    }
    return normalized as ValidationMode;
  }

  private parseJsonObject(value: unknown, fieldName: string, res: Response): Record<string, unknown> | undefined {
    if (value === undefined || value === "") return {};
    const parsed = this.parseJsonValue(value, fieldName, res);
    if (parsed === undefined) return undefined;
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      res.status(400).json({ message: `${fieldName} must contain a JSON object` });
      return undefined;
    }
    return parsed as Record<string, unknown>;
  }

  private parseJsonValue(value: unknown, fieldName: string, res: Response): unknown {
    if (value === undefined || value === "") return undefined;
    if (typeof value !== "string") return value;
    try {
      return JSON.parse(value);
    } catch {
      res.status(400).json({ message: `${fieldName} must contain valid JSON` });
      return undefined;
    }
  }
}
